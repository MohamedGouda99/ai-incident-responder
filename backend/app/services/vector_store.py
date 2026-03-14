import uuid
from datetime import datetime

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.core.config import get_settings
from app.core.logging import logger
from app.models.schemas import RunbookMetadata

settings = get_settings()


class VectorStoreService:
    def __init__(self) -> None:
        self._embeddings = OpenAIEmbeddings(
            openai_api_key=settings.openai_api_key,
            model="text-embedding-3-small",
        )
        self._client = chromadb.Client(ChromaSettings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=settings.chroma_persist_dir,
            anonymized_telemetry=False,
        )) if settings.chroma_persist_dir else chromadb.Client()

        self._collection_name = settings.chroma_collection
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n## ", "\n### ", "\n\n", "\n", ". ", " "],
        )
        self._vectorstore: Chroma | None = None
        self._runbooks: dict[str, RunbookMetadata] = {}

    def _get_vectorstore(self) -> Chroma:
        if self._vectorstore is None:
            self._vectorstore = Chroma(
                collection_name=self._collection_name,
                embedding_function=self._embeddings,
                client=self._client,
            )
        return self._vectorstore

    async def ingest_runbook(
        self, title: str, content: str, category: str = "general", tags: list[str] | None = None
    ) -> RunbookMetadata:
        tags = tags or []
        runbook_id = str(uuid.uuid4())

        chunks = self._splitter.split_text(content)
        metadatas = [
            {
                "runbook_id": runbook_id,
                "title": title,
                "category": category,
                "tags": ",".join(tags),
                "chunk_index": i,
            }
            for i in range(len(chunks))
        ]
        ids = [f"{runbook_id}_{i}" for i in range(len(chunks))]

        vs = self._get_vectorstore()
        vs.add_texts(texts=chunks, metadatas=metadatas, ids=ids)

        metadata = RunbookMetadata(
            id=runbook_id,
            title=title,
            category=category,
            tags=tags,
            chunk_count=len(chunks),
            created_at=datetime.utcnow(),
        )
        self._runbooks[runbook_id] = metadata

        logger.info("runbook_ingested", runbook_id=runbook_id, title=title, chunks=len(chunks))
        return metadata

    async def search(self, query: str, k: int = 5) -> list[dict]:
        vs = self._get_vectorstore()
        results = vs.similarity_search_with_relevance_scores(query, k=k)

        documents = []
        for doc, score in results:
            documents.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "relevance_score": round(score, 4),
            })

        logger.info("vector_search", query=query[:80], results=len(documents))
        return documents

    def get_retriever(self, k: int = 5):
        vs = self._get_vectorstore()
        return vs.as_retriever(search_kwargs={"k": k})

    async def list_runbooks(self) -> list[RunbookMetadata]:
        return list(self._runbooks.values())

    async def delete_runbook(self, runbook_id: str) -> bool:
        vs = self._get_vectorstore()
        collection = vs._collection
        results = collection.get(where={"runbook_id": runbook_id})

        if not results["ids"]:
            return False

        collection.delete(ids=results["ids"])
        self._runbooks.pop(runbook_id, None)

        logger.info("runbook_deleted", runbook_id=runbook_id)
        return True


vector_store = VectorStoreService()

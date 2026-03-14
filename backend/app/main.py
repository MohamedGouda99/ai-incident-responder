from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging, logger
from app.api.routes import router
from app.services.seed import seed_runbooks

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging(debug=settings.debug)
    logger.info("starting", app=settings.app_name)
    if settings.openai_api_key:
        await seed_runbooks()
    yield
    logger.info("shutting_down")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered incident response system with RAG-based runbook search",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix)


@app.get("/")
async def root() -> dict:
    return {"name": settings.app_name, "version": "1.0.0", "docs": "/docs"}

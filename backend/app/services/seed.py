import os
from pathlib import Path

from app.core.logging import logger
from app.services.vector_store import vector_store

RUNBOOKS_DIR = Path(__file__).parent.parent.parent / "runbooks"


async def seed_runbooks() -> None:
    if not RUNBOOKS_DIR.exists():
        logger.info("no_runbooks_dir", path=str(RUNBOOKS_DIR))
        return

    existing = await vector_store.list_runbooks()
    if existing:
        logger.info("runbooks_already_seeded", count=len(existing))
        return

    for file_path in RUNBOOKS_DIR.glob("*.md"):
        content = file_path.read_text(encoding="utf-8")
        title = content.split("\n")[0].lstrip("# ").strip() or file_path.stem
        category = "infrastructure"

        try:
            await vector_store.ingest_runbook(
                title=title,
                content=content,
                category=category,
                tags=[file_path.stem.replace("_", "-")],
            )
            logger.info("runbook_seeded", file=file_path.name, title=title)
        except Exception as e:
            logger.error("runbook_seed_failed", file=file_path.name, error=str(e))

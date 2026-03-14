from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "AI Incident Responder"
    debug: bool = False
    api_prefix: str = "/api/v1"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    chroma_persist_dir: str = "./data/chroma"
    chroma_collection: str = "runbooks"

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    max_remediation_timeout: int = 30
    enable_auto_remediation: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()

"""
Application settings loaded from environment variables via pydantic-settings.
All secrets are read from the environment – never hard-coded here.
"""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    app_env: Literal["development", "production", "test"] = "development"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "sqlite:///./spur_chat.db"

    # ── LLM ──────────────────────────────────────────────────────────────────
    llm_provider: Literal["anthropic", "openai", "gemini"] = "anthropic"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Cost-control knobs (documented in README)
    llm_context_window: int = 20   # max prior messages sent to the LLM
    llm_max_tokens: int = 512      # max tokens in a single LLM reply

    # ── Input validation ──────────────────────────────────────────────────────
    max_message_length: int = 2000  # characters

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

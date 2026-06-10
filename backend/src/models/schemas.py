"""
Pydantic schemas for request validation and response serialization.
These are the public contract of the API – keep them separate from ORM models.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from src.config import get_settings

settings = get_settings()


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's message text")
    session_id: Optional[str] = Field(
        None,
        description="Existing conversation ID. Omit to start a new conversation.",
    )

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message cannot be empty.")
        if len(stripped) > settings.max_message_length:
            # Truncate gracefully instead of rejecting (per spec)
            return stripped[: settings.max_message_length]
        return stripped


class ChatResponse(BaseModel):
    reply: str
    session_id: str


# ─── Messages ─────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    sender: Literal["user", "ai"]
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: str
    created_at: datetime
    messages: list[MessageOut] = []

    model_config = {"from_attributes": True}


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    provider: str

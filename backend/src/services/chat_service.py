"""
Chat Service – business logic layer.

Responsibilities:
  - Create / fetch conversations
  - Persist user & AI messages
  - Build history for LLM context
  - Delegate to llm_service for reply generation
"""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from src.models.orm import Conversation, Message, FAQEntry
from src.services.llm_service import HistoryMessage, generate_reply, LLMError
from src.utils.faq import find_faq_answer

logger = logging.getLogger(__name__)

# Friendly fallback shown to the user when the LLM fails
_LLM_ERROR_FALLBACK = (
    "Sorry, I'm having trouble connecting to the AI right now. "
    "Please try again in a moment, or reach out to support@example.com."
)


def get_or_create_conversation(db: Session, session_id: str | None) -> Conversation:
    """
    Return an existing conversation by ID, or create a fresh one.
    The returned object is already committed to the DB.
    """
    if session_id:
        conv = db.query(Conversation).filter(Conversation.id == session_id).first()
        if conv:
            return conv
        logger.warning("session_id %s not found – creating new conversation", session_id)

    conv = Conversation()
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def get_conversation_with_messages(
    db: Session, session_id: str
) -> Conversation | None:
    return (
        db.query(Conversation)
        .filter(Conversation.id == session_id)
        .first()
    )


def process_message(
    db: Session,
    session_id: str | None,
    user_text: str,
) -> tuple[str, str]:
    """
    Core chat handler.

    1. Resolve (or create) the conversation.
    2. Persist the user message.
    3. Build LLM history from DB.
    4. Call generate_reply; handle errors gracefully.
    5. Persist the AI reply.
    6. Return (ai_reply, conversation_id).
    """
    # 1. Conversation
    conv = get_or_create_conversation(db, session_id)

    # 2. Persist user message
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        text=user_text,
    )
    db.add(user_msg)
    db.commit()

    # 3. Build history (includes the message just saved)
    db.refresh(conv)
    history: list[HistoryMessage] = []
    for msg in conv.messages:
        role = "user" if msg.sender == "user" else "assistant"
        history.append(HistoryMessage(role=role, content=msg.text))

    # 4. Load FAQ from DB (falls back to hard-coded in llm_service if empty)
    faq_rows = db.query(FAQEntry).all()
    faq_list = (
        [{"category": f.category, "question": f.question, "answer": f.answer}
         for f in faq_rows]
        if faq_rows else None
    )

    # 5. Generate reply — use canned FAQ when the question matches (no LLM needed)
    ai_text: str
    faq_answer = find_faq_answer(user_text, faq_list)
    if faq_answer:
        logger.info("FAQ direct match for conversation %s", conv.id)
        ai_text = faq_answer
    else:
        try:
            ai_text = generate_reply(history, faq_list)
        except LLMError as exc:
            logger.error("LLM error for conversation %s: %s", conv.id, exc)
            ai_text = _LLM_ERROR_FALLBACK

    # 6. Persist AI reply
    ai_msg = Message(
        conversation_id=conv.id,
        sender="ai",
        text=ai_text,
    )
    db.add(ai_msg)
    db.commit()

    return ai_text, conv.id

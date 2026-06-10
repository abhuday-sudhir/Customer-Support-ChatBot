"""
Chat router – all /chat/* endpoints live here.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db import get_db
from src.models.schemas import (
    ChatRequest,
    ChatResponse,
    ConversationOut,
    MessageOut,
)
from src.services.chat_service import (
    process_message,
    get_conversation_with_messages,
)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post(
    "/message",
    response_model=ChatResponse,
    summary="Send a message and get an AI reply",
)
def send_message(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Accepts a user message (and optional sessionId), persists it,
    calls the LLM, persists the reply, and returns both the reply
    and the sessionId.
    """
    reply, session_id = process_message(
        db=db,
        session_id=payload.session_id,
        user_text=payload.message,
    )
    return ChatResponse(reply=reply, session_id=session_id)


@router.get(
    "/history/{session_id}",
    response_model=ConversationOut,
    summary="Fetch full conversation history by session ID",
)
def get_history(session_id: str, db: Session = Depends(get_db)):
    """
    Returns all messages for a given conversation / session.
    Used on page reload to restore chat history.
    """
    conv = get_conversation_with_messages(db, session_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{session_id}' not found.",
        )
    return ConversationOut(
        id=conv.id,
        created_at=conv.created_at,
        messages=[
            MessageOut(
                id=m.id,
                sender=m.sender,
                text=m.text,
                created_at=m.created_at,
            )
            for m in conv.messages
        ],
    )

"""
Health / meta endpoints.
"""
from fastapi import APIRouter

from src.config import get_settings
from src.models.schemas import HealthResponse

router = APIRouter(tags=["meta"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", provider=settings.llm_provider)

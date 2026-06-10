"""
Global exception handlers – ensure unhandled errors return JSON,
never crash the server, and never expose stack traces in production.
"""
import logging

from fastapi import Request
from fastapi.responses import JSONResponse

from src.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    detail = str(exc) if settings.app_env == "development" else "An internal error occurred."
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )

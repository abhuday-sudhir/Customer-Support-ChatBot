"""
FastAPI application entry point.

Layer structure:
  main.py              – app wiring, lifespan, CORS
  src/routes/          – HTTP layer (request/response only)
  src/services/        – business logic
  src/db/              – database session & engine
  src/models/          – ORM models (orm.py) + Pydantic schemas (schemas.py)
  src/utils/           – shared helpers (FAQ knowledge, prompt builder)
  src/middleware/      – cross-cutting concerns (error handling)
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.db.database import Base, engine
from src.db.seed import seed
from src.middleware.error_handler import unhandled_exception_handler
from src.routes.chat import router as chat_router
from src.routes.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Starting up – creating tables & seeding FAQ…")
    Base.metadata.create_all(bind=engine)
    seed()
    logger.info("Startup complete. LLM provider: %s", settings.llm_provider)
    yield
    logger.info("Shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Spur Chat API",
    description="AI live-chat agent backend for customer chat support.",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Exception handlers ───────────────────────────────────────────────────────

app.add_exception_handler(Exception, unhandled_exception_handler)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(health_router)
app.include_router(chat_router)

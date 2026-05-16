from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, logger
from app.db.init_db import check_db_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("Starting ValueMySaaS API | env=%s", settings.APP_ENV)
    await check_db_connection()
    yield
    logger.info("Shutting down ValueMySaaS API")


app = FastAPI(
    title="ValueMySaaS API",
    description="Backend API for the ValueMySaaS platform",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "env": settings.APP_ENV}

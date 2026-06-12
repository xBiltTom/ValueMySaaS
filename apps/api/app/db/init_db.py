import os

from alembic.config import Config
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401


def _get_alembic_cfg() -> Config:
    cfg = Config(os.path.join(os.path.dirname(__file__), "../..", "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    return cfg


def do_run_migrations(connection: Connection) -> None:
    from alembic import context
    context.configure(
        connection=connection,
        target_metadata=Base.metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def check_db_connection() -> None:
    """Verify database connectivity at startup."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection verified.")
    except Exception as exc:
        logger.error("Database connection failed: %s", exc)
        raise


async def run_migrations() -> None:
    """Run Alembic migrations at startup using the async engine directly."""
    try:
        logger.info("Running database migrations...")
        alembic_cfg = _get_alembic_cfg()
        connectable = async_engine_from_config(
            alembic_cfg.get_section(alembic_cfg.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
        async with connectable.connect() as conn:
            await conn.run_sync(do_run_migrations)
        await connectable.dispose()
        logger.info("Migrations completed successfully.")
    except Exception as exc:
        logger.error("Migration error: %s", exc)
        raise

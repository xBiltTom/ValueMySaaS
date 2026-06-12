import asyncio
import sys

from app.core.logging import logger
from app.db.session import engine


async def check_db_connection() -> None:
    """Verify database connectivity at startup."""
    try:
        async with engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection verified.")
    except Exception as exc:
        logger.error("Database connection failed: %s", exc)
        raise


async def run_migrations() -> None:
    """Run Alembic migrations at startup."""
    try:
        logger.info("Running database migrations...")
        process = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "alembic", "upgrade", "head",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            logger.error("Migration failed:\n%s", stderr.decode())
            raise RuntimeError(f"Alembic migration failed: {stderr.decode()}")
        logger.info("Migrations completed successfully.")
        if stdout:
            logger.info("Migration output: %s", stdout.decode().strip())
    except Exception as exc:
        logger.error("Migration error: %s", exc)
        raise

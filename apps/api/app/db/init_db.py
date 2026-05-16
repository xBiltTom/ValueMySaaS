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

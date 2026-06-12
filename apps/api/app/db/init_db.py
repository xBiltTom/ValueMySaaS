import os

from sqlalchemy import text

from app.core.logging import logger
from app.db.session import engine
import app.models  # noqa: F401


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
    """Run Alembic migrations at startup.

    To avoid import shadowing of the top-level `alembic` package by the
    project's local `alembic` directory, run the installed alembic CLI
    executable (from the virtualenv) as a subprocess and point it to the
    repository's alembic.ini file.
    """
    try:
        logger.info("Running database migrations (via alembic CLI)...")
        import asyncio
        import sys

        repo_alembic_ini = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../..", "alembic.ini")
        )

        # Prefer the alembic script that lives next to the current python
        # executable in the virtualenv, fallback to system `alembic` in PATH.
        venv_alembic = os.path.join(os.path.dirname(sys.executable), "alembic")
        if os.path.exists(venv_alembic) and os.access(venv_alembic, os.X_OK):
            cmd = [venv_alembic, "-c", repo_alembic_ini, "upgrade", "head"]
        else:
            cmd = ["alembic", "-c", repo_alembic_ini, "upgrade", "head"]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")),
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            err = stderr.decode().strip() if stderr else ""
            logger.error("Migration failed: %s", err)
            raise RuntimeError(f"Alembic migration failed: {err}")
        if stdout:
            logger.info("Migration output: %s", stdout.decode().strip())
        logger.info("Migrations completed successfully.")
    except Exception as exc:
        logger.error("Migration error: %s", exc)
        raise

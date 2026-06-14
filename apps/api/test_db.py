import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5433/valuemysaas")
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, period_label, custom_metrics FROM saas_metric_snapshots WHERE saas_project_id = '68d17392-61bc-4cfe-91d1-8f0c1b4eca00'"))
        rows = result.fetchall()
        for r in rows:
            print(dict(r._mapping))

asyncio.run(main())

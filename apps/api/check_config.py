import asyncio
from app.db.session import AsyncSessionLocal
from app.models.system_config import SystemConfig
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(SystemConfig))
        configs = result.scalars().all()
        for c in configs:
            print(f"Key: {c.key}, Value: '{c.value}'")

if __name__ == "__main__":
    asyncio.run(main())

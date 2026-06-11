import asyncio
from app.db.session import AsyncSessionLocal
from app.models.ai_provider_key import AiProviderKey
from app.models.system_ai_key import SystemAiKey
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        print("--- USER KEYS ---")
        user_keys = (await db.execute(select(AiProviderKey))).scalars().all()
        for k in user_keys:
            print(f"ID: {k.id}, Provider: {k.provider}, Label: {k.label}")
        
        print("--- SYSTEM KEYS ---")
        sys_keys = (await db.execute(select(SystemAiKey))).scalars().all()
        for k in sys_keys:
            print(f"ID: {k.id}, Provider: {k.provider}, Label: {k.label}")

asyncio.run(main())

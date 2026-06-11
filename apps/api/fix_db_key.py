import asyncio
from app.db.session import AsyncSessionLocal
from app.models.ai_provider_key import AiProviderKey
from sqlalchemy import select, update

async def main():
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(AiProviderKey)
            .where(AiProviderKey.provider == "OTHER", AiProviderKey.label == "Groq")
            .values(provider="GROQ")
        )
        await db.commit()
        print("Updated provider to GROQ for the user's key.")

asyncio.run(main())

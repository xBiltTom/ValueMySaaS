import asyncio
from app.db.session import AsyncSessionLocal
from app.models.ai_provider_key import AiProviderKey
from app.core.security import decrypt_api_key
import urllib.request
import json
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AiProviderKey).where(AiProviderKey.provider == "GROQ"))
        keys = result.scalars().all()
        for k in keys:
            print(f"Testing key: {k.label}")
            api_key = decrypt_api_key(k.encrypted_api_key)
            req = urllib.request.Request("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {api_key}", "User-Agent": "Mozilla/5.0"})
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    print("Success!", len(data.get("data", [])))
            except Exception as e:
                print("Error:", e)
                if hasattr(e, "read"):
                    print(e.read().decode("utf-8"))

asyncio.run(main())

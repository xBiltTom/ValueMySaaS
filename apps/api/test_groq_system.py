import asyncio
from app.db.session import AsyncSessionLocal
from app.models.system_ai_key import SystemAiKey
from app.core.security import decrypt_api_key
from sqlalchemy import select
import urllib.request
import json

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(SystemAiKey).where(SystemAiKey.provider == "GROQ"))
        keys = result.scalars().all()
        if not keys:
            print("No system keys found for GROQ")
        for k in keys:
            print(f"Testing system key: {k.label}")
            api_key = decrypt_api_key(k.encrypted_api_key)
            req = urllib.request.Request("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {api_key}", "User-Agent": "Mozilla/5.0"})
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    print("Success! Models count:", len(data.get("data", [])))
            except Exception as e:
                print("Error:", e)
                if hasattr(e, "read"):
                    print(e.read().decode("utf-8"))

asyncio.run(main())

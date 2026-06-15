import asyncio
import logging
from uuid import UUID

from app.db.session import AsyncSessionLocal
from app.repositories.chatgpt_web_account_repository import ChatGptWebAccountRepository
from app.services.chatgpt_web_account_service import ChatGptWebAccountService

logging.basicConfig(level=logging.DEBUG)

async def test():
    async with AsyncSessionLocal() as session:
        repo = ChatGptWebAccountRepository(session)
        service = ChatGptWebAccountService(repo)
        
        # Get all accounts
        accounts = await repo.list_all()
        for acc in accounts:
            print(f"Testing account {acc.email} (ID: {acc.id})")
            result = await service.verify_account(acc.id)
            print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(test())

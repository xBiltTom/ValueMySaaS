from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chatgpt_web_account import ChatGptWebAccount


class ChatGptWebAccountRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, data: dict) -> ChatGptWebAccount:
        account = ChatGptWebAccount(**data)
        self.db.add(account)
        await self.db.flush()
        await self.db.refresh(account)
        return account

    async def get_by_id(self, account_id: UUID) -> ChatGptWebAccount | None:
        result = await self.db.execute(
            select(ChatGptWebAccount).where(
                ChatGptWebAccount.id == account_id,
                ChatGptWebAccount.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_all(
        self, *, active_only: bool = False, limit: int = 50, offset: int = 0
    ) -> list[ChatGptWebAccount]:
        query = select(ChatGptWebAccount).where(ChatGptWebAccount.deleted_at.is_(None))
        if active_only:
            query = query.where(
                ChatGptWebAccount.is_active.is_(True),
                ChatGptWebAccount.is_locked.is_(False),
            )
        query = query.order_by(ChatGptWebAccount.priority).offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_all(self, *, active_only: bool = False) -> int:
        query = select(func.count()).select_from(ChatGptWebAccount).where(
            ChatGptWebAccount.deleted_at.is_(None)
        )
        if active_only:
            query = query.where(
                ChatGptWebAccount.is_active.is_(True),
                ChatGptWebAccount.is_locked.is_(False),
            )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def update(self, *, account: ChatGptWebAccount, data: dict) -> ChatGptWebAccount:
        for key, value in data.items():
            setattr(account, key, value)
        await self.db.flush()
        await self.db.refresh(account)
        return account

    async def soft_delete(self, *, account: ChatGptWebAccount) -> None:
        from datetime import datetime, timezone
        account.deleted_at = datetime.now(timezone.utc)
        account.is_active = False
        await self.db.flush()

    async def get_next_available(self) -> ChatGptWebAccount | None:
        query = (
            select(ChatGptWebAccount)
            .where(
                ChatGptWebAccount.deleted_at.is_(None),
                ChatGptWebAccount.is_active.is_(True),
                ChatGptWebAccount.is_locked.is_(False),
                ChatGptWebAccount.encrypted_session_token.isnot(None),
            )
            .order_by(ChatGptWebAccount.priority)
            .limit(1)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

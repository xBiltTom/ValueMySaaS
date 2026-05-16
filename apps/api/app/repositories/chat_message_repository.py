from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_message import ChatMessage


class ChatMessageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, data: dict) -> ChatMessage:
        message = ChatMessage(**data)
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def list_by_conversation(
        self,
        *,
        conversation_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_conversation(self, *, conversation_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(ChatMessage).where(ChatMessage.conversation_id == conversation_id)
        )
        return result.scalar_one()

    async def list_recent_by_conversation(self, *, conversation_id: UUID, limit: int = 10) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        messages = list(result.scalars().all())
        messages.reverse()
        return messages

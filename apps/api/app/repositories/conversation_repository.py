from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_conversation import ChatConversation
from app.models.enums import ConversationStatus


class ConversationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, data: dict) -> ChatConversation:
        conversation = ChatConversation(**data)
        self.db.add(conversation)
        await self.db.flush()
        await self.db.refresh(conversation)
        return conversation

    async def list_by_project_user(
        self,
        *,
        saas_project_id: UUID,
        user_id: UUID,
        status: ConversationStatus | None = None,
        include_deleted: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ChatConversation]:
        statement = self._project_user_query(
            saas_project_id=saas_project_id,
            user_id=user_id,
            status=status,
            include_deleted=include_deleted,
        )
        statement = statement.order_by(ChatConversation.updated_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def count_by_project_user(
        self,
        *,
        saas_project_id: UUID,
        user_id: UUID,
        status: ConversationStatus | None = None,
        include_deleted: bool = False,
    ) -> int:
        statement = self._project_user_query(
            saas_project_id=saas_project_id,
            user_id=user_id,
            status=status,
            include_deleted=include_deleted,
        )
        result = await self.db.execute(select(func.count()).select_from(statement.subquery()))
        return result.scalar_one()

    async def get_by_id_for_project_user(
        self,
        *,
        conversation_id: UUID,
        saas_project_id: UUID,
        user_id: UUID,
        include_deleted: bool = False,
    ) -> ChatConversation | None:
        statement = select(ChatConversation).where(
            ChatConversation.id == conversation_id,
            ChatConversation.saas_project_id == saas_project_id,
            ChatConversation.user_id == user_id,
        )
        if not include_deleted:
            statement = statement.where(ChatConversation.status != ConversationStatus.DELETED)
        result = await self.db.execute(statement)
        return result.scalar_one_or_none()

    async def update(self, *, conversation: ChatConversation, data: dict) -> ChatConversation:
        for field, value in data.items():
            setattr(conversation, field, value)
        conversation.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(conversation)
        return conversation

    async def soft_delete(self, *, conversation: ChatConversation) -> None:
        conversation.status = ConversationStatus.DELETED
        conversation.deleted_at = datetime.now(timezone.utc)
        conversation.updated_at = conversation.deleted_at
        await self.db.flush()

    async def touch(self, *, conversation: ChatConversation) -> ChatConversation:
        conversation.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(conversation)
        return conversation

    def _project_user_query(
        self,
        *,
        saas_project_id: UUID,
        user_id: UUID,
        status: ConversationStatus | None,
        include_deleted: bool,
    ):
        statement = select(ChatConversation).where(
            ChatConversation.saas_project_id == saas_project_id,
            ChatConversation.user_id == user_id,
        )
        if status is not None:
            statement = statement.where(ChatConversation.status == status)
        elif not include_deleted:
            statement = statement.where(ChatConversation.status != ConversationStatus.DELETED)
        return statement

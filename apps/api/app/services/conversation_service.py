from uuid import UUID

from fastapi import HTTPException, status

from app.models.chat_conversation import ChatConversation
from app.models.enums import ConversationStatus
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.schemas.conversation import ConversationCreate, ConversationListResponse, ConversationUpdate


class ConversationService:
    def __init__(
        self,
        saas_project_repository: SaasProjectRepository,
        conversation_repository: ConversationRepository,
    ) -> None:
        self.saas_project_repository = saas_project_repository
        self.conversation_repository = conversation_repository

    async def create_conversation(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        payload: ConversationCreate,
    ) -> ChatConversation:
        project = await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        return await self.conversation_repository.create(
            data={
                "saas_project_id": project_id,
                "user_id": owner_id,
                "title": payload.title or f"Chat sobre {project.name}",
                "status": ConversationStatus.ACTIVE,
                "system_prompt_version": "v1",
            }
        )

    async def list_conversations(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        status_filter: ConversationStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> ConversationListResponse:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        include_deleted = status_filter == ConversationStatus.DELETED
        items = await self.conversation_repository.list_by_project_user(
            saas_project_id=project_id,
            user_id=owner_id,
            status=status_filter,
            include_deleted=include_deleted,
            limit=limit,
            offset=offset,
        )
        total = await self.conversation_repository.count_by_project_user(
            saas_project_id=project_id,
            user_id=owner_id,
            status=status_filter,
            include_deleted=include_deleted,
        )
        return ConversationListResponse(items=items, total=total, limit=limit, offset=offset)

    async def get_conversation(
        self,
        *,
        project_id: UUID,
        conversation_id: UUID,
        owner_id: UUID,
    ) -> ChatConversation:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        conversation = await self.conversation_repository.get_by_id_for_project_user(
            conversation_id=conversation_id,
            saas_project_id=project_id,
            user_id=owner_id,
        )
        if conversation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        return conversation

    async def update_conversation(
        self,
        *,
        project_id: UUID,
        conversation_id: UUID,
        owner_id: UUID,
        payload: ConversationUpdate,
    ) -> ChatConversation:
        conversation = await self.get_conversation(
            project_id=project_id,
            conversation_id=conversation_id,
            owner_id=owner_id,
        )
        data = payload.model_dump(exclude_unset=True)
        if data.get("status") == ConversationStatus.DELETED:
            await self.conversation_repository.soft_delete(conversation=conversation)
            return conversation
        return await self.conversation_repository.update(conversation=conversation, data=data)

    async def delete_conversation(
        self,
        *,
        project_id: UUID,
        conversation_id: UUID,
        owner_id: UUID,
    ) -> None:
        conversation = await self.get_conversation(
            project_id=project_id,
            conversation_id=conversation_id,
            owner_id=owner_id,
        )
        await self.conversation_repository.soft_delete(conversation=conversation)

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID):
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")
        return project

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_chat_service, get_conversation_service, get_current_user
from app.models.enums import ConversationStatus
from app.models.user import User
from app.schemas.chat_message import ChatMessageListResponse, SendChatMessageRequest, SendChatMessageResponse
from app.schemas.conversation import (
    ConversationCreate,
    ConversationListResponse,
    ConversationRead,
    ConversationUpdate,
)
from app.services.chat_service import ChatService
from app.services.conversation_service import ConversationService

router = APIRouter(
    prefix="/saas-projects/{project_id}/conversations",
    tags=["Conversations"],
)


@router.post("", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    project_id: UUID,
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    return await conversation_service.create_conversation(
        project_id=project_id,
        owner_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    project_id: UUID,
    status_filter: ConversationStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    return await conversation_service.list_conversations(
        project_id=project_id,
        owner_id=current_user.id,
        status_filter=status_filter,
        limit=limit,
        offset=offset,
    )


@router.get("/{conversation_id}", response_model=ConversationRead)
async def get_conversation(
    project_id: UUID,
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    return await conversation_service.get_conversation(
        project_id=project_id,
        conversation_id=conversation_id,
        owner_id=current_user.id,
    )


@router.patch("/{conversation_id}", response_model=ConversationRead)
async def update_conversation(
    project_id: UUID,
    conversation_id: UUID,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    return await conversation_service.update_conversation(
        project_id=project_id,
        conversation_id=conversation_id,
        owner_id=current_user.id,
        payload=payload,
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    project_id: UUID,
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    conversation_service: ConversationService = Depends(get_conversation_service),
) -> Response:
    await conversation_service.delete_conversation(
        project_id=project_id,
        conversation_id=conversation_id,
        owner_id=current_user.id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{conversation_id}/messages", response_model=ChatMessageListResponse)
async def list_messages(
    project_id: UUID,
    conversation_id: UUID,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    return await chat_service.list_messages(
        project_id=project_id,
        conversation_id=conversation_id,
        owner_id=current_user.id,
        limit=limit,
        offset=offset,
    )


@router.post("/{conversation_id}/messages", response_model=SendChatMessageResponse)
async def send_message(
    project_id: UUID,
    conversation_id: UUID,
    payload: SendChatMessageRequest,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    return await chat_service.send_message(
        project_id=project_id,
        conversation_id=conversation_id,
        owner_id=current_user.id,
        payload=payload,
    )

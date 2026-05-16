from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_ai_key_service, get_current_user
from app.models.enums import AiProvider
from app.models.user import User
from app.schemas.ai_key import (
    AiProviderKeyCreate,
    AiProviderKeyListResponse,
    AiProviderKeyRead,
    AiProviderKeyUpdate,
)
from app.services.ai_key_service import AiProviderKeyService

router = APIRouter(prefix="/ai/keys", tags=["AI Keys"])


@router.post("", response_model=AiProviderKeyRead, status_code=status.HTTP_201_CREATED)
async def create_ai_key(
    payload: AiProviderKeyCreate,
    current_user: User = Depends(get_current_user),
    ai_key_service: AiProviderKeyService = Depends(get_ai_key_service),
):
    return await ai_key_service.create_key(user_id=current_user.id, payload=payload)


@router.get("", response_model=AiProviderKeyListResponse)
async def list_ai_keys(
    provider: AiProvider | None = Query(default=None),
    active_only: bool = Query(default=False),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    ai_key_service: AiProviderKeyService = Depends(get_ai_key_service),
):
    return await ai_key_service.list_keys(
        user_id=current_user.id,
        provider=provider,
        active_only=active_only,
        limit=limit,
        offset=offset,
    )


@router.get("/{key_id}", response_model=AiProviderKeyRead)
async def get_ai_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    ai_key_service: AiProviderKeyService = Depends(get_ai_key_service),
):
    return await ai_key_service.get_key(key_id=key_id, user_id=current_user.id)


@router.patch("/{key_id}", response_model=AiProviderKeyRead)
async def update_ai_key(
    key_id: UUID,
    payload: AiProviderKeyUpdate,
    current_user: User = Depends(get_current_user),
    ai_key_service: AiProviderKeyService = Depends(get_ai_key_service),
):
    return await ai_key_service.update_key(
        key_id=key_id,
        user_id=current_user.id,
        payload=payload,
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ai_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    ai_key_service: AiProviderKeyService = Depends(get_ai_key_service),
) -> Response:
    await ai_key_service.delete_key(key_id=key_id, user_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

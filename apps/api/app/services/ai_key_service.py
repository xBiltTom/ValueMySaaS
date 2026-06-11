from uuid import UUID

from fastapi import HTTPException, status

from app.core.security import decrypt_api_key, encrypt_api_key
from app.models.ai_provider_key import AiProviderKey
from app.models.enums import AiProvider
from app.repositories.ai_key_repository import AiProviderKeyRepository
from app.schemas.ai_key import AiProviderKeyCreate, AiProviderKeyListResponse, AiProviderKeyUpdate
from app.schemas.ai_key import AiProviderKeyVerifyResponse
from app.services.llm_client_service import LlmClientService


class AiProviderKeyService:
    def __init__(
        self,
        ai_key_repository: AiProviderKeyRepository,
        llm_client_service: LlmClientService | None = None,
    ) -> None:
        self.ai_key_repository = ai_key_repository
        self.llm_client_service = llm_client_service or LlmClientService()

    async def create_key(self, *, user_id: UUID, payload: AiProviderKeyCreate) -> AiProviderKey:
        await self._ensure_not_duplicate(user_id=user_id, provider=payload.provider, label=payload.label)
        encrypted_key = self._encrypt(payload.api_key)
        return await self.ai_key_repository.create(
            data={
                "user_id": user_id,
                "provider": payload.provider,
                "label": payload.label,
                "encrypted_api_key": encrypted_key,
                "key_last_four": payload.api_key[-4:],
                "is_active": True,
            }
        )

    async def list_keys(
        self,
        *,
        user_id: UUID,
        provider: AiProvider | None = None,
        active_only: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> AiProviderKeyListResponse:
        items = await self.ai_key_repository.list_by_user(
            user_id=user_id,
            provider=provider,
            active_only=active_only,
            limit=limit,
            offset=offset,
        )
        total = await self.ai_key_repository.count_by_user(
            user_id=user_id,
            provider=provider,
            active_only=active_only,
        )
        return AiProviderKeyListResponse(items=items, total=total, limit=limit, offset=offset)

    async def get_key(self, *, key_id: UUID, user_id: UUID) -> AiProviderKey:
        key = await self.ai_key_repository.get_by_id_for_user(key_id=key_id, user_id=user_id)
        if key is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI provider key not found")
        return key

    async def update_key(
        self,
        *,
        key_id: UUID,
        user_id: UUID,
        payload: AiProviderKeyUpdate,
    ) -> AiProviderKey:
        key = await self.get_key(key_id=key_id, user_id=user_id)
        data = payload.model_dump(exclude_unset=True)
        if "label" in data and data["label"] != key.label:
            await self._ensure_not_duplicate(user_id=user_id, provider=key.provider, label=data["label"])
        if "api_key" in data:
            plain_key = data.pop("api_key")
            data["encrypted_api_key"] = self._encrypt(plain_key)
            data["key_last_four"] = plain_key[-4:]
        return await self.ai_key_repository.update(key=key, data=data)

    async def delete_key(self, *, key_id: UUID, user_id: UUID) -> None:
        key = await self.get_key(key_id=key_id, user_id=user_id)
        await self.ai_key_repository.soft_delete(key=key)

    async def verify_key(
        self,
        *,
        user_id: UUID,
        key_id: UUID,
        model_name: str | None = None,
    ) -> AiProviderKeyVerifyResponse:
        key, api_key = await self.get_decrypted_key_for_user(key_id=key_id, user_id=user_id)
        response = await self.llm_client_service.verify_connection(
            provider=key.provider,
            api_key=api_key,
            model_name=model_name,
        )
        return AiProviderKeyVerifyResponse(
            ok=True,
            provider=key.provider,
            model_name=response.model_name or model_name or "",
            message="AI key verified successfully.",
        )

    async def list_models(
        self,
        *,
        user_id: UUID,
        key_id: UUID,
    ):
        from app.schemas.ai_key import AiModelListResponse, AiModelItem
        key, api_key = await self.get_decrypted_key_for_user(key_id=key_id, user_id=user_id)
        
        models = await self.llm_client_service.list_provider_models(
            provider=key.provider,
            api_key=api_key
        )
        return AiModelListResponse(
            items=[AiModelItem(id=m["id"], name=m["name"]) for m in models],
            provider=key.provider
        )

    async def get_decrypted_key_for_user(self, *, key_id: UUID, user_id: UUID) -> tuple[AiProviderKey, str]:
        key = await self.ai_key_repository.get_active_by_id_for_user(key_id=key_id, user_id=user_id)
        if key is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active AI provider key not found")
        try:
            return key, decrypt_api_key(key.encrypted_api_key)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI key decryption is not configured correctly",
            ) from exc

    async def _ensure_not_duplicate(
        self,
        *,
        user_id: UUID,
        provider: AiProvider,
        label: str | None,
    ) -> None:
        existing = await self.ai_key_repository.get_by_user_provider_label(
            user_id=user_id,
            provider=provider,
            label=label,
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An active AI key with this provider and label already exists",
            )

    def _encrypt(self, plain_key: str) -> str:
        try:
            return encrypt_api_key(plain_key)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI key encryption is not configured correctly",
            ) from exc

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AiProvider


class AiProviderKeyCreate(BaseModel):
    provider: AiProvider
    label: str | None = Field(default=None, max_length=100)
    api_key: str = Field(min_length=1)


class AiProviderKeyUpdate(BaseModel):
    label: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None
    api_key: str | None = Field(default=None, min_length=1)


class AiProviderKeyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: AiProvider
    label: str | None
    key_last_four: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AiProviderKeyListResponse(BaseModel):
    items: list[AiProviderKeyRead]
    total: int
    limit: int
    offset: int


class AiProviderKeyVerifyRequest(BaseModel):
    model_name: str | None = Field(default=None, max_length=100)


class AiProviderKeyVerifyResponse(BaseModel):
    ok: bool
    provider: AiProvider
    model_name: str
    message: str

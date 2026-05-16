from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AiProvider, ConversationStatus


class ConversationCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class ConversationUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    status: ConversationStatus | None = None


class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    saas_project_id: UUID
    user_id: UUID
    title: str | None
    provider: AiProvider | None
    model_name: str | None
    system_prompt_version: str
    status: ConversationStatus
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class ConversationListResponse(BaseModel):
    items: list[ConversationRead]
    total: int
    limit: int
    offset: int

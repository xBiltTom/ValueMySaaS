from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AiProvider, ChatRole


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: ChatRole
    content: str
    message_metadata: dict[str, Any] | None = None
    token_count: int | None = None
    created_at: datetime


class ChatMessageListResponse(BaseModel):
    items: list[ChatMessageRead]
    total: int
    limit: int
    offset: int


class SendChatMessageRequest(BaseModel):
    ai_key_id: UUID | None = Field(
        default=None,
        description="ID de tu API Key propia. Si no se provee, se usarán créditos del sistema.",
    )
    use_system_credits: bool = Field(
        default=False,
        description="Indica si se deben usar créditos del sistema explícitamente.",
    )
    model_name: str | None = Field(default=None, max_length=100)
    message: str | None = Field(default=None, max_length=4000)
    messages: list[dict[str, Any]] | None = Field(default=None, description="Requerido por Vercel AI SDK useChat")


class SendChatMessageResponse(BaseModel):
    conversation_id: UUID
    user_message: ChatMessageRead
    assistant_message: ChatMessageRead
    model_name: str
    provider: AiProvider

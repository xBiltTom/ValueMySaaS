from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AiAnalysisType, AiProvider


class AiAnalysisCreate(BaseModel):
    ai_key_id: UUID
    analysis_type: AiAnalysisType
    model_name: str | None = Field(default=None, max_length=100)
    custom_question: str | None = Field(default=None, max_length=2000)


class AiAnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    saas_project_id: UUID
    metric_snapshot_id: UUID | None
    score_id: UUID | None
    user_id: UUID
    provider: AiProvider
    model_name: str | None
    analysis_type: AiAnalysisType
    prompt_version: str
    input_context: dict[str, Any] | None
    output_text: str
    output_json: dict[str, Any] | None
    tokens_input: int | None
    tokens_output: int | None
    estimated_cost: Decimal | None
    created_at: datetime


class AiAnalysisListItem(AiAnalysisRead):
    pass


class AiAnalysisListResponse(BaseModel):
    items: list[AiAnalysisListItem]
    total: int
    limit: int
    offset: int

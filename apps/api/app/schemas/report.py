from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import ReportStatus, ReportType


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    saas_project_id: UUID
    user_id: UUID
    metric_snapshot_id: UUID | None
    score_id: UUID | None
    ai_analysis_id: UUID | None
    title: str
    report_type: ReportType
    status: ReportStatus
    content: dict[str, Any] | None
    file_url: str | None
    generated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ReportListItem(ReportRead):
    pass


class ReportListResponse(BaseModel):
    items: list[ReportListItem]
    total: int
    limit: int
    offset: int

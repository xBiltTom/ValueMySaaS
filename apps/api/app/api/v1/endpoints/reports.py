from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_report_service
from app.models.enums import ReportType
from app.models.user import User
from app.schemas.report import ReportListResponse, ReportRead
from app.services.report_service import ReportService

router = APIRouter(
    prefix="/saas-projects/{project_id}/reports",
    tags=["Reports"],
)


@router.post("/generate", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
async def generate_report(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    # We use executive report as the standard 'general' report under the hood
    return await report_service.generate_executive_report(
        project_id=project_id,
        owner_id=current_user.id,
    )


@router.get("", response_model=ReportListResponse)
async def list_reports(
    project_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    report_type: ReportType | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return await report_service.list_reports(
        project_id=project_id,
        owner_id=current_user.id,
        limit=limit,
        offset=offset,
        report_type=report_type,
    )


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(
    project_id: UUID,
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return await report_service.get_report(
        project_id=project_id,
        report_id=report_id,
        owner_id=current_user.id,
    )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    project_id: UUID,
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    await report_service.delete_report(
        project_id=project_id,
        report_id=report_id,
        owner_id=current_user.id,
    )

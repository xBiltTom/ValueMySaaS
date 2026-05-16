from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_ai_analysis_service, get_current_user
from app.models.enums import AiAnalysisType
from app.models.user import User
from app.schemas.ai_analysis import AiAnalysisCreate, AiAnalysisListResponse, AiAnalysisRead
from app.services.ai_analysis_service import AiAnalysisService

router = APIRouter(
    prefix="/saas-projects/{project_id}/ai-analyses",
    tags=["AI Analyses"],
)


@router.post("", response_model=AiAnalysisRead, status_code=status.HTTP_201_CREATED)
async def generate_ai_analysis(
    project_id: UUID,
    payload: AiAnalysisCreate,
    current_user: User = Depends(get_current_user),
    ai_analysis_service: AiAnalysisService = Depends(get_ai_analysis_service),
):
    return await ai_analysis_service.generate_analysis(
        project_id=project_id,
        owner_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=AiAnalysisListResponse)
async def list_ai_analyses(
    project_id: UUID,
    analysis_type: AiAnalysisType | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    ai_analysis_service: AiAnalysisService = Depends(get_ai_analysis_service),
):
    return await ai_analysis_service.list_analyses(
        project_id=project_id,
        owner_id=current_user.id,
        limit=limit,
        offset=offset,
        analysis_type=analysis_type,
    )


@router.get("/{analysis_id}", response_model=AiAnalysisRead)
async def get_ai_analysis(
    project_id: UUID,
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    ai_analysis_service: AiAnalysisService = Depends(get_ai_analysis_service),
):
    return await ai_analysis_service.get_analysis(
        project_id=project_id,
        analysis_id=analysis_id,
        owner_id=current_user.id,
    )

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_saas_score_service
from app.models.user import User
from app.schemas.saas_score import SaasScoreListResponse, SaasScoreRead
from app.services.saas_score_service import SaasScoreService

router = APIRouter(
    prefix="/saas-projects/{project_id}/scores",
    tags=["SaaS Scores"],
)


@router.post("/latest", response_model=SaasScoreRead, status_code=status.HTTP_201_CREATED)
async def generate_latest_score(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    saas_score_service: SaasScoreService = Depends(get_saas_score_service),
):
    return await saas_score_service.generate_latest_score(
        project_id=project_id,
        owner_id=current_user.id,
    )


@router.post("/snapshots/{snapshot_id}", response_model=SaasScoreRead, status_code=status.HTTP_201_CREATED)
async def generate_score_for_snapshot(
    project_id: UUID,
    snapshot_id: UUID,
    current_user: User = Depends(get_current_user),
    saas_score_service: SaasScoreService = Depends(get_saas_score_service),
):
    return await saas_score_service.generate_score_for_snapshot(
        project_id=project_id,
        snapshot_id=snapshot_id,
        owner_id=current_user.id,
    )


@router.get("", response_model=SaasScoreListResponse)
async def list_scores(
    project_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    saas_score_service: SaasScoreService = Depends(get_saas_score_service),
):
    return await saas_score_service.list_scores(
        project_id=project_id,
        owner_id=current_user.id,
        limit=limit,
        offset=offset,
    )


@router.get("/latest", response_model=SaasScoreRead)
async def get_latest_score(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    saas_score_service: SaasScoreService = Depends(get_saas_score_service),
):
    return await saas_score_service.get_latest_score(
        project_id=project_id,
        owner_id=current_user.id,
    )


@router.get("/{score_id}", response_model=SaasScoreRead)
async def get_score(
    project_id: UUID,
    score_id: UUID,
    current_user: User = Depends(get_current_user),
    saas_score_service: SaasScoreService = Depends(get_saas_score_service),
):
    return await saas_score_service.get_score(
        project_id=project_id,
        score_id=score_id,
        owner_id=current_user.id,
    )

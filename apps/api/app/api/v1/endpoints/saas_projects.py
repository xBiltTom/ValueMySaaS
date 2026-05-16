from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_current_user, get_saas_project_service
from app.models.enums import SaasCategory, SaasStage
from app.models.user import User
from app.schemas.saas_project import (
    SaasProjectCreate,
    SaasProjectListResponse,
    SaasProjectRead,
    SaasProjectUpdate,
)
from app.services.saas_project_service import SaasProjectService

router = APIRouter(prefix="/saas-projects", tags=["SaaS Projects"])


@router.get("", response_model=SaasProjectListResponse)
async def list_saas_projects(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    stage: SaasStage | None = None,
    category: SaasCategory | None = None,
    current_user: User = Depends(get_current_user),
    project_service: SaasProjectService = Depends(get_saas_project_service),
):
    return await project_service.list_projects(
        owner_id=current_user.id,
        offset=offset,
        limit=limit,
        search=search,
        stage=stage,
        category=category,
    )


@router.post("", response_model=SaasProjectRead, status_code=status.HTTP_201_CREATED)
async def create_saas_project(
    payload: SaasProjectCreate,
    current_user: User = Depends(get_current_user),
    project_service: SaasProjectService = Depends(get_saas_project_service),
):
    return await project_service.create_project(owner_id=current_user.id, payload=payload)


@router.get("/{project_id}", response_model=SaasProjectRead)
async def get_saas_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    project_service: SaasProjectService = Depends(get_saas_project_service),
):
    return await project_service.get_project(project_id=project_id, owner_id=current_user.id)


@router.patch("/{project_id}", response_model=SaasProjectRead)
async def update_saas_project(
    project_id: UUID,
    payload: SaasProjectUpdate,
    current_user: User = Depends(get_current_user),
    project_service: SaasProjectService = Depends(get_saas_project_service),
):
    return await project_service.update_project(
        project_id=project_id,
        owner_id=current_user.id,
        payload=payload,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saas_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    project_service: SaasProjectService = Depends(get_saas_project_service),
) -> Response:
    await project_service.delete_project(project_id=project_id, owner_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.user_repository import UserRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService
from app.services.metric_calculation_service import MetricCalculationService
from app.services.metric_snapshot_service import MetricSnapshotService
from app.services.saas_project_service import SaasProjectService
from app.services.saas_score_service import SaasScoreService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))


def get_saas_project_service(db: AsyncSession = Depends(get_db)) -> SaasProjectService:
    return SaasProjectService(SaasProjectRepository(db))


def get_metric_snapshot_service(db: AsyncSession = Depends(get_db)) -> MetricSnapshotService:
    return MetricSnapshotService(
        MetricSnapshotRepository(db),
        SaasProjectRepository(db),
    )


def get_metric_calculation_service(db: AsyncSession = Depends(get_db)) -> MetricCalculationService:
    return MetricCalculationService(
        MetricSnapshotRepository(db),
        SaasProjectRepository(db),
    )


def get_saas_score_service(db: AsyncSession = Depends(get_db)) -> SaasScoreService:
    metric_snapshot_repository = MetricSnapshotRepository(db)
    saas_project_repository = SaasProjectRepository(db)
    metric_calculation_service = MetricCalculationService(
        metric_snapshot_repository,
        saas_project_repository,
    )
    return SaasScoreService(
        SaasScoreRepository(db),
        saas_project_repository,
        metric_snapshot_repository,
        metric_calculation_service,
    )


def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    saas_project_repository = SaasProjectRepository(db)
    metric_snapshot_repository = MetricSnapshotRepository(db)
    saas_score_repository = SaasScoreRepository(db)
    metric_calculation_service = MetricCalculationService(
        metric_snapshot_repository,
        saas_project_repository,
    )
    return DashboardService(
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        metric_calculation_service,
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception
        user_id = UUID(str(subject))
    except (JWTError, ValueError):
        raise credentials_exception from None

    return await auth_service.get_active_user(user_id)

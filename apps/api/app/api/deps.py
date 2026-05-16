from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.ai_analysis_repository import AiAnalysisRepository
from app.repositories.ai_key_repository import AiProviderKeyRepository
from app.repositories.chat_message_repository import ChatMessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.user_repository import UserRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.services.ai_analysis_service import AiAnalysisService
from app.services.ai_context_service import AiContextService
from app.services.ai_key_service import AiProviderKeyService
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.conversation_service import ConversationService
from app.services.dashboard_service import DashboardService
from app.services.llm_client_service import LlmClientService
from app.services.metric_calculation_service import MetricCalculationService
from app.services.metric_snapshot_service import MetricSnapshotService
from app.services.report_service import ReportService
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


def get_report_service(db: AsyncSession = Depends(get_db)) -> ReportService:
    saas_project_repository = SaasProjectRepository(db)
    metric_snapshot_repository = MetricSnapshotRepository(db)
    saas_score_repository = SaasScoreRepository(db)
    metric_calculation_service = MetricCalculationService(
        metric_snapshot_repository,
        saas_project_repository,
    )
    dashboard_service = DashboardService(
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        metric_calculation_service,
    )
    return ReportService(
        ReportRepository(db),
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        dashboard_service,
    )


def get_ai_key_service(db: AsyncSession = Depends(get_db)) -> AiProviderKeyService:
    return AiProviderKeyService(AiProviderKeyRepository(db), LlmClientService())


def get_llm_client_service() -> LlmClientService:
    return LlmClientService()


def get_ai_context_service(db: AsyncSession = Depends(get_db)) -> AiContextService:
    saas_project_repository = SaasProjectRepository(db)
    metric_snapshot_repository = MetricSnapshotRepository(db)
    saas_score_repository = SaasScoreRepository(db)
    metric_calculation_service = MetricCalculationService(
        metric_snapshot_repository,
        saas_project_repository,
    )
    dashboard_service = DashboardService(
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        metric_calculation_service,
    )
    return AiContextService(
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        dashboard_service,
    )


def get_ai_analysis_service(
    db: AsyncSession = Depends(get_db),
    llm_client_service: LlmClientService = Depends(get_llm_client_service),
) -> AiAnalysisService:
    saas_project_repository = SaasProjectRepository(db)
    metric_snapshot_repository = MetricSnapshotRepository(db)
    saas_score_repository = SaasScoreRepository(db)
    metric_calculation_service = MetricCalculationService(
        metric_snapshot_repository,
        saas_project_repository,
    )
    dashboard_service = DashboardService(
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        metric_calculation_service,
    )
    ai_context_service = AiContextService(
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        dashboard_service,
    )
    return AiAnalysisService(
        AiAnalysisRepository(db),
        AiProviderKeyService(AiProviderKeyRepository(db)),
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        ai_context_service,
        llm_client_service,
    )


def get_conversation_service(db: AsyncSession = Depends(get_db)) -> ConversationService:
    return ConversationService(
        SaasProjectRepository(db),
        ConversationRepository(db),
    )


def get_chat_service(
    db: AsyncSession = Depends(get_db),
    llm_client_service: LlmClientService = Depends(get_llm_client_service),
) -> ChatService:
    saas_project_repository = SaasProjectRepository(db)
    metric_snapshot_repository = MetricSnapshotRepository(db)
    saas_score_repository = SaasScoreRepository(db)
    metric_calculation_service = MetricCalculationService(
        metric_snapshot_repository,
        saas_project_repository,
    )
    dashboard_service = DashboardService(
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        metric_calculation_service,
    )
    ai_context_service = AiContextService(
        saas_project_repository,
        metric_snapshot_repository,
        saas_score_repository,
        dashboard_service,
    )
    return ChatService(
        saas_project_repository,
        ConversationRepository(db),
        ChatMessageRepository(db),
        AiProviderKeyService(AiProviderKeyRepository(db), llm_client_service),
        ai_context_service,
        llm_client_service,
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

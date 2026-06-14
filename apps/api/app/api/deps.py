from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.ai_analysis_repository import AiAnalysisRepository
from app.repositories.ai_key_repository import AiProviderKeyRepository
from app.repositories.chat_message_repository import ChatMessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.credit_transaction_repository import CreditTransactionRepository
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.repositories.system_ai_key_repository import SystemAiKeyRepository
from app.repositories.system_config_repository import SystemConfigRepository
from app.repositories.user_repository import UserRepository
from app.services.admin_service import AdminService
from app.services.ai_analysis_service import AiAnalysisService
from app.services.ai_context_service import AiContextService
from app.services.ai_key_service import AiProviderKeyService
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.conversation_service import ConversationService
from app.services.credit_service import CreditService
from app.services.dashboard_service import DashboardService
from app.services.llm_client_service import LlmClientService
from app.services.metric_calculation_service import MetricCalculationService
from app.services.metric_snapshot_service import MetricSnapshotService
from app.services.report_service import ReportService
from app.services.saas_project_service import SaasProjectService
from app.services.saas_score_service import SaasScoreService
from app.services.system_ai_key_service import SystemAiKeyService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ---------------------------------------------------------------------------
# Infraestructura base
# ---------------------------------------------------------------------------

def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(
        user_repository=UserRepository(db),
        system_config_repository=SystemConfigRepository(db),
    )


def get_llm_client_service() -> LlmClientService:
    return LlmClientService()


# ---------------------------------------------------------------------------
# Sistema de créditos
# ---------------------------------------------------------------------------

def get_credit_service(db: AsyncSession = Depends(get_db)) -> CreditService:
    return CreditService(
        user_repository=UserRepository(db),
        ai_key_repository=AiProviderKeyRepository(db),
        system_ai_key_repository=SystemAiKeyRepository(db),
        credit_transaction_repository=CreditTransactionRepository(db),
    )


def get_system_ai_key_service(
    db: AsyncSession = Depends(get_db),
    llm_client_service: LlmClientService = Depends(get_llm_client_service),
) -> SystemAiKeyService:
    return SystemAiKeyService(
        system_ai_key_repository=SystemAiKeyRepository(db),
        llm_client_service=llm_client_service,
    )


# ---------------------------------------------------------------------------
# Servicios de proyectos y métricas
# ---------------------------------------------------------------------------

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
        ai_analysis_repository=AiAnalysisRepository(db),
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


# ---------------------------------------------------------------------------
# Servicios de IA
# ---------------------------------------------------------------------------

def get_ai_key_service(db: AsyncSession = Depends(get_db)) -> AiProviderKeyService:
    return AiProviderKeyService(AiProviderKeyRepository(db), LlmClientService())


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
        UserRepository(db),
    )


def get_ai_analysis_service(
    db: AsyncSession = Depends(get_db),
    llm_client_service: LlmClientService = Depends(get_llm_client_service),
    credit_service: CreditService = Depends(get_credit_service),
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
        UserRepository(db),
    )
    return AiAnalysisService(
        ai_analysis_repository=AiAnalysisRepository(db),
        credit_service=credit_service,
        saas_project_repository=saas_project_repository,
        metric_snapshot_repository=metric_snapshot_repository,
        saas_score_repository=saas_score_repository,
        ai_context_service=ai_context_service,
        llm_client_service=llm_client_service,
        user_repository=UserRepository(db),
    )


def get_conversation_service(db: AsyncSession = Depends(get_db)) -> ConversationService:
    return ConversationService(
        SaasProjectRepository(db),
        ConversationRepository(db),
    )


def get_chat_service(
    db: AsyncSession = Depends(get_db),
    llm_client_service: LlmClientService = Depends(get_llm_client_service),
    credit_service: CreditService = Depends(get_credit_service),
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
        UserRepository(db),
    )
    return ChatService(
        saas_project_repository=saas_project_repository,
        conversation_repository=ConversationRepository(db),
        chat_message_repository=ChatMessageRepository(db),
        credit_service=credit_service,
        ai_context_service=ai_context_service,
        llm_client_service=llm_client_service,
        user_repository=UserRepository(db),
    )


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

def get_admin_service(
    db: AsyncSession = Depends(get_db),
    credit_service: CreditService = Depends(get_credit_service),
) -> AdminService:
    return AdminService(
        user_repository=UserRepository(db),
        credit_transaction_repository=CreditTransactionRepository(db),
        system_ai_key_repository=SystemAiKeyRepository(db),
        ai_analysis_repository=AiAnalysisRepository(db),
        credit_service=credit_service,
        saas_project_repository=SaasProjectRepository(db),
        system_config_repository=SystemConfigRepository(db),
    )


# ---------------------------------------------------------------------------
# Autenticación
# ---------------------------------------------------------------------------

async def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception
            
        user_id = UUID(str(subject))
        email = payload.get("email", "")
        is_active = payload.get("is_active", True)
        role_str = payload.get("role", "USER")
        
        if not is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )
            
        from app.models.enums import UserRole
        from datetime import datetime, timezone
        
        # Construir usuario en memoria para evitar SELECT a DB en cada request
        # Agregamos campos por defecto para evitar errores de validación de Pydantic
        # con tokens legacy o endpoints que serializan el current_user
        user = User(
            id=user_id,
            email=email if email and "@" in email else "legacy@example.com",
            is_active=is_active,
            role=UserRole[role_str] if isinstance(role_str, str) and role_str in UserRole.__members__ else UserRole.USER,
            is_verified=payload.get("is_verified", False),
            ai_credits=payload.get("ai_credits", 0),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        return user
        
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception from None

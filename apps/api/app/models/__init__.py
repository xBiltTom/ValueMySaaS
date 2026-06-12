# Import all models so that Alembic autogenerate can detect them.
from app.models.user import User
from app.models.saas_project import SaasProject
from app.models.saas_metric_snapshot import SaasMetricSnapshot
from app.models.saas_score import SaasScore
from app.models.ai_provider_key import AiProviderKey
from app.models.ai_analysis import AiAnalysis
from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage
from app.models.report import Report
from app.models.system_ai_key import SystemAiKey
from app.models.credit_transaction import CreditTransaction

__all__ = [
    "User",
    "SaasProject",
    "SaasMetricSnapshot",
    "SaasScore",
    "AiProviderKey",
    "AiAnalysis",
    "ChatConversation",
    "ChatMessage",
    "Report",
    "SystemAiKey",
    "CreditTransaction",
]

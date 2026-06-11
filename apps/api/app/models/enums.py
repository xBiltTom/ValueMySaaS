import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class ProjectPhase(str, enum.Enum):
    """Abstracción de alto nivel sobre SaasStage para bifurcar la lógica de evaluación."""
    PLANNING = "PLANNING"        # IDEA, PLANNING → evaluación cualitativa con IA
    IMPLEMENTED = "IMPLEMENTED"  # MVP, LAUNCHED, GROWING, PAUSED → scoring cuantitativo


class IdeaVerdict(str, enum.Enum):
    """Veredicto final de la evaluación cualitativa para proyectos en planificación."""
    BUILD = "BUILD"                    # Construye — score ≥ 70
    VALIDATE_FIRST = "VALIDATE_FIRST"  # Valida primero — score 50-69
    RETHINK = "RETHINK"                # Replantea — score < 50


class InfrastructureComplexity(str, enum.Enum):
    """Complejidad técnica estimada por el LLM para proyectos en planificación."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class CreditReason(str, enum.Enum):
    """Motivo de cada transacción de crédito de IA."""
    ADMIN_GRANT = "ADMIN_GRANT"        # Admin otorga créditos
    ADMIN_REVOKE = "ADMIN_REVOKE"      # Admin revoca créditos
    AI_ANALYSIS = "AI_ANALYSIS"        # Consumo por análisis IA
    CHAT_MESSAGE = "CHAT_MESSAGE"      # Consumo por mensaje de chat


class SaasCategory(str, enum.Enum):
    EDTECH = "EDTECH"
    FINTECH = "FINTECH"
    HEALTHTECH = "HEALTHTECH"
    PRODUCTIVITY = "PRODUCTIVITY"
    MARKETING = "MARKETING"
    ECOMMERCE = "ECOMMERCE"
    AI = "AI"
    DEVELOPER_TOOLS = "DEVELOPER_TOOLS"
    OTHER = "OTHER"


class SaasStage(str, enum.Enum):
    IDEA = "IDEA"
    PLANNING = "PLANNING"
    MVP = "MVP"
    LAUNCHED = "LAUNCHED"
    GROWING = "GROWING"
    PAUSED = "PAUSED"


class BusinessModel(str, enum.Enum):
    B2B = "B2B"
    B2C = "B2C"
    B2B2C = "B2B2C"
    FREEMIUM = "FREEMIUM"
    SUBSCRIPTION = "SUBSCRIPTION"
    ONE_TIME = "ONE_TIME"
    OTHER = "OTHER"


class SustainabilityLevel(str, enum.Enum):
    HEALTHY = "HEALTHY"
    VIABLE_WITH_ADJUSTMENTS = "VIABLE_WITH_ADJUSTMENTS"
    RISKY = "RISKY"
    UNSUSTAINABLE = "UNSUSTAINABLE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class DecisionRecommendation(str, enum.Enum):
    CONTINUE = "CONTINUE"
    IMPROVE = "IMPROVE"
    PIVOT = "PIVOT"
    PAUSE = "PAUSE"
    DISCARD = "DISCARD"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class AiProvider(str, enum.Enum):
    OPENAI = "OPENAI"
    GEMINI = "GEMINI"
    ANTHROPIC = "ANTHROPIC"
    OPENROUTER = "OPENROUTER"
    # groq/model-name  (e.g. groq/llama-3-70b-versatile, groq/mixtral-8x7b-32768)
    GROQ = "GROQ"
    # nvidia_nim/org/model-name  (e.g. nvidia_nim/meta/llama-3.1-70b-instruct)
    NVIDIA = "NVIDIA"
    OTHER = "OTHER"


class AiAnalysisType(str, enum.Enum):
    EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"
    RISK_ANALYSIS = "RISK_ANALYSIS"
    PRICING_ANALYSIS = "PRICING_ANALYSIS"
    GROWTH_ANALYSIS = "GROWTH_ANALYSIS"
    RETENTION_ANALYSIS = "RETENTION_ANALYSIS"
    FULL_DIAGNOSIS = "FULL_DIAGNOSIS"
    CUSTOM = "CUSTOM"


class ConversationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class ChatRole(str, enum.Enum):
    SYSTEM = "SYSTEM"
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    TOOL = "TOOL"


class ReportType(str, enum.Enum):
    BASIC = "BASIC"
    EXECUTIVE = "EXECUTIVE"
    AI_ASSISTED = "AI_ASSISTED"
    SCENARIO_SIMULATION = "SCENARIO_SIMULATION"


class ReportStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    GENERATED = "GENERATED"
    FAILED = "FAILED"

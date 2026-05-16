import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


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

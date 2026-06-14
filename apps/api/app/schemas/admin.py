"""Schemas para el panel de administración.

Incluye: usuarios, créditos, API Keys del sistema y estadísticas globales.
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import AiProvider, CreditReason, UserRole


# ---------------------------------------------------------------------------
# Usuarios (admin)
# ---------------------------------------------------------------------------

class AdminUserRead(BaseModel):
    """Vista de usuario para el admin — incluye datos que el usuario no ve."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    username: str | None
    full_name: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    ai_credits: int
    last_login_at: datetime | None = None
    project_count: int = 0
    last_ai_activity_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserRead]
    total: int
    limit: int
    offset: int


# ---------------------------------------------------------------------------
# Créditos
# ---------------------------------------------------------------------------

class CreditGrantRequest(BaseModel):
    """Request para otorgar o revocar créditos a un usuario."""
    delta: int = Field(
        description="Número de créditos a otorgar (positivo) o revocar (negativo). No puede ser 0.",
        examples=[10, -5],
    )
    description: str | None = Field(
        default=None,
        max_length=500,
        description="Motivo del ajuste de créditos (opcional pero recomendado).",
    )


class CreditTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    delta: int
    balance_after: int
    reason: CreditReason
    description: str | None
    related_analysis_id: UUID | None
    granted_by_admin_id: UUID | None
    created_at: datetime


class CreditTransactionListResponse(BaseModel):
    items: list[CreditTransactionRead]
    total: int
    limit: int
    offset: int


# ---------------------------------------------------------------------------
# System AI Keys
# ---------------------------------------------------------------------------

class SystemAiKeyCreate(BaseModel):
    provider: AiProvider
    label: str = Field(min_length=1, max_length=100)
    api_key: str = Field(
        min_length=10,
        description="La API Key del proveedor. Se almacenará encriptada.",
    )
    default_model: str | None = Field(
        default=None,
        max_length=100,
        description="Modelo por defecto para esta key (ej: gemini/gemini-1.5-flash).",
    )
    priority: int = Field(
        default=1,
        ge=1,
        description="Prioridad de la key. Menor número = mayor prioridad. Valor mínimo: 1.",
    )


class SystemAiKeyUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=100)
    api_key: str | None = Field(default=None, min_length=10)
    default_model: str | None = None
    priority: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class SystemAiKeyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: AiProvider
    label: str
    key_last_four: str | None
    default_model: str | None
    priority: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SystemAiKeyListResponse(BaseModel):
    items: list[SystemAiKeyRead]
    total: int
    limit: int
    offset: int


class SystemAiKeyVerifyResponse(BaseModel):
    ok: bool
    provider: AiProvider
    model_name: str | None
    message: str


# ---------------------------------------------------------------------------
# Estadísticas del sistema
# ---------------------------------------------------------------------------

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_analyses: int
    credits_consumed_today: int
    total_system_keys: int
    active_system_keys: int


# ---------------------------------------------------------------------------
# System Config
# ---------------------------------------------------------------------------

class SystemConfigRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    key: str
    value: str
    description: str | None
    updated_at: datetime


class SystemConfigUpdate(BaseModel):
    value: str = Field(max_length=2000)


class BulkGrantCreditsRequest(BaseModel):
    """Otorgar créditos a TODOS los usuarios activos."""
    delta: int = Field(gt=0, description="Créditos a agregar a cada usuario activo.")
    description: str | None = Field(default="Bono global del administrador", max_length=500)


class ToggleUserActiveRequest(BaseModel):
    is_active: bool

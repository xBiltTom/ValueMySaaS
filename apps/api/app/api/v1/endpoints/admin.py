"""Admin panel — endpoints protegidos con rol ADMIN.

Gestiona usuarios, créditos, API Keys del sistema y estadísticas globales.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    get_admin_service,
    get_current_user,
    get_system_ai_key_service,
)
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserListResponse,
    AdminUserRead,
    BulkGrantCreditsRequest,
    CreditGrantRequest,
    CreditTransactionListResponse,
    CreditTransactionRead,
    SystemAiKeyCreate,
    SystemAiKeyListResponse,
    SystemAiKeyRead,
    SystemAiKeyUpdate,
    SystemAiKeyVerifyResponse,
    SystemConfigRead,
    SystemConfigUpdate,
    ToggleUserActiveRequest,
)
from app.services.admin_service import AdminService
from app.services.system_ai_key_service import SystemAiKeyService
from fastapi import HTTPException


router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependencia que verifica que el usuario sea ADMIN."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden acceder a este recurso.",
        )
    return current_user


# ---------------------------------------------------------------------------
# Estadísticas del sistema
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=AdminStatsResponse)
async def get_system_stats(
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Resumen global del sistema: usuarios, análisis, créditos y keys."""
    return await admin_service.get_stats()


# ---------------------------------------------------------------------------
# Gestión de usuarios
# ---------------------------------------------------------------------------

@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    search: str | None = Query(default=None, description="Buscar por email o username"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Lista todos los usuarios con soporte de búsqueda y paginación."""
    return await admin_service.list_users(search=search, limit=limit, offset=offset)


@router.get("/users/{user_id}", response_model=AdminUserRead)
async def get_user(
    user_id: UUID,
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Detalle de un usuario incluyendo créditos actuales."""
    user = await admin_service.get_user(user_id=user_id)
    return AdminUserRead.model_validate(user)


# ---------------------------------------------------------------------------
# Gestión de créditos
# ---------------------------------------------------------------------------

@router.post("/users/{user_id}/credits", status_code=status.HTTP_204_NO_CONTENT)
async def grant_credits(
    user_id: UUID,
    payload: CreditGrantRequest,
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Otorga (delta positivo) o revoca (delta negativo) créditos a un usuario."""
    await admin_service.grant_credits(
        user_id=user_id,
        delta=payload.delta,
        description=payload.description,
        admin_id=admin.id,
    )


@router.get("/users/{user_id}/credit-history", response_model=CreditTransactionListResponse)
async def get_credit_history(
    user_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Historial completo de transacciones de crédito de un usuario."""
    items, total = await admin_service.get_credit_history(
        user_id=user_id, limit=limit, offset=offset
    )
    return CreditTransactionListResponse(
        items=[CreditTransactionRead.model_validate(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )


# ---------------------------------------------------------------------------
# Gestión de API Keys del sistema
# ---------------------------------------------------------------------------

@router.get("/system-keys", response_model=SystemAiKeyListResponse)
async def list_system_keys(
    active_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(require_admin),
    key_service: SystemAiKeyService = Depends(get_system_ai_key_service),
):
    """Lista todas las API Keys del sistema ordenadas por prioridad."""
    items, total = await key_service.list_keys(
        active_only=active_only, limit=limit, offset=offset
    )
    return SystemAiKeyListResponse(
        items=[SystemAiKeyRead.model_validate(k) for k in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/system-keys", response_model=SystemAiKeyRead, status_code=status.HTTP_201_CREATED)
async def create_system_key(
    payload: SystemAiKeyCreate,
    admin: User = Depends(require_admin),
    key_service: SystemAiKeyService = Depends(get_system_ai_key_service),
):
    """Crea una nueva API Key del sistema para ser usada con el sistema de créditos."""
    key = await key_service.create_key(
        provider=payload.provider,
        label=payload.label,
        api_key=payload.api_key,
        default_model=payload.default_model,
        priority=payload.priority,
    )
    return SystemAiKeyRead.model_validate(key)


@router.put("/system-keys/{key_id}", response_model=SystemAiKeyRead)
async def update_system_key(
    key_id: UUID,
    payload: SystemAiKeyUpdate,
    admin: User = Depends(require_admin),
    key_service: SystemAiKeyService = Depends(get_system_ai_key_service),
):
    """Actualiza una API Key del sistema (label, modelo, prioridad, estado)."""
    data = payload.model_dump(exclude_unset=True)
    key = await key_service.update_key(key_id=key_id, data=data)
    return SystemAiKeyRead.model_validate(key)


@router.delete("/system-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_system_key(
    key_id: UUID,
    admin: User = Depends(require_admin),
    key_service: SystemAiKeyService = Depends(get_system_ai_key_service),
):
    """Desactiva (soft delete) una API Key del sistema."""
    await key_service.delete_key(key_id=key_id)


@router.post("/system-keys/{key_id}/verify", response_model=SystemAiKeyVerifyResponse)
async def verify_system_key(
    key_id: UUID,
    model_name: str | None = Query(default=None),
    admin: User = Depends(require_admin),
    key_service: SystemAiKeyService = Depends(get_system_ai_key_service),
):
    """Verifica que una API Key del sistema sea válida haciendo una llamada de prueba al LLM."""
    result = await key_service.verify_key(key_id=key_id, model_name=model_name)
    return SystemAiKeyVerifyResponse(**result)


# ---------------------------------------------------------------------------
# Toggle user active status
# ---------------------------------------------------------------------------

@router.patch("/users/{user_id}/active", status_code=status.HTTP_204_NO_CONTENT)
async def toggle_user_active(
    user_id: UUID,
    payload: ToggleUserActiveRequest,
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Activa o desactiva un usuario del sistema."""
    await admin_service.toggle_user_active(user_id=user_id, is_active=payload.is_active)


# ---------------------------------------------------------------------------
# Bulk credit grant
# ---------------------------------------------------------------------------

@router.post("/credits/bulk-grant")
async def bulk_grant_credits(
    payload: BulkGrantCreditsRequest,
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Otorga créditos a TODOS los usuarios activos del sistema."""
    affected = await admin_service.bulk_grant_credits(
        delta=payload.delta,
        description=payload.description,
        admin_id=admin.id,
    )
    return {"affected_users": affected, "credits_per_user": payload.delta}


# ---------------------------------------------------------------------------
# System Config
# ---------------------------------------------------------------------------

@router.get("/config", response_model=list[SystemConfigRead])
async def get_system_config(
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Devuelve todas las configuraciones del sistema."""
    return await admin_service.get_config()


@router.put("/config/{key}", response_model=SystemConfigRead)
async def update_system_config(
    key: str,
    payload: SystemConfigUpdate,
    admin: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Actualiza el valor de una clave de configuración del sistema."""
    ALLOWED_KEYS = {"default_initial_credits", "login_announcement", "system_credits_enabled"}
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail=f"Clave '{key}' no permitida.")
    return await admin_service.set_config(key=key, value=payload.value)


# ---------------------------------------------------------------------------
# Public: announcement (no auth required)
# ---------------------------------------------------------------------------

@router.get("/public/announcement")
async def get_announcement(
    admin_service: AdminService = Depends(get_admin_service),
):
    """Endpoint público. Devuelve el anuncio activo para mostrar al iniciar sesión."""
    text = await admin_service.get_announcement()
    return {"announcement": text, "has_announcement": bool(text.strip())}

@router.get("/public/config")
async def get_public_config(
    admin_service: AdminService = Depends(get_admin_service),
):
    """Endpoint público. Devuelve configuración global visible a todos."""
    credits_enabled = await admin_service.get_system_credits_enabled()
    return {
        "system_credits_enabled": credits_enabled,
    }

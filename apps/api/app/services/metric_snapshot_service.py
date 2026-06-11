from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import SaasStage
from app.models.saas_metric_snapshot import SaasMetricSnapshot
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.schemas.metric_snapshot import (
    MetricSnapshotCreate,
    MetricSnapshotListResponse,
    MetricSnapshotUpdate,
)

# Fields that are meaningless for a project still in planning.
_PLANNING_EXCLUDED_FIELDS = (
    "mrr",
    "arr",
    "monthly_revenue",
    "paying_customers",
    "total_users",
    "active_users",
    "cac",
    "churn_rate",
    "ltv",
    "gross_profit",
    "burn_rate",
    "runway_months",
    "uptime_percentage",
)

_PLANNING_STAGES = {SaasStage.IDEA, SaasStage.PLANNING}


def _to_decimal(value) -> Decimal | None:
    if value is None:
        return None
    return value if isinstance(value, Decimal) else Decimal(str(value))


def _auto_fill_derived_metrics(data: dict) -> dict:
    """Calcula métricas derivadas si no fueron provistas por el cliente.

    Permite que el estudiante ingrese solo los datos básicos (mrr, monthly_costs,
    cash_available) y el sistema complete automáticamente las métricas complejas.

    Solo completa campos que vengan como None — nunca sobrescribe valores explícitos.
    Todas las divisiones por cero están controladas.
    """
    d = dict(data)

    mrr = _to_decimal(d.get("mrr"))
    monthly_revenue = _to_decimal(d.get("monthly_revenue"))
    monthly_costs = _to_decimal(d.get("monthly_costs"))
    cash_available = _to_decimal(d.get("cash_available"))

    # 1. ARR = MRR * 12
    if d.get("arr") is None and mrr is not None:
        d["arr"] = (mrr * Decimal("12")).quantize(Decimal("0.01"))

    # 2. MRR desde monthly_revenue si no se proveyó directamente
    if d.get("mrr") is None and monthly_revenue is not None:
        d["mrr"] = monthly_revenue.quantize(Decimal("0.01"))
        mrr = d["mrr"]
        # Recalcular ARR si ahora tenemos MRR
        if d.get("arr") is None:
            d["arr"] = (mrr * Decimal("12")).quantize(Decimal("0.01"))

    # 3. gross_profit = monthly_revenue - monthly_costs
    if d.get("gross_profit") is None and monthly_revenue is not None and monthly_costs is not None:
        d["gross_profit"] = (monthly_revenue - monthly_costs).quantize(Decimal("0.01"))

    gross_profit = _to_decimal(d.get("gross_profit"))

    # 4. burn_rate = |gross_profit| si gross_profit < 0, sino 0
    if d.get("burn_rate") is None and gross_profit is not None:
        d["burn_rate"] = (abs(gross_profit) if gross_profit < 0 else Decimal("0")).quantize(Decimal("0.01"))

    burn_rate = _to_decimal(d.get("burn_rate"))

    # 5. runway_months = cash_available / burn_rate (solo si burn_rate > 0)
    if d.get("runway_months") is None and cash_available is not None and burn_rate is not None:
        if burn_rate > Decimal("0"):
            d["runway_months"] = (cash_available / burn_rate).quantize(Decimal("0.01"))

    return d


def _pack_custom_metrics(data: dict) -> dict:
    """Mueve todas las claves que no son columnas oficiales de SQLAlchemy al diccionario custom_metrics."""
    valid_columns = {
        "period_label", "captured_at", "mrr", "monthly_costs", 
        "total_users", "paying_customers", "cac", "churn_rate", 
        "notes", "custom_metrics"
    }
    custom_metrics = data.get("custom_metrics") or {}
    
    keys_to_move = [k for k in data.keys() if k not in valid_columns]
    for k in keys_to_move:
        val = data.pop(k)
        if val is not None:
            if isinstance(val, Decimal):
                custom_metrics[k] = str(val)
            else:
                custom_metrics[k] = val
                
    if custom_metrics:
        data["custom_metrics"] = custom_metrics
    return data


class MetricSnapshotService:
    def __init__(
        self,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_project_repository: SaasProjectRepository,
    ) -> None:
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_project_repository = saas_project_repository

    async def create_snapshot(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        payload: MetricSnapshotCreate,
    ) -> SaasMetricSnapshot:
        project = await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        data = payload.model_dump(exclude_unset=True)
        data["captured_at"] = self._normalize_captured_at(data.get("captured_at"))

        # For planning-phase projects, silently discard metrics that don't exist yet.
        stage = project.stage if isinstance(project.stage, SaasStage) else SaasStage(project.stage)
        if stage in _PLANNING_STAGES:
            for field in _PLANNING_EXCLUDED_FIELDS:
                data[field] = None
        else:
            # Auto-calcular métricas derivadas antes de persistir (only for launched projects)
            data = _auto_fill_derived_metrics(data)

        data = _pack_custom_metrics(data)

        return await self.metric_snapshot_repository.create(saas_project_id=project_id, data=data)

    async def list_snapshots(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        limit: int = 20,
        offset: int = 0,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> MetricSnapshotListResponse:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        normalized_from = self._normalize_optional_datetime(from_date)
        normalized_to = self._normalize_optional_datetime(to_date)
        items = await self.metric_snapshot_repository.list_by_project(
            saas_project_id=project_id,
            limit=limit,
            offset=offset,
            from_date=normalized_from,
            to_date=normalized_to,
        )
        total = await self.metric_snapshot_repository.count_by_project(
            saas_project_id=project_id,
            from_date=normalized_from,
            to_date=normalized_to,
        )
        return MetricSnapshotListResponse(items=items, total=total, limit=limit, offset=offset)

    async def get_snapshot(
        self,
        *,
        project_id: UUID,
        snapshot_id: UUID,
        owner_id: UUID,
    ) -> SaasMetricSnapshot:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        snapshot = await self.metric_snapshot_repository.get_by_id_for_project(
            snapshot_id=snapshot_id,
            saas_project_id=project_id,
        )
        if snapshot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Metric snapshot not found",
            )
        return snapshot

    async def update_snapshot(
        self,
        *,
        project_id: UUID,
        snapshot_id: UUID,
        owner_id: UUID,
        payload: MetricSnapshotUpdate,
    ) -> SaasMetricSnapshot:
        snapshot = await self.get_snapshot(
            project_id=project_id,
            snapshot_id=snapshot_id,
            owner_id=owner_id,
        )
        data = payload.model_dump(exclude_unset=True)
        if "captured_at" in data:
            data["captured_at"] = self._normalize_captured_at(data["captured_at"])
        # Auto-calcular métricas derivadas también en actualizaciones
        data = _auto_fill_derived_metrics(data)
        data = _pack_custom_metrics(data)
        return await self.metric_snapshot_repository.update(snapshot=snapshot, data=data)

    async def delete_snapshot(
        self,
        *,
        project_id: UUID,
        snapshot_id: UUID,
        owner_id: UUID,
    ) -> None:
        snapshot = await self.get_snapshot(
            project_id=project_id,
            snapshot_id=snapshot_id,
            owner_id=owner_id,
        )
        await self.metric_snapshot_repository.delete(snapshot=snapshot)

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID):
        """Verifies ownership and returns the project. Raises 404 if not found."""
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SaaS project not found",
            )
        return project

    def _normalize_captured_at(self, value: datetime | None) -> datetime:
        if value is None:
            return datetime.now(timezone.utc)
        return self._normalize_optional_datetime(value)

    def _normalize_optional_datetime(self, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

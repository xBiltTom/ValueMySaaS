from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException, status

from app.models.saas_metric_snapshot import SaasMetricSnapshot
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.schemas.metric_calculation import (
    CalculatedMetric,
    MetricCalculationResponse,
    MetricCalculationSummary,
)

MONEY_QUANT = Decimal("0.01")
RATIO_QUANT = Decimal("0.0001")

METRIC_KEYS = [
    "mrr",
    "monthly_costs",
    "total_users",
    "paying_customers",
    "cac",
    "churn_rate",
    "arr",
    "monthly_revenue",
    "active_users",
]

CALCULATED_KEYS = [
    "net_profit",
    "arpu",
    "ltv",
    "ltv_cac_ratio",
    "conversion_rate",
    "mrr_growth_rate",
]

MONEY_METRICS = {
    "mrr",
    "monthly_costs",
    "cac",
    "net_profit",
    "arpu",
    "ltv",
    "arr",
    "monthly_revenue",
}

RATIO_METRICS = {
    "churn_rate",
    "ltv_cac_ratio",
    "conversion_rate",
    "mrr_growth_rate",
}

PROVIDED_EXPLANATIONS = {
    "mrr": "MRR fue proporcionado.",
    "monthly_costs": "Costos mensuales proporcionados.",
    "total_users": "Usuarios totales proporcionados.",
    "paying_customers": "Clientes pagos proporcionados.",
    "cac": "CAC fue proporcionado.",
    "churn_rate": "Churn rate proporcionado.",
    "mrr_growth_rate": "Crecimiento MRR proporcionado.",
}


class MetricCalculationService:
    def __init__(
        self,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_project_repository: SaasProjectRepository,
    ) -> None:
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_project_repository = saas_project_repository

    async def calculate_latest_for_project(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
    ) -> MetricCalculationResponse:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        snapshot = await self.metric_snapshot_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        if snapshot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Metric snapshot not found",
            )
        previous_snapshot = await self.metric_snapshot_repository.get_previous_snapshot(
            saas_project_id=project_id,
            captured_at=snapshot.captured_at,
        )
        return self._calculate_response(snapshot=snapshot, previous_snapshot=previous_snapshot)

    async def calculate_for_snapshot(
        self,
        *,
        project_id: UUID,
        snapshot_id: UUID,
        owner_id: UUID,
    ) -> MetricCalculationResponse:
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
        previous_snapshot = await self.metric_snapshot_repository.get_previous_snapshot(
            saas_project_id=project_id,
            captured_at=snapshot.captured_at,
        )
        return self._calculate_response(snapshot=snapshot, previous_snapshot=previous_snapshot)

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID) -> None:
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SaaS project not found",
            )

    def _calculate_response(
        self,
        *,
        snapshot: SaasMetricSnapshot,
        previous_snapshot: SaasMetricSnapshot | None = None,
    ) -> MetricCalculationResponse:
        metrics: dict[str, CalculatedMetric] = {}
        values: dict[str, Decimal | int | str | None] = {}
        warnings: list[str] = []

        # Load provided metrics
        for key in METRIC_KEYS:
            value = getattr(snapshot, key, None)
            if value is None and snapshot.custom_metrics:
                value = snapshot.custom_metrics.get(key)
            values[key] = value
            if value is not None:
                metrics[key] = CalculatedMetric(
                    value=value,
                    source="provided",
                    formula=None,
                    explanation=PROVIDED_EXPLANATIONS.get(
                        key,
                        f"{key} fue proporcionado.",
                    ),
                )

        # Calculate additional metrics
        self._calculate_net_profit(metrics, values, warnings)
        self._calculate_conversion_rate(metrics, values, warnings)
        self._calculate_arpu(metrics, values, warnings)
        self._calculate_ltv(metrics, values, warnings)
        self._calculate_ltv_cac_ratio(metrics, values, warnings)
        self._calculate_mrr_growth_rate(metrics, values, warnings, previous_snapshot)

        # Mark missing metrics
        for key in METRIC_KEYS + CALCULATED_KEYS:
            if key not in metrics:
                metrics[key] = CalculatedMetric(
                    value=None,
                    source="missing",
                    formula=None,
                    explanation="No hay datos suficientes para calcular esta metrica.",
                )

        summary = MetricCalculationSummary(
            provided_metrics_count=sum(1 for metric in metrics.values() if metric.source == "provided"),
            calculated_metrics_count=sum(1 for metric in metrics.values() if metric.source == "calculated"),
            missing_metrics_count=sum(1 for metric in metrics.values() if metric.source == "missing"),
        )

        return MetricCalculationResponse(
            project_id=snapshot.saas_project_id,
            snapshot_id=snapshot.id,
            snapshot_captured_at=snapshot.captured_at,
            previous_snapshot_id=previous_snapshot.id if previous_snapshot else None,
            metrics=metrics,
            warnings=warnings,
            summary=summary,
        )

    def _calculate_net_profit(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        mrr = self._decimal(values.get("mrr"))
        costs = self._decimal(values.get("monthly_costs"))
        if mrr is None or costs is None:
            self._add_warning(warnings, "No se pudo calcular net_profit porque faltan mrr o monthly_costs.")
            return
        self._set_calculated(
            metrics, values, "net_profit", mrr - costs, "net_profit = mrr - monthly_costs", "Utilidad calculada."
        )

    def _calculate_conversion_rate(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        paying = self._decimal(values.get("paying_customers"))
        total = self._decimal(values.get("total_users"))
        result = self._safe_divide(paying, total)
        if result is None:
            self._add_warning(warnings, "No se pudo calcular conversion_rate porque faltan usuarios.")
            return
        self._set_calculated(
            metrics, values, "conversion_rate", result, "conversion_rate = paying_customers / total_users", "Tasa de conversión."
        )

    def _calculate_arpu(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        mrr = self._decimal(values.get("mrr"))
        paying = self._decimal(values.get("paying_customers"))
        result = self._safe_divide(mrr, paying)
        if result is None:
            self._add_warning(warnings, "No se pudo calcular arpu.")
            return
        self._set_calculated(
            metrics, values, "arpu", result, "arpu = mrr / paying_customers", "ARPU calculado."
        )

    def _calculate_ltv(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        arpu = self._decimal(values.get("arpu"))
        churn_rate = self._decimal(values.get("churn_rate"))
        if arpu is None or churn_rate is None or churn_rate <= 0:
            self._add_warning(warnings, "No se pudo calcular ltv.")
            return
        self._set_calculated(
            metrics, values, "ltv", arpu / churn_rate, "ltv = arpu / churn_rate", "LTV calculado."
        )

    def _calculate_ltv_cac_ratio(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        ltv = self._decimal(values.get("ltv"))
        cac = self._decimal(values.get("cac"))
        result = self._safe_divide(ltv, cac)
        if result is None:
            self._add_warning(warnings, "No se pudo calcular ltv_cac_ratio.")
            return
        self._set_calculated(
            metrics, values, "ltv_cac_ratio", result, "ltv_cac_ratio = ltv / cac", "Ratio LTV/CAC."
        )

    def _calculate_mrr_growth_rate(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
        previous_snapshot: SaasMetricSnapshot | None,
    ) -> None:
        if previous_snapshot is None:
            self._add_warning(warnings, "No hay snapshot anterior para calcular el crecimiento MRR.")
            return
        current_mrr = self._decimal(values.get('mrr'))
        prev_mrr = self._decimal(previous_snapshot.mrr) if previous_snapshot.mrr is not None else None
        if current_mrr is None or prev_mrr is None:
            self._add_warning(warnings, "No se pudo calcular mrr_growth_rate por falta de MRR en un snapshot.")
            return
        if prev_mrr == 0:
            self._add_warning(warnings, "MRR anterior es 0, no se puede calcular crecimiento.")
            return
        growth = (current_mrr - prev_mrr) / prev_mrr
        self._set_calculated(
            metrics, values, 'mrr_growth_rate', growth,
            'mrr_growth_rate = (mrr_actual - mrr_anterior) / mrr_anterior',
            'Crecimiento MRR mes a mes calculado automáticamente.'
        )

    def _set_calculated(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        key: str,
        value: Decimal,
        formula: str,
        explanation: str,
    ) -> None:
        rounded_value = self._round_metric(key, value)
        values[key] = rounded_value
        metrics[key] = CalculatedMetric(
            value=rounded_value,
            source="calculated",
            formula=formula,
            explanation=explanation,
        )

    def _round_metric(self, key: str, value: Decimal) -> Decimal:
        if key in RATIO_METRICS:
            return value.quantize(RATIO_QUANT, rounding=ROUND_HALF_UP)
        if key in MONEY_METRICS:
            return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
        return value

    def _safe_divide(self, numerator: Decimal | None, denominator: Decimal | None) -> Decimal | None:
        if numerator is None or denominator is None or denominator == 0:
            return None
        return numerator / denominator

    def _decimal(self, value: Decimal | int | str | None) -> Decimal | None:
        if value is None:
            return None
        return value if isinstance(value, Decimal) else Decimal(str(value))

    def _add_warning(self, warnings: list[str], message: str) -> None:
        if message not in warnings:
            warnings.append(message)

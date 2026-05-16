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
MONTH_QUANT = Decimal("0.01")

METRIC_KEYS = [
    "mrr",
    "arr",
    "monthly_revenue",
    "monthly_costs",
    "gross_profit",
    "net_profit",
    "cash_available",
    "burn_rate",
    "runway_months",
    "total_users",
    "active_users",
    "active_user_rate",
    "paying_customers",
    "new_users",
    "new_paying_customers",
    "churned_customers",
    "marketing_spend",
    "cac",
    "conversion_rate",
    "arpu",
    "churn_rate",
    "retention_rate",
    "ltv",
    "ltv_cac_ratio",
    "payback_months",
    "growth_rate",
    "nps",
    "avg_session_minutes",
    "support_tickets",
    "critical_bugs",
    "uptime_percentage",
]

MONEY_METRICS = {
    "mrr",
    "arr",
    "monthly_revenue",
    "monthly_costs",
    "gross_profit",
    "net_profit",
    "cash_available",
    "burn_rate",
    "marketing_spend",
    "cac",
    "arpu",
    "ltv",
}
RATIO_METRICS = {
    "active_user_rate",
    "conversion_rate",
    "churn_rate",
    "retention_rate",
    "ltv_cac_ratio",
    "growth_rate",
}
MONTH_METRICS = {"runway_months", "payback_months"}

PROVIDED_EXPLANATIONS = {
    "mrr": "MRR fue proporcionado en el snapshot.",
    "arr": "ARR fue proporcionado en el snapshot.",
    "monthly_revenue": "Ingresos mensuales proporcionados en el snapshot.",
    "monthly_costs": "Costos mensuales proporcionados en el snapshot.",
    "gross_profit": "Utilidad bruta proporcionada en el snapshot.",
    "net_profit": "Utilidad neta proporcionada en el snapshot.",
    "cash_available": "Caja disponible proporcionada en el snapshot.",
    "burn_rate": "Burn rate proporcionado en el snapshot.",
    "runway_months": "Runway en meses proporcionado en el snapshot.",
    "total_users": "Usuarios totales proporcionados en el snapshot.",
    "active_users": "Usuarios activos proporcionados en el snapshot.",
    "paying_customers": "Clientes pagos proporcionados en el snapshot.",
    "new_users": "Usuarios nuevos proporcionados en el snapshot.",
    "new_paying_customers": "Nuevos clientes pagos proporcionados en el snapshot.",
    "churned_customers": "Clientes perdidos proporcionados en el snapshot.",
    "marketing_spend": "Gasto de marketing proporcionado en el snapshot.",
    "cac": "CAC fue proporcionado en el snapshot.",
    "conversion_rate": "Tasa de conversion proporcionada en el snapshot.",
    "arpu": "ARPU fue proporcionado en el snapshot.",
    "churn_rate": "Churn rate proporcionado en el snapshot.",
    "retention_rate": "Retention rate proporcionado en el snapshot.",
    "ltv": "LTV fue proporcionado en el snapshot.",
    "ltv_cac_ratio": "Ratio LTV/CAC proporcionado en el snapshot.",
    "payback_months": "Payback en meses proporcionado en el snapshot.",
    "growth_rate": "Growth rate proporcionado en el snapshot.",
    "nps": "NPS proporcionado en el snapshot.",
    "avg_session_minutes": "Duracion promedio de sesion proporcionada en el snapshot.",
    "support_tickets": "Tickets de soporte proporcionados en el snapshot.",
    "critical_bugs": "Bugs criticos proporcionados en el snapshot.",
    "uptime_percentage": "Porcentaje de uptime proporcionado en el snapshot.",
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
        previous_snapshot: SaasMetricSnapshot | None,
    ) -> MetricCalculationResponse:
        metrics: dict[str, CalculatedMetric] = {}
        values: dict[str, Decimal | int | str | None] = {}
        warnings: list[str] = []

        for key in METRIC_KEYS:
            if key == "active_user_rate":
                continue
            value = getattr(snapshot, key, None)
            values[key] = value
            if value is not None:
                metrics[key] = CalculatedMetric(
                    value=value,
                    source="provided",
                    formula=None,
                    explanation=PROVIDED_EXPLANATIONS.get(
                        key,
                        f"{key} fue proporcionado en el snapshot.",
                    ),
                )

        self._calculate_arr(metrics, values, warnings)
        self._calculate_gross_profit(metrics, values, warnings)
        self._calculate_net_profit(metrics, values, warnings)
        self._calculate_burn_rate(metrics, values, warnings)
        self._calculate_runway_months(metrics, values, warnings)
        self._calculate_conversion_rate(metrics, values, warnings)
        self._calculate_active_user_rate(metrics, values, warnings)
        self._calculate_arpu(metrics, values, warnings)
        self._calculate_churn_rate(metrics, values, warnings)
        self._calculate_retention_rate(metrics, values, warnings)
        self._calculate_cac(metrics, values, warnings)
        self._calculate_ltv(metrics, values, warnings)
        self._calculate_ltv_cac_ratio(metrics, values, warnings)
        self._calculate_payback_months(metrics, values, warnings)
        self._calculate_growth_rate(metrics, values, warnings, snapshot, previous_snapshot)

        for key in METRIC_KEYS:
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

    def _calculate_arr(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("arr") is not None:
            return
        mrr = self._decimal(values.get("mrr"))
        if mrr is None:
            self._add_warning(warnings, "No se pudo calcular arr porque falta mrr.")
            return
        self._set_calculated(
            metrics,
            values,
            "arr",
            mrr * Decimal("12"),
            "ARR = MRR * 12",
            "ARR calculado multiplicando el MRR por 12 meses.",
        )

    def _calculate_gross_profit(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("gross_profit") is not None:
            return
        revenue = self._decimal(values.get("monthly_revenue"))
        costs = self._decimal(values.get("monthly_costs"))
        if revenue is None or costs is None:
            self._add_warning(
                warnings,
                "No se pudo calcular gross_profit porque faltan monthly_revenue o monthly_costs.",
            )
            return
        self._set_calculated(
            metrics,
            values,
            "gross_profit",
            revenue - costs,
            "gross_profit = monthly_revenue - monthly_costs",
            "Utilidad bruta calculada restando costos mensuales a ingresos mensuales.",
        )

    def _calculate_net_profit(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("net_profit") is not None:
            return
        revenue = self._decimal(values.get("monthly_revenue"))
        costs = self._decimal(values.get("monthly_costs"))
        if revenue is None or costs is None:
            self._add_warning(
                warnings,
                "No se pudo calcular net_profit porque faltan monthly_revenue o monthly_costs.",
            )
            return
        self._set_calculated(
            metrics,
            values,
            "net_profit",
            revenue - costs,
            "net_profit = monthly_revenue - monthly_costs",
            "Utilidad neta MVP calculada restando costos mensuales a ingresos mensuales.",
        )

    def _calculate_burn_rate(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("burn_rate") is not None:
            return
        net_profit = self._decimal(values.get("net_profit"))
        if net_profit is None:
            self._add_warning(warnings, "No se pudo calcular burn_rate porque falta net_profit.")
            return
        burn_rate = abs(net_profit) if net_profit < 0 else Decimal("0")
        self._set_calculated(
            metrics,
            values,
            "burn_rate",
            burn_rate,
            "burn_rate = abs(net_profit) si net_profit < 0; 0 si net_profit >= 0",
            "Burn rate calculado desde la utilidad neta mensual.",
        )

    def _calculate_runway_months(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("runway_months") is not None:
            return
        cash = self._decimal(values.get("cash_available"))
        burn_rate = self._decimal(values.get("burn_rate"))
        if cash is None or burn_rate is None:
            self._add_warning(
                warnings,
                "No se pudo calcular runway_months porque faltan cash_available o burn_rate.",
            )
            return
        if burn_rate <= 0:
            self._add_warning(
                warnings,
                "No se pudo calcular runway_months porque burn_rate es 0 o no hay perdida mensual.",
            )
            return
        self._set_calculated(
            metrics,
            values,
            "runway_months",
            cash / burn_rate,
            "runway_months = cash_available / burn_rate",
            "Runway calculado dividiendo caja disponible entre burn rate mensual.",
        )

    def _calculate_conversion_rate(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("conversion_rate") is not None:
            return
        result = self._safe_divide(
            self._decimal(values.get("paying_customers")),
            self._decimal(values.get("total_users")),
        )
        if result is None:
            self._add_warning(
                warnings,
                "No se pudo calcular conversion_rate porque faltan paying_customers o total_users validos.",
            )
            return
        self._set_calculated(
            metrics,
            values,
            "conversion_rate",
            result,
            "conversion_rate = paying_customers / total_users",
            "Proporcion de usuarios totales que son clientes pagos.",
        )

    def _calculate_active_user_rate(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        result = self._safe_divide(
            self._decimal(values.get("active_users")),
            self._decimal(values.get("total_users")),
        )
        if result is None:
            self._add_warning(
                warnings,
                "No se pudo calcular active_user_rate porque faltan active_users o total_users validos.",
            )
            return
        self._set_calculated(
            metrics,
            values,
            "active_user_rate",
            result,
            "active_user_rate = active_users / total_users",
            "Proporcion de usuarios totales que estuvieron activos en el periodo.",
        )

    def _calculate_arpu(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("arpu") is not None:
            return
        paying_customers = self._decimal(values.get("paying_customers"))
        revenue = self._decimal(values.get("monthly_revenue"))
        if revenue is not None:
            result = self._safe_divide(revenue, paying_customers)
            formula = "arpu = monthly_revenue / paying_customers"
        else:
            result = self._safe_divide(self._decimal(values.get("mrr")), paying_customers)
            formula = "arpu = mrr / paying_customers"
        if result is None:
            self._add_warning(
                warnings,
                "No se pudo calcular arpu porque faltan ingresos y paying_customers validos.",
            )
            return
        self._set_calculated(
            metrics,
            values,
            "arpu",
            result,
            formula,
            "ARPU calculado dividiendo ingresos mensuales entre clientes pagos.",
        )

    def _calculate_churn_rate(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("churn_rate") is not None:
            return
        result = self._safe_divide(
            self._decimal(values.get("churned_customers")),
            self._decimal(values.get("paying_customers")),
        )
        if result is None:
            self._add_warning(
                warnings,
                "No se pudo calcular churn_rate porque faltan churned_customers o paying_customers validos.",
            )
            return
        self._set_calculated(
            metrics,
            values,
            "churn_rate",
            result,
            "churn_rate = churned_customers / paying_customers",
            "Estimacion simple basada en clientes perdidos sobre clientes pagos del periodo.",
        )

    def _calculate_retention_rate(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("retention_rate") is not None:
            return
        churn_rate = self._decimal(values.get("churn_rate"))
        if churn_rate is None:
            self._add_warning(warnings, "No se pudo calcular retention_rate porque falta churn_rate.")
            return
        self._set_calculated(
            metrics,
            values,
            "retention_rate",
            Decimal("1") - churn_rate,
            "retention_rate = 1 - churn_rate",
            "Retention rate calculado como complemento del churn rate.",
        )

    def _calculate_cac(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("cac") is not None:
            return
        result = self._safe_divide(
            self._decimal(values.get("marketing_spend")),
            self._decimal(values.get("new_paying_customers")),
        )
        if result is None:
            self._add_warning(
                warnings,
                "No se pudo calcular cac porque faltan marketing_spend o new_paying_customers validos.",
            )
            return
        self._set_calculated(
            metrics,
            values,
            "cac",
            result,
            "cac = marketing_spend / new_paying_customers",
            "CAC calculado dividiendo gasto de marketing entre nuevos clientes pagos.",
        )

    def _calculate_ltv(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("ltv") is not None:
            return
        arpu = self._decimal(values.get("arpu"))
        churn_rate = self._decimal(values.get("churn_rate"))
        if arpu is None or churn_rate is None:
            self._add_warning(warnings, "No se pudo calcular ltv porque faltan arpu o churn_rate.")
            return
        if churn_rate <= 0:
            self._add_warning(warnings, "No se pudo calcular ltv porque churn_rate es 0.")
            return
        self._set_calculated(
            metrics,
            values,
            "ltv",
            arpu / churn_rate,
            "ltv = arpu / churn_rate",
            "LTV MVP calculado dividiendo ARPU entre churn rate.",
        )

    def _calculate_ltv_cac_ratio(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("ltv_cac_ratio") is not None:
            return
        result = self._safe_divide(self._decimal(values.get("ltv")), self._decimal(values.get("cac")))
        if result is None:
            self._add_warning(warnings, "No se pudo calcular ltv_cac_ratio porque faltan ltv o cac validos.")
            return
        self._set_calculated(
            metrics,
            values,
            "ltv_cac_ratio",
            result,
            "ltv_cac_ratio = ltv / cac",
            "Ratio LTV/CAC calculado dividiendo LTV entre CAC.",
        )

    def _calculate_payback_months(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
    ) -> None:
        if values.get("payback_months") is not None:
            return
        result = self._safe_divide(self._decimal(values.get("cac")), self._decimal(values.get("arpu")))
        if result is None:
            self._add_warning(warnings, "No se pudo calcular payback_months porque faltan cac o arpu validos.")
            return
        self._set_calculated(
            metrics,
            values,
            "payback_months",
            result,
            "payback_months = cac / arpu",
            "Payback calculado dividiendo CAC entre ARPU mensual.",
        )

    def _calculate_growth_rate(
        self,
        metrics: dict[str, CalculatedMetric],
        values: dict[str, Decimal | int | str | None],
        warnings: list[str],
        snapshot: SaasMetricSnapshot,
        previous_snapshot: SaasMetricSnapshot | None,
    ) -> None:
        if values.get("growth_rate") is not None:
            return
        if previous_snapshot is None:
            self._add_warning(warnings, "No se pudo calcular growth_rate porque no existe snapshot anterior.")
            return

        current_mrr = self._decimal(values.get("mrr"))
        previous_mrr = self._decimal(getattr(previous_snapshot, "mrr", None))
        if current_mrr is not None and previous_mrr is not None and previous_mrr > 0:
            self._set_calculated(
                metrics,
                values,
                "growth_rate",
                (current_mrr - previous_mrr) / previous_mrr,
                "growth_rate = (current_mrr - previous_mrr) / previous_mrr",
                "Growth rate calculado comparando el MRR actual contra el snapshot anterior.",
            )
            return

        current_revenue = self._decimal(getattr(snapshot, "monthly_revenue", None))
        previous_revenue = self._decimal(getattr(previous_snapshot, "monthly_revenue", None))
        if current_revenue is not None and previous_revenue is not None and previous_revenue > 0:
            self._set_calculated(
                metrics,
                values,
                "growth_rate",
                (current_revenue - previous_revenue) / previous_revenue,
                "growth_rate = (current_monthly_revenue - previous_monthly_revenue) / previous_monthly_revenue",
                "Growth rate calculado comparando ingresos mensuales contra el snapshot anterior.",
            )
            return

        self._add_warning(
            warnings,
            "No se pudo calcular growth_rate porque faltan MRR o ingresos comparables con valor previo mayor a 0.",
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
        if key in MONTH_METRICS:
            return value.quantize(MONTH_QUANT, rounding=ROUND_HALF_UP)
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

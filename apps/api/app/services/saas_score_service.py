from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import DecisionRecommendation, SustainabilityLevel
from app.models.saas_score import SaasScore
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.schemas.metric_calculation import MetricCalculationResponse
from app.schemas.saas_score import SaasScoreListResponse
from app.services.metric_calculation_service import MetricCalculationService

SCORE_QUANT = Decimal("0.01")
KEY_METRICS = [
    "mrr",
    "monthly_revenue",
    "monthly_costs",
    "paying_customers",
    "total_users",
    "active_users",
    "churn_rate",
    "retention_rate",
    "conversion_rate",
    "cac",
    "ltv",
    "ltv_cac_ratio",
    "nps",
    "uptime_percentage",
]


class SaasScoreService:
    def __init__(
        self,
        saas_score_repository: SaasScoreRepository,
        saas_project_repository: SaasProjectRepository,
        metric_snapshot_repository: MetricSnapshotRepository,
        metric_calculation_service: MetricCalculationService,
    ) -> None:
        self.saas_score_repository = saas_score_repository
        self.saas_project_repository = saas_project_repository
        self.metric_snapshot_repository = metric_snapshot_repository
        self.metric_calculation_service = metric_calculation_service

    async def generate_latest_score(self, *, project_id: UUID, owner_id: UUID) -> SaasScore:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        calculation = await self.metric_calculation_service.calculate_latest_for_project(
            project_id=project_id,
            owner_id=owner_id,
        )
        return await self._persist_score(calculation)

    async def generate_score_for_snapshot(
        self,
        *,
        project_id: UUID,
        snapshot_id: UUID,
        owner_id: UUID,
    ) -> SaasScore:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        calculation = await self.metric_calculation_service.calculate_for_snapshot(
            project_id=project_id,
            snapshot_id=snapshot_id,
            owner_id=owner_id,
        )
        return await self._persist_score(calculation)

    async def list_scores(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> SaasScoreListResponse:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        items = await self.saas_score_repository.list_by_project(
            saas_project_id=project_id,
            limit=limit,
            offset=offset,
        )
        total = await self.saas_score_repository.count_by_project(saas_project_id=project_id)
        return SaasScoreListResponse(items=items, total=total, limit=limit, offset=offset)

    async def get_latest_score(self, *, project_id: UUID, owner_id: UUID) -> SaasScore:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        score = await self.saas_score_repository.get_latest_by_project(saas_project_id=project_id)
        if score is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS score not found")
        return score

    async def get_score(self, *, project_id: UUID, score_id: UUID, owner_id: UUID) -> SaasScore:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        score = await self.saas_score_repository.get_by_id_for_project(
            score_id=score_id,
            saas_project_id=project_id,
        )
        if score is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS score not found")
        return score

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID) -> None:
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")

    async def _persist_score(self, calculation: MetricCalculationResponse) -> SaasScore:
        strengths: list[dict] = []
        weaknesses: list[dict] = []
        alerts: list[dict] = []
        recommendations: list[dict] = []

        financial_score = self._calculate_financial_score(calculation, strengths, weaknesses, alerts, recommendations)
        growth_score = self._calculate_growth_score(calculation, strengths, weaknesses, alerts, recommendations)
        retention_score = self._calculate_retention_score(calculation, strengths, weaknesses, alerts, recommendations)
        product_score = self._calculate_product_score(calculation, strengths, weaknesses, alerts, recommendations)
        risk_score = self._calculate_risk_score(calculation, alerts)

        overall_score = self._round_score(
            financial_score * Decimal("0.30")
            + growth_score * Decimal("0.25")
            + retention_score * Decimal("0.25")
            + product_score * Decimal("0.15")
            + risk_score * Decimal("0.05")
        )
        insufficient_data = self._has_insufficient_data(calculation)
        if insufficient_data:
            alerts.append(
                {
                    "severity": "medium",
                    "code": "INSUFFICIENT_KEY_DATA",
                    "title": "Datos clave insuficientes",
                    "message": "Faltan varias metricas clave; el diagnostico debe interpretarse con cautela.",
                }
            )
            recommendations.append(
                {
                    "priority": "high",
                    "title": "Completar medicion base",
                    "message": "Registra datos financieros, usuarios, retencion y disponibilidad antes de tomar decisiones estrategicas.",
                }
            )

        sustainability_level = self._classify_sustainability(overall_score, insufficient_data)
        decision_recommendation = self._recommend_decision(overall_score, sustainability_level, alerts)

        data = {
            "saas_project_id": calculation.project_id,
            "metric_snapshot_id": calculation.snapshot_id,
            "overall_score": overall_score,
            "financial_score": financial_score,
            "growth_score": growth_score,
            "retention_score": retention_score,
            "product_score": product_score,
            "risk_score": risk_score,
            "sustainability_level": sustainability_level,
            "decision_recommendation": decision_recommendation,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "alerts": alerts,
            "recommendations": recommendations,
            "scoring_version": "v1",
        }
        return await self.saas_score_repository.create(data=data)

    def _calculate_financial_score(
        self,
        calculation: MetricCalculationResponse,
        strengths: list[dict],
        weaknesses: list[dict],
        alerts: list[dict],
        recommendations: list[dict],
    ) -> Decimal:
        score = Decimal("50")
        net_profit = self._metric_value(calculation, "net_profit")
        runway = self._metric_value(calculation, "runway_months")
        ltv_cac = self._metric_value(calculation, "ltv_cac_ratio")
        payback = self._metric_value(calculation, "payback_months")

        if net_profit is not None:
            if net_profit > 0:
                score += 20
                strengths.append(self._diagnostic("POSITIVE_PROFIT", "Utilidad positiva", "El servicio genera utilidad neta positiva en el periodo."))
            elif net_profit < 0:
                score -= 20
                weaknesses.append(self._diagnostic("NEGATIVE_PROFIT", "Utilidad negativa", "Los costos superan los ingresos mensuales."))
                recommendations.append(self._recommendation("high", "Controlar costos", "Revisa costos operativos y prioriza acciones de monetizacion."))

        if runway is not None:
            if runway >= 12:
                score += 15
                strengths.append(self._diagnostic("STRONG_RUNWAY", "Runway saludable", "La caja disponible ofrece margen operativo suficiente."))
            elif runway >= 6:
                score += 5
            elif runway < 3:
                score -= 25
                alerts.append(self._alert("high", "LOW_RUNWAY", "Runway critico", "La caja disponible podria no sostener el servicio por suficientes meses."))

        if ltv_cac is not None:
            if ltv_cac >= 3:
                score += 15
                strengths.append(self._diagnostic("HEALTHY_LTV_CAC", "LTV/CAC saludable", "El valor estimado del cliente supera claramente el costo de adquisicion."))
            elif ltv_cac >= 1:
                score += 5
            else:
                score -= 20
                weaknesses.append(self._diagnostic("LOW_LTV_CAC", "LTV/CAC bajo", "El costo de adquisicion no esta siendo compensado por el valor del cliente."))

        if payback is not None:
            if payback <= 6:
                score += 10
                strengths.append(self._diagnostic("FAST_PAYBACK", "Payback rapido", "La recuperacion del CAC ocurre en pocos meses."))
            elif payback <= 12:
                score += 3
            else:
                score -= 10
                alerts.append(self._alert("medium", "SLOW_PAYBACK", "Payback lento", "La recuperacion del CAC tarda mas de un ano."))

        return self._round_score(self._clamp(score))

    def _calculate_growth_score(
        self,
        calculation: MetricCalculationResponse,
        strengths: list[dict],
        weaknesses: list[dict],
        alerts: list[dict],
        recommendations: list[dict],
    ) -> Decimal:
        score = Decimal("50")
        growth = self._metric_value(calculation, "growth_rate")
        conversion = self._metric_value(calculation, "conversion_rate")
        new_users = self._metric_value(calculation, "new_users")
        new_paying = self._metric_value(calculation, "new_paying_customers")
        active_rate = self._metric_value(calculation, "active_user_rate")

        if growth is not None:
            if growth > Decimal("0.10"):
                score += 20
                strengths.append(self._diagnostic("STRONG_GROWTH", "Crecimiento saludable", "El crecimiento del periodo supera el 10%."))
            elif growth > 0:
                score += 10
            elif growth < 0:
                score -= 20
                weaknesses.append(self._diagnostic("NEGATIVE_GROWTH", "Decrecimiento", "La metrica base de crecimiento retrocedio frente al periodo anterior."))

        if conversion is not None:
            if conversion >= Decimal("0.05"):
                score += 15
                strengths.append(self._diagnostic("GOOD_CONVERSION", "Buena conversion", "La proporcion de usuarios que pagan es saludable para una etapa inicial."))
            elif conversion >= Decimal("0.01"):
                score += 5
            else:
                score -= 15
                weaknesses.append(self._diagnostic("LOW_CONVERSION", "Conversion baja", "La proporcion de usuarios que pagan es baja."))
                recommendations.append(self._recommendation("medium", "Mejorar conversion", "Revisa pricing, onboarding y propuesta de valor para convertir mas usuarios."))

        if new_paying is not None and new_paying > 0:
            score += 10
        if new_users is not None and new_users > 0:
            score += 5
        if active_rate is not None and active_rate >= Decimal("0.30"):
            score += 5

        return self._round_score(self._clamp(score))

    def _calculate_retention_score(
        self,
        calculation: MetricCalculationResponse,
        strengths: list[dict],
        weaknesses: list[dict],
        alerts: list[dict],
        recommendations: list[dict],
    ) -> Decimal:
        score = Decimal("50")
        churn = self._metric_value(calculation, "churn_rate")
        retention = self._metric_value(calculation, "retention_rate")
        active_rate = self._metric_value(calculation, "active_user_rate")
        nps = self._metric_value(calculation, "nps")

        if churn is not None:
            if churn <= Decimal("0.05"):
                score += 20
                strengths.append(self._diagnostic("LOW_CHURN", "Churn saludable", "El churn estimado se mantiene en un rango bajo, lo que sugiere buena retencion."))
            elif churn <= Decimal("0.10"):
                score += 5
            else:
                score -= 25
                alerts.append(self._alert("high", "HIGH_CHURN", "Churn alto", "La perdida de clientes requiere atencion prioritaria."))
                recommendations.append(self._recommendation("high", "Reducir churn", "Analiza motivos de cancelacion y prioriza mejoras de retencion antes de escalar adquisicion."))

        if retention is not None:
            if retention >= Decimal("0.90"):
                score += 15
            elif retention >= Decimal("0.75"):
                score += 5
            else:
                score -= 15
                weaknesses.append(self._diagnostic("LOW_RETENTION", "Retencion baja", "La retencion esta por debajo de un umbral sostenible."))

        if active_rate is not None and active_rate >= Decimal("0.40"):
            score += 8
        if nps is not None:
            if nps >= 50:
                score += 15
                strengths.append(self._diagnostic("HIGH_NPS", "Muy buena percepcion", "El NPS sugiere satisfaccion y potencial recomendacion."))
            elif nps >= 0:
                score += 5
            else:
                score -= 15
                alerts.append(self._alert("medium", "NEGATIVE_NPS", "NPS negativo", "La percepcion de usuarios es negativa y puede afectar retencion."))

        return self._round_score(self._clamp(score))

    def _calculate_product_score(
        self,
        calculation: MetricCalculationResponse,
        strengths: list[dict],
        weaknesses: list[dict],
        alerts: list[dict],
        recommendations: list[dict],
    ) -> Decimal:
        score = Decimal("50")
        uptime = self._metric_value(calculation, "uptime_percentage")
        bugs = self._metric_value(calculation, "critical_bugs")
        tickets = self._metric_value(calculation, "support_tickets")
        active_users = self._metric_value(calculation, "active_users")
        active_rate = self._metric_value(calculation, "active_user_rate")

        if uptime is not None:
            if uptime >= 99:
                score += 20
                strengths.append(self._diagnostic("HIGH_UPTIME", "Alta disponibilidad", "El servicio mantiene una disponibilidad saludable."))
            elif uptime >= 95:
                score += 8
            else:
                score -= 20
                alerts.append(self._alert("high", "LOW_UPTIME", "Disponibilidad baja", "El uptime esta por debajo del nivel esperado para un servicio SaaS."))

        if bugs is not None:
            if bugs == 0:
                score += 15
            elif bugs > 0:
                score -= 15
                weaknesses.append(self._diagnostic("CRITICAL_BUGS", "Bugs criticos activos", "Existen bugs criticos que elevan el riesgo operativo."))
                recommendations.append(self._recommendation("high", "Resolver bugs criticos", "Prioriza incidentes y defectos criticos antes de ampliar adquisicion."))

        if tickets is not None and active_users is not None and active_users > 0:
            ticket_rate = tickets / active_users
            if ticket_rate > Decimal("0.20"):
                score -= 10
                alerts.append(self._alert("medium", "HIGH_SUPPORT_LOAD", "Alta carga de soporte", "Los tickets son altos respecto a usuarios activos."))

        if active_rate is not None and active_rate >= Decimal("0.30"):
            score += 10

        return self._round_score(self._clamp(score))

    def _calculate_risk_score(self, calculation: MetricCalculationResponse, alerts: list[dict]) -> Decimal:
        score = Decimal("100")
        runway = self._metric_value(calculation, "runway_months")
        net_profit = self._metric_value(calculation, "net_profit")
        churn = self._metric_value(calculation, "churn_rate")
        retention = self._metric_value(calculation, "retention_rate")
        ltv_cac = self._metric_value(calculation, "ltv_cac_ratio")
        uptime = self._metric_value(calculation, "uptime_percentage")
        bugs = self._metric_value(calculation, "critical_bugs")

        if runway is not None and runway < 3:
            score -= 25
        if net_profit is not None and net_profit < 0:
            score -= 15
        if churn is not None and churn > Decimal("0.10"):
            score -= 20
        if retention is not None and retention < Decimal("0.75"):
            score -= 15
        if ltv_cac is not None and ltv_cac < 1:
            score -= 20
        if uptime is not None and uptime < 95:
            score -= 15
        if bugs is not None and bugs > 0:
            score -= 10

        missing_key_count = self._missing_key_count(calculation)
        if missing_key_count > len(KEY_METRICS) // 2:
            score -= 25
        elif missing_key_count >= 4:
            score -= 10

        risk_score = self._round_score(self._clamp(score))
        if risk_score < 50:
            alerts.append(self._alert("high", "HIGH_RISK_PROFILE", "Perfil de riesgo alto", "Varias senales operativas o comerciales requieren accion."))
        return risk_score

    def _classify_sustainability(
        self,
        overall_score: Decimal,
        insufficient_data: bool,
    ) -> SustainabilityLevel:
        if insufficient_data:
            return SustainabilityLevel.INSUFFICIENT_DATA
        if overall_score >= 80:
            return SustainabilityLevel.HEALTHY
        if overall_score >= 60:
            return SustainabilityLevel.VIABLE_WITH_ADJUSTMENTS
        if overall_score >= 40:
            return SustainabilityLevel.RISKY
        return SustainabilityLevel.UNSUSTAINABLE

    def _recommend_decision(
        self,
        overall_score: Decimal,
        sustainability_level: SustainabilityLevel,
        alerts: list[dict],
    ) -> DecisionRecommendation:
        if sustainability_level == SustainabilityLevel.INSUFFICIENT_DATA:
            return DecisionRecommendation.INSUFFICIENT_DATA
        if overall_score >= 80:
            return DecisionRecommendation.CONTINUE
        if overall_score >= 60:
            return DecisionRecommendation.IMPROVE
        if overall_score >= 40:
            has_high_alert = any(alert.get("severity") == "high" for alert in alerts)
            return DecisionRecommendation.PIVOT if has_high_alert else DecisionRecommendation.IMPROVE
        return DecisionRecommendation.PAUSE

    def _has_insufficient_data(self, calculation: MetricCalculationResponse) -> bool:
        return self._missing_key_count(calculation) > len(KEY_METRICS) / 2

    def _missing_key_count(self, calculation: MetricCalculationResponse) -> int:
        return sum(1 for key in KEY_METRICS if self._metric_value(calculation, key) is None)

    def _metric_value(self, calculation: MetricCalculationResponse, key: str) -> Decimal | None:
        metric = calculation.metrics.get(key)
        if metric is None or metric.value is None or metric.source == "missing":
            return None
        return metric.value if isinstance(metric.value, Decimal) else Decimal(str(metric.value))

    def _clamp(self, value: Decimal) -> Decimal:
        return max(Decimal("0"), min(Decimal("100"), value))

    def _round_score(self, value: Decimal) -> Decimal:
        return value.quantize(SCORE_QUANT, rounding=ROUND_HALF_UP)

    def _diagnostic(self, code: str, title: str, message: str) -> dict:
        return {"code": code, "title": title, "message": message}

    def _alert(self, severity: str, code: str, title: str, message: str) -> dict:
        return {"severity": severity, "code": code, "title": title, "message": message}

    def _recommendation(self, priority: str, title: str, message: str) -> dict:
        return {"priority": priority, "title": title, "message": message}

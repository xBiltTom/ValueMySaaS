from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import DecisionRecommendation, SaasStage, SustainabilityLevel
from app.models.saas_project import SaasProject
from app.models.saas_score import SaasScore
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.schemas.metric_calculation import MetricCalculationResponse
from app.schemas.saas_score import SaasScoreListResponse
from app.services.metric_calculation_service import MetricCalculationService

# Stages considered «planning phase» — no real financial data exists yet.
_PLANNING_STAGES = {SaasStage.IDEA, SaasStage.PLANNING}

_PLANNING_SCORE_ERROR = (
    "Los proyectos en planeación se evalúan mediante Análisis IA, no con score matemático. "
    "Ve a la sección de Análisis IA."
)

SCORE_QUANT = Decimal("0.01")
KEY_METRICS = [
    "mrr",
    "monthly_costs",
    "paying_customers",
    "total_users",
    "churn_rate",
    "cac",
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
        project = await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        self._guard_planning_stage(project)
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
        project = await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        self._guard_planning_stage(project)
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

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID) -> SaasProject:
        """Verifies ownership and returns the project. Raises 404 if not found."""
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")
        return project

    def _guard_planning_stage(self, project: SaasProject) -> None:
        """Raises HTTP 422 if the project is in a planning phase."""
        stage = project.stage if isinstance(project.stage, SaasStage) else SaasStage(project.stage)
        if stage in _PLANNING_STAGES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=_PLANNING_SCORE_ERROR,
            )

    async def _persist_score(self, calculation: MetricCalculationResponse) -> SaasScore:
        strengths: list[dict] = []
        weaknesses: list[dict] = []
        alerts: list[dict] = []
        recommendations: list[dict] = []

        financial_score = self._calculate_financial_score(calculation, strengths, weaknesses, alerts, recommendations)
        growth_score = self._calculate_growth_score(calculation, strengths, weaknesses, alerts, recommendations)
        retention_score = self._calculate_retention_score(calculation, strengths, weaknesses, alerts, recommendations)
        
        # Product/Risk logic simplified
        product_score = Decimal("50")
        risk_score = self._calculate_risk_score(calculation, alerts)

        overall_score = self._round_score(
            financial_score * Decimal("0.40")
            + growth_score * Decimal("0.30")
            + retention_score * Decimal("0.20")
            + risk_score * Decimal("0.10")
        )
        
        insufficient_data = self._has_insufficient_data(calculation)
        if insufficient_data:
            alerts.append(self._alert("medium", "INSUFFICIENT_KEY_DATA", "Datos clave insuficientes", "Faltan métricas vitales."))
            recommendations.append(self._recommendation("high", "Completar métricas", "Registra MRR, costos y usuarios para mejorar la evaluación."))

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
        ltv_cac = self._metric_value(calculation, "ltv_cac_ratio")

        if net_profit is not None:
            if net_profit > 0:
                score += 25
                strengths.append(self._diagnostic("POSITIVE_PROFIT", "Utilidad positiva", "Ingresos superan a los costos."))
            elif net_profit < 0:
                score -= 20
                weaknesses.append(self._diagnostic("NEGATIVE_PROFIT", "Utilidad negativa", "Costos superan a los ingresos."))

        if ltv_cac is not None:
            if ltv_cac >= 3:
                score += 25
                strengths.append(self._diagnostic("HEALTHY_LTV_CAC", "LTV/CAC excelente", "El cliente genera mucho más valor de lo que costó adquirirlo."))
            elif ltv_cac >= 1:
                score += 10
            else:
                score -= 20
                weaknesses.append(self._diagnostic("LOW_LTV_CAC", "LTV/CAC bajo", "Cuesta más adquirir clientes de lo que generan."))

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
        conversion = self._metric_value(calculation, "conversion_rate")
        paying_customers = self._metric_value(calculation, "paying_customers")

        if conversion is not None:
            if conversion >= Decimal("0.05"):
                score += 25
                strengths.append(self._diagnostic("GOOD_CONVERSION", "Buena conversión", "Más del 5% de usuarios pagan."))
            elif conversion >= Decimal("0.01"):
                score += 10
            else:
                score -= 20
                weaknesses.append(self._diagnostic("LOW_CONVERSION", "Conversión baja", "Pocos usuarios registrados terminan pagando."))

        if paying_customers is not None and paying_customers > 0:
            score += 15

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

        if churn is not None:
            if churn <= Decimal("0.05"):
                score += 30
                strengths.append(self._diagnostic("LOW_CHURN", "Baja cancelación", "Tasa de cancelación muy controlada."))
            elif churn <= Decimal("0.10"):
                score += 10
            else:
                score -= 30
                alerts.append(self._alert("high", "HIGH_CHURN", "Cancelación alta", "Muchos clientes abandonan el servicio."))
                
        return self._round_score(self._clamp(score))

    def _calculate_risk_score(self, calculation: MetricCalculationResponse, alerts: list[dict]) -> Decimal:
        score = Decimal("100")
        net_profit = self._metric_value(calculation, "net_profit")
        churn = self._metric_value(calculation, "churn_rate")
        ltv_cac = self._metric_value(calculation, "ltv_cac_ratio")

        if net_profit is not None and net_profit < 0:
            score -= 20
        if churn is not None and churn > Decimal("0.10"):
            score -= 30
        if ltv_cac is not None and ltv_cac < 1:
            score -= 30

        missing_key_count = self._missing_key_count(calculation)
        if missing_key_count >= 3:
            score -= 20

        risk_score = self._round_score(self._clamp(score))
        if risk_score < 50:
            alerts.append(self._alert("high", "HIGH_RISK_PROFILE", "Riesgo general", "Múltiples métricas están en números críticos."))
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

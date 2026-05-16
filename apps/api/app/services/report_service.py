from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import ReportStatus, ReportType
from app.models.report import Report
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.schemas.report import ReportListResponse
from app.services.dashboard_service import DashboardService


class ReportService:
    def __init__(
        self,
        report_repository: ReportRepository,
        saas_project_repository: SaasProjectRepository,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_score_repository: SaasScoreRepository,
        dashboard_service: DashboardService,
    ) -> None:
        self.report_repository = report_repository
        self.saas_project_repository = saas_project_repository
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_score_repository = saas_score_repository
        self.dashboard_service = dashboard_service

    async def generate_basic_report(self, *, project_id: UUID, owner_id: UUID) -> Report:
        project = await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        dashboard = await self.dashboard_service.get_project_dashboard(
            project_id=project_id,
            owner_id=owner_id,
        )
        latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        latest_score = await self.saas_score_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        generated_at = datetime.now(timezone.utc)
        content = self._basic_content(
            dashboard=dashboard,
            latest_score=latest_score,
            generated_at=generated_at,
        )
        return await self._create_report(
            project_id=project_id,
            owner_id=owner_id,
            title=f"Reporte basico de {project.name}",
            report_type=ReportType.BASIC,
            content=content,
            generated_at=generated_at,
            metric_snapshot_id=latest_snapshot.id if latest_snapshot else None,
            score_id=latest_score.id if latest_score else None,
        )

    async def generate_executive_report(self, *, project_id: UUID, owner_id: UUID) -> Report:
        project = await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        dashboard = await self.dashboard_service.get_project_dashboard(
            project_id=project_id,
            owner_id=owner_id,
        )
        latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        latest_score = await self.saas_score_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        generated_at = datetime.now(timezone.utc)
        content = self._executive_content(
            dashboard=dashboard,
            latest_score=latest_score,
            generated_at=generated_at,
        )
        return await self._create_report(
            project_id=project_id,
            owner_id=owner_id,
            title=f"Reporte ejecutivo de {project.name}",
            report_type=ReportType.EXECUTIVE,
            content=content,
            generated_at=generated_at,
            metric_snapshot_id=latest_snapshot.id if latest_snapshot else None,
            score_id=latest_score.id if latest_score else None,
        )

    async def list_reports(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        limit: int = 20,
        offset: int = 0,
        report_type: ReportType | None = None,
    ) -> ReportListResponse:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        items = await self.report_repository.list_by_project(
            saas_project_id=project_id,
            limit=limit,
            offset=offset,
            report_type=report_type,
        )
        total = await self.report_repository.count_by_project(
            saas_project_id=project_id,
            report_type=report_type,
        )
        return ReportListResponse(items=items, total=total, limit=limit, offset=offset)

    async def get_report(self, *, project_id: UUID, report_id: UUID, owner_id: UUID) -> Report:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        report = await self.report_repository.get_by_id_for_project(
            report_id=report_id,
            saas_project_id=project_id,
        )
        if report is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
        return report

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID):
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")
        return project

    async def _create_report(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        title: str,
        report_type: ReportType,
        content: dict,
        generated_at: datetime,
        metric_snapshot_id: UUID | None,
        score_id: UUID | None,
    ) -> Report:
        return await self.report_repository.create(
            data={
                "saas_project_id": project_id,
                "user_id": owner_id,
                "metric_snapshot_id": metric_snapshot_id,
                "score_id": score_id,
                "ai_analysis_id": None,
                "title": title,
                "report_type": report_type,
                "status": ReportStatus.GENERATED,
                "content": content,
                "file_url": None,
                "generated_at": generated_at,
            }
        )

    def _basic_content(self, *, dashboard, latest_score, generated_at: datetime) -> dict:
        dashboard_data = dashboard.model_dump(mode="json")
        return {
            "kind": "BASIC",
            "generated_at": generated_at.isoformat(),
            "project": dashboard_data["project"],
            "summary": {
                "title": "Resumen basico de sostenibilidad",
                "message": self._summary_message(dashboard.latest_score),
            },
            "latest_snapshot": dashboard_data["latest_snapshot"],
            "latest_score": dashboard_data["latest_score"],
            "metric_cards": dashboard_data["metric_cards"],
            "alerts": dashboard_data["alerts"],
            "recommendations": dashboard_data["recommendations"],
            "conclusion": self._conclusion_message(dashboard.latest_score),
            "data_quality": self._data_quality(dashboard),
        }

    def _executive_content(self, *, dashboard, latest_score, generated_at: datetime) -> dict:
        dashboard_data = dashboard.model_dump(mode="json")
        return {
            "kind": "EXECUTIVE",
            "generated_at": generated_at.isoformat(),
            "project": dashboard_data["project"],
            "executive_summary": {
                "title": "Diagnostico ejecutivo del SaaS",
                "message": self._summary_message(dashboard.latest_score),
            },
            "service_value_assessment": {
                "message": (
                    "Evaluacion del valor del servicio desde metricas de sostenibilidad, "
                    "crecimiento, retencion y producto."
                )
            },
            "latest_snapshot": dashboard_data["latest_snapshot"],
            "latest_score": dashboard_data["latest_score"],
            "metric_cards": dashboard_data["metric_cards"],
            "alerts": dashboard_data["alerts"],
            "strengths": latest_score.strengths if latest_score and latest_score.strengths else [],
            "weaknesses": latest_score.weaknesses if latest_score and latest_score.weaknesses else [],
            "recommendations": dashboard_data["recommendations"],
            "series": dashboard_data["series"],
            "conclusion": {
                "sustainability": dashboard_data["latest_score"]["sustainability_level"]
                if dashboard_data["latest_score"]
                else "INSUFFICIENT_DATA",
                "decision": dashboard_data["latest_score"]["decision_recommendation"]
                if dashboard_data["latest_score"]
                else "INSUFFICIENT_DATA",
                "message": self._conclusion_message(dashboard.latest_score),
            },
            "data_quality": self._data_quality(dashboard),
        }

    def _data_quality(self, dashboard) -> dict:
        notes: list[str] = []
        if dashboard.latest_snapshot is None:
            notes.append(
                "No existen metricas registradas para este SaaS. Registra al menos un snapshot para obtener analisis financiero, crecimiento, retencion y producto."
            )
        if dashboard.latest_score is None:
            notes.append(
                "No existe un diagnostico de sostenibilidad generado. Genera un score para obtener clasificacion, alertas y recomendaciones."
            )
        return {
            "has_snapshot": dashboard.latest_snapshot is not None,
            "has_score": dashboard.latest_score is not None,
            "notes": notes,
        }

    def _summary_message(self, latest_score) -> str:
        if latest_score is None:
            return "El reporte se genero con datos limitados porque aun no existe un diagnostico persistido."
        level = latest_score.sustainability_level.value
        if level == "HEALTHY":
            return "El SaaS muestra una condicion saludable segun el diagnostico actual."
        if level == "VIABLE_WITH_ADJUSTMENTS":
            return "El SaaS muestra viabilidad, pero requiere ajustes para fortalecer sostenibilidad, retencion o eficiencia operativa."
        if level == "RISKY":
            return "El SaaS presenta senales de riesgo que deben atenderse antes de escalar adquisicion o inversion."
        if level == "UNSUSTAINABLE":
            return "El SaaS presenta condiciones debiles de sostenibilidad y requiere correcciones criticas."
        return "El diagnostico es limitado porque faltan datos clave."

    def _conclusion_message(self, latest_score) -> str:
        if latest_score is None:
            return "No hay score persistido; se recomienda generar un diagnostico antes de tomar decisiones ejecutivas."
        level = latest_score.sustainability_level.value
        if level == "HEALTHY":
            return "Se recomienda continuar monitoreando metricas clave y mantener mejora continua."
        if level == "VIABLE_WITH_ADJUSTMENTS":
            return "Se recomienda priorizar los ajustes detectados y volver a evaluar el score tras el siguiente snapshot."
        if level == "RISKY":
            return "Se recomienda atender alertas y problemas de retencion, sostenibilidad o producto antes de escalar."
        if level == "UNSUSTAINABLE":
            return "Se recomienda pausar, corregir problemas criticos y reevaluar el modelo."
        return "Se recomienda completar metricas financieras, usuarios, retencion, conversion y disponibilidad."

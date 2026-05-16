import json
from uuid import UUID

from fastapi import HTTPException, status

from app.models.ai_analysis import AiAnalysis
from app.models.enums import AiAnalysisType
from app.repositories.ai_analysis_repository import AiAnalysisRepository
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.schemas.ai_analysis import AiAnalysisCreate, AiAnalysisListResponse
from app.services.ai_context_service import AiContextService
from app.services.ai_key_service import AiProviderKeyService
from app.services.llm_client_service import LlmClientService

PROMPT_VERSION = "v1"

SYSTEM_PROMPT = """Eres un analizador de proyectos SaaS y servicios TI.
Tu objetivo es ayudar a evaluar valor, sostenibilidad, riesgo, retencion, crecimiento y mejora continua.
Usa SOLO los datos proporcionados en el contexto. No inventes metricas.
Si faltan datos, dilo explicitamente.
Da recomendaciones accionables y priorizadas.
Explica en lenguaje claro.
No des asesoria financiera garantizada.
No afirmes que predices el exito.
Conecta el analisis con gestion de servicios TI: valor del servicio, desempeno, continuidad, mejora continua y toma de decisiones.
Responde en espanol."""

ANALYSIS_INSTRUCTIONS = {
    AiAnalysisType.FULL_DIAGNOSIS: "Produce resumen ejecutivo, interpretacion de score, analisis financiero, crecimiento, retencion, producto/operacion, riesgos principales, recomendaciones priorizadas y proximos pasos.",
    AiAnalysisType.RISK_ANALYSIS: "Enfocate en riesgos financieros, retencion, producto, operacion, senales faltantes y mitigaciones.",
    AiAnalysisType.PRICING_ANALYSIS: "Enfocate en precio actual, ARPU, LTV, CAC, LTV/CAC, conversion y recomendaciones de pricing.",
    AiAnalysisType.GROWTH_ANALYSIS: "Enfocate en growth rate, usuarios nuevos, conversion, adquisicion, traccion y recomendaciones de crecimiento.",
    AiAnalysisType.RETENTION_ANALYSIS: "Enfocate en churn, retention, active user rate, NPS, soporte y recomendaciones de retencion.",
    AiAnalysisType.EXECUTIVE_SUMMARY: "Entrega un resumen breve con estado general, decision sugerida, principales alertas y proximos pasos.",
}


class AiAnalysisService:
    def __init__(
        self,
        ai_analysis_repository: AiAnalysisRepository,
        ai_key_service: AiProviderKeyService,
        saas_project_repository: SaasProjectRepository,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_score_repository: SaasScoreRepository,
        ai_context_service: AiContextService,
        llm_client_service: LlmClientService,
    ) -> None:
        self.ai_analysis_repository = ai_analysis_repository
        self.ai_key_service = ai_key_service
        self.saas_project_repository = saas_project_repository
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_score_repository = saas_score_repository
        self.ai_context_service = ai_context_service
        self.llm_client_service = llm_client_service

    async def generate_analysis(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        payload: AiAnalysisCreate,
    ) -> AiAnalysis:
        if payload.analysis_type == AiAnalysisType.CUSTOM and not payload.custom_question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="custom_question is required for CUSTOM analysis",
            )
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        key, api_key = await self.ai_key_service.get_decrypted_key_for_user(
            key_id=payload.ai_key_id,
            user_id=owner_id,
        )
        context = await self.ai_context_service.build_context(project_id=project_id, owner_id=owner_id)
        user_prompt = self._build_user_prompt(
            analysis_type=payload.analysis_type,
            context=context,
            custom_question=payload.custom_question,
        )
        llm_response = await self.llm_client_service.generate_analysis(
            provider=key.provider,
            api_key=api_key,
            model_name=payload.model_name,
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )
        latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        latest_score = await self.saas_score_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        return await self.ai_analysis_repository.create(
            data={
                "saas_project_id": project_id,
                "metric_snapshot_id": latest_snapshot.id if latest_snapshot else None,
                "score_id": latest_score.id if latest_score else None,
                "user_id": owner_id,
                "provider": key.provider,
                "model_name": llm_response.model_name or payload.model_name,
                "analysis_type": payload.analysis_type,
                "prompt_version": PROMPT_VERSION,
                "input_context": context,
                "output_text": llm_response.output_text,
                "output_json": llm_response.output_json,
                "tokens_input": llm_response.tokens_input,
                "tokens_output": llm_response.tokens_output,
                "estimated_cost": llm_response.estimated_cost,
            }
        )

    async def list_analyses(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        limit: int = 20,
        offset: int = 0,
        analysis_type: AiAnalysisType | None = None,
    ) -> AiAnalysisListResponse:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        items = await self.ai_analysis_repository.list_by_project(
            saas_project_id=project_id,
            analysis_type=analysis_type,
            limit=limit,
            offset=offset,
        )
        total = await self.ai_analysis_repository.count_by_project(
            saas_project_id=project_id,
            analysis_type=analysis_type,
        )
        return AiAnalysisListResponse(items=items, total=total, limit=limit, offset=offset)

    async def get_analysis(self, *, project_id: UUID, analysis_id: UUID, owner_id: UUID) -> AiAnalysis:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        analysis = await self.ai_analysis_repository.get_by_id_for_project(
            analysis_id=analysis_id,
            saas_project_id=project_id,
        )
        if analysis is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI analysis not found")
        return analysis

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID) -> None:
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")

    def _build_user_prompt(
        self,
        *,
        analysis_type: AiAnalysisType,
        context: dict,
        custom_question: str | None,
    ) -> str:
        if analysis_type == AiAnalysisType.CUSTOM:
            instruction = f"Responde esta pregunta dentro del contexto del SaaS: {custom_question}"
        else:
            instruction = ANALYSIS_INSTRUCTIONS.get(analysis_type, ANALYSIS_INSTRUCTIONS[AiAnalysisType.FULL_DIAGNOSIS])
        return (
            f"Tipo de analisis: {analysis_type.value}\n"
            f"Instrucciones: {instruction}\n\n"
            "Contexto estructurado JSON:\n"
            f"{json.dumps(context, ensure_ascii=False, indent=2)}"
        )

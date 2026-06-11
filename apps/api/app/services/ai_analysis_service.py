"""Servicio de análisis de IA — bifurca entre etapa PLANNING e IMPLEMENTED.

PLANNING (IDEA, PLANNING):
  - Usa campos descriptivos del proyecto (main_problem, value_proposition, etc.)
  - El LLM evalúa con un sistema de pesos y devuelve un veredicto estructurado.
  - No requiere snapshots de métricas.

IMPLEMENTED (MVP, LAUNCHED, GROWING, PAUSED):
  - Usa el contexto completo: dashboard, métricas, scores.
  - El LLM analiza los datos cuantitativos y genera recomendaciones.
"""
import json
import logging
from uuid import UUID
from decimal import Decimal

from fastapi import HTTPException, status

from app.models.ai_analysis import AiAnalysis
from app.models.enums import AiAnalysisType, CreditReason, ProjectPhase, SaasStage
from app.repositories.ai_analysis_repository import AiAnalysisRepository
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.repositories.user_repository import UserRepository
from app.schemas.ai_analysis import AiAnalysisCreate, AiAnalysisListResponse, PlanningAnalysisOutput
from app.services.ai_context_service import AiContextService
from app.services.credit_service import CreditService
from app.services.llm_client_service import LlmClientService

logger = logging.getLogger(__name__)

PROMPT_VERSION = "v2"

# Etapas que corresponden a la fase PLANNING (evaluación cualitativa)
PLANNING_STAGES = {SaasStage.IDEA, SaasStage.PLANNING}

# ---------------------------------------------------------------------------
# Prompts del sistema
# ---------------------------------------------------------------------------

PLANNING_SYSTEM_PROMPT = """Eres un mentor experto, amigable y motivador especializado en startups y emprendimiento tecnológico estudiantil.
Tu misión es guiar a estudiantes de Ingeniería de Sistemas a perfeccionar sus ideas de software como servicio (SaaS).

Evalúa el proyecto usando ÚNICAMENTE la información descriptiva provista.
Usa un sistema de pesos para calcular el puntaje global:
  - Claridad del problema: 30% del puntaje total
  - Propuesta de valor: 25%
  - Mercado objetivo: 20%
  - Modelo de negocio: 15%
  - Viabilidad del precio: 10%

Sé sumamente empático, constructivo y usa un tono conversacional (como si estuvieras charlando con el estudiante).
Estructura tu respuesta de forma amigable y moderna, usando encabezados creativos, negritas y emojis. 
¡EVITA parecer un robot que lista puntajes crudos! (NO hagas esto: "Problem Clarity Score: 60%. La descripción..."). En su lugar, usa un lenguaje humano y estructurado como "💡 Sobre el problema que resuelves:" o "🚀 Tu Propuesta de Valor:".

Primero, redacta tu análisis en Markdown dirigido directamente al estudiante ("Hola, tu idea suena genial...").
Al final de tu respuesta, DEBES incluir OBLIGATORIAMENTE un bloque de código markdown con retrocomillas (```json) que contenga el esquema exacto solicitado.
REGLA MUY IMPORTANTE: NO escribas absolutamente NINGUNA frase introductoria antes del JSON (como "Aquí tienes el JSON" o "El veredicto es:"). Termina tu párrafo de análisis e INMEDIATAMENTE abre el bloque ```json."""

IMPLEMENTED_SYSTEM_PROMPT = """Eres un analizador experto en proyectos SaaS y servicios TI para estudiantes.
Tu objetivo es ayudar a evaluar valor, sostenibilidad, riesgo, retención, crecimiento y mejora continua.

Usa SOLO los datos proporcionados en el contexto. No inventes métricas.
Si faltan datos, indícalo explícitamente.
Da recomendaciones concretas, priorizadas y fáciles de entender para un estudiante.
No des asesoría financiera garantizada ni afirmes que predices el éxito.
Conecta el análisis con métricas SaaS reales: MRR, churn, LTV/CAC, runway.
Responde en español con lenguaje claro y accionable."""

# Instrucciones específicas por tipo de análisis (para fase IMPLEMENTED)
ANALYSIS_INSTRUCTIONS = {
    AiAnalysisType.FULL_DIAGNOSIS: (
        "Produce resumen ejecutivo, interpretación del score, análisis financiero, "
        "crecimiento, retención, producto/operación, riesgos principales, "
        "recomendaciones priorizadas y próximos pasos."
    ),
    AiAnalysisType.RISK_ANALYSIS: (
        "Enfócate en riesgos financieros, retención, producto, operación, "
        "señales faltantes y mitigaciones."
    ),
    AiAnalysisType.PRICING_ANALYSIS: (
        "Enfócate en precio actual, ARPU, LTV, CAC, LTV/CAC, conversión "
        "y recomendaciones de pricing accesibles para un estudiante."
    ),
    AiAnalysisType.GROWTH_ANALYSIS: (
        "Enfócate en growth rate, usuarios nuevos, conversión, adquisición, "
        "tracción y recomendaciones de crecimiento."
    ),
    AiAnalysisType.RETENTION_ANALYSIS: (
        "Enfócate en churn, retención, active user rate, NPS, soporte "
        "y recomendaciones de retención."
    ),
    AiAnalysisType.EXECUTIVE_SUMMARY: (
        "Entrega un resumen breve con estado general, decisión sugerida, "
        "principales alertas y próximos pasos. Máximo 300 palabras."
    ),
}

# Prompt para generar el JSON estructurado de PLANNING
PLANNING_JSON_SCHEMA = """{
  "problem_clarity_score": <0-100, peso 30%>,
  "value_prop_score": <0-100, peso 25%>,
  "market_fit_score": <0-100, peso 20%>,
  "business_model_score": <0-100, peso 15%>,
  "pricing_feasibility_score": <0-100, peso 10%>,
  "overall_score": <promedio ponderado 0-100>,
  "market_size_estimate": "<estimación concreta del tamaño de mercado local>",
  "infrastructure_complexity": "<BAJA|MEDIA|ALTA>",
  "breakeven_customers": "<número aproximado de clientes para punto de equilibrio>",
  "verdict": "<CONSTRUYE|VALIDA_PRIMERO|REPLANTEA>",
  "verdict_rationale": "<justificación en 2-3 oraciones para un estudiante>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>"],
  "risks": ["<riesgo 1>", "<riesgo 2>"],
  "next_steps": ["<paso 1>", "<paso 2>", "<paso 3>"]
}"""

# Mapeo de valores en español a los enums Python
VERDICT_MAP = {
    "CONSTRUYE": "BUILD",
    "VALIDA_PRIMERO": "VALIDATE_FIRST",
    "REPLANTEA": "RETHINK",
    # También aceptar inglés directo
    "BUILD": "BUILD",
    "VALIDATE_FIRST": "VALIDATE_FIRST",
    "RETHINK": "RETHINK",
}

COMPLEXITY_MAP = {
    "BAJA": "LOW",
    "MEDIA": "MEDIUM",
    "ALTA": "HIGH",
    "LOW": "LOW",
    "MEDIUM": "MEDIUM",
    "HIGH": "HIGH",
}


class AiAnalysisService:
    def __init__(
        self,
        ai_analysis_repository: AiAnalysisRepository,
        credit_service: CreditService,
        saas_project_repository: SaasProjectRepository,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_score_repository: SaasScoreRepository,
        ai_context_service: AiContextService,
        llm_client_service: LlmClientService,
        user_repository: UserRepository,
    ) -> None:
        self.ai_analysis_repository = ai_analysis_repository
        self.credit_service = credit_service
        self.saas_project_repository = saas_project_repository
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_score_repository = saas_score_repository
        self.ai_context_service = ai_context_service
        self.llm_client_service = llm_client_service
        self.user_repository = user_repository

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
                detail="custom_question es requerido para análisis de tipo CUSTOM.",
            )

        project = await self._get_owned_project(project_id=project_id, owner_id=owner_id)
        user = await self.user_repository.get_by_id(owner_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

        # Determinar la fase del proyecto
        phase = self._get_project_phase(project.stage)

        # Resolver credenciales LLM (BYOK o créditos del sistema)
        credentials = await self.credit_service.resolve_llm_credentials(
            user=user,
            ai_key_id=payload.ai_key_id,
        )

        # Construir el prompt según la fase
        if phase == ProjectPhase.PLANNING:
            system_prompt = PLANNING_SYSTEM_PROMPT
            user_prompt = self._build_planning_prompt(project=project)
        else:
            system_prompt = IMPLEMENTED_SYSTEM_PROMPT
            context = await self.ai_context_service.build_context(
                project_id=project_id, owner_id=owner_id
            )
            user_prompt = self._build_implemented_prompt(
                analysis_type=payload.analysis_type,
                context=context,
                custom_question=payload.custom_question,
            )

        # Llamar al LLM
        llm_response = await self.llm_client_service.generate_analysis(
            provider=credentials.provider,
            api_key=credentials.api_key,
            model_name=payload.model_name or credentials.model_name,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        # Parsear output según la fase
        output_json = None
        if phase == ProjectPhase.PLANNING:
            output_json = self._parse_planning_output(llm_response.output_text)
        else:
            output_json = llm_response.output_json

        latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        latest_score = await self.saas_score_repository.get_latest_by_project(
            saas_project_id=project_id,
        )

        # Persistir el análisis
        analysis = await self.ai_analysis_repository.create(
            data={
                "saas_project_id": project_id,
                "metric_snapshot_id": latest_snapshot.id if latest_snapshot else None,
                "score_id": latest_score.id if latest_score else None,
                "user_id": owner_id,
                "provider": credentials.provider,
                "model_name": llm_response.model_name or payload.model_name or credentials.model_name,
                "analysis_type": payload.analysis_type,
                "prompt_version": PROMPT_VERSION,
                "input_context": {
                    "phase": phase.value,
                    "project_stage": project.stage.value,
                } if phase == ProjectPhase.PLANNING else (context if phase == ProjectPhase.IMPLEMENTED else None),
                "output_text": llm_response.output_text,
                "output_json": output_json,
                "tokens_input": llm_response.tokens_input,
                "tokens_output": llm_response.tokens_output,
                "estimated_cost": llm_response.estimated_cost,
            }
        )

        # Consumir crédito DESPUÉS de persistir (si se usó el sistema)
        if credentials.credit_used:
            await self.credit_service.consume_credit(
                user_id=owner_id,
                reason=CreditReason.AI_ANALYSIS,
                description=f"Análisis {payload.analysis_type.value} — proyecto {project.name}",
                related_analysis_id=analysis.id,
            )

        return analysis

    async def stream_analysis(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        payload: AiAnalysisCreate,
    ):
        if payload.analysis_type == AiAnalysisType.CUSTOM and not payload.custom_question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="custom_question es requerido para análisis de tipo CUSTOM.",
            )

        project = await self._get_owned_project(project_id=project_id, owner_id=owner_id)
        user = await self.user_repository.get_by_id(owner_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

        phase = self._get_project_phase(project.stage)

        credentials = await self.credit_service.resolve_llm_credentials(
            user=user,
            ai_key_id=payload.ai_key_id,
        )

        if phase == ProjectPhase.PLANNING:
            system_prompt = PLANNING_SYSTEM_PROMPT
            user_prompt = self._build_planning_prompt(project=project)
        else:
            system_prompt = IMPLEMENTED_SYSTEM_PROMPT
            context = await self.ai_context_service.build_context(
                project_id=project_id, owner_id=owner_id
            )
            user_prompt = self._build_implemented_prompt(
                analysis_type=payload.analysis_type,
                context=context,
                custom_question=payload.custom_question,
            )

        resolved_model, chunk_generator = await self.llm_client_service.stream_analysis(
            provider=credentials.provider,
            api_key=credentials.api_key,
            model_name=payload.model_name or credentials.model_name,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        async def event_generator():
            full_text = ""
            try:
                async for chunk in chunk_generator:
                    full_text += chunk
                    yield chunk
            except Exception as e:
                logger.error(f"Error in stream_analysis generation: {e}")
                yield f"\n[Error de generación: {str(e)}]"
                return
                
            # Guardar en DB con una sesión nueva para evitar 'Instance is not persistent'
            from app.db.session import AsyncSessionLocal
            from app.repositories.ai_analysis_repository import AiAnalysisRepository
            from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
            from app.repositories.saas_score_repository import SaasScoreRepository
            
            try:
                async with AsyncSessionLocal() as session:
                    ai_repo = AiAnalysisRepository(session)
                    metric_repo = MetricSnapshotRepository(session)
                    score_repo = SaasScoreRepository(session)
                    
                    latest_snapshot = await metric_repo.get_latest_by_project(saas_project_id=project_id)
                    latest_score = await score_repo.get_latest_by_project(saas_project_id=project_id)

                    output_json = None
                    if phase == ProjectPhase.PLANNING:
                        output_json = self._parse_planning_output(full_text)

                    analysis = await ai_repo.create(
                        data={
                            "saas_project_id": project_id,
                            "metric_snapshot_id": latest_snapshot.id if latest_snapshot else None,
                            "score_id": latest_score.id if latest_score else None,
                            "user_id": owner_id,
                            "provider": credentials.provider,
                            "model_name": resolved_model,
                            "analysis_type": payload.analysis_type,
                            "prompt_version": PROMPT_VERSION,
                            "input_context": {
                                "phase": phase.value,
                                "project_stage": project.stage.value,
                            } if phase == ProjectPhase.PLANNING else (context if phase == ProjectPhase.IMPLEMENTED else None),
                            "output_text": full_text,
                            "output_json": output_json,
                            "tokens_input": 0,
                            "tokens_output": 0,
                            "estimated_cost": Decimal("0"),
                        }
                    )
                    await session.commit()

                    if credentials.credit_used:
                        from app.services.credit_service import CreditService
                        from app.repositories.user_repository import UserRepository
                        from app.repositories.ai_key_repository import AiProviderKeyRepository
                        from app.repositories.system_ai_key_repository import SystemAiKeyRepository
                        from app.repositories.credit_transaction_repository import CreditTransactionRepository
                        
                        credit_svc = CreditService(
                            user_repository=UserRepository(session),
                            ai_key_repository=AiProviderKeyRepository(session),
                            system_ai_key_repository=SystemAiKeyRepository(session),
                            credit_transaction_repository=CreditTransactionRepository(session)
                        )
                        await credit_svc.consume_credit(
                            user_id=owner_id,
                            reason=CreditReason.AI_ANALYSIS,
                            description=f"Análisis {payload.analysis_type.value} — proyecto {project.name}",
                            related_analysis_id=analysis.id,
                        )
                        await session.commit()
            except Exception as db_e:
                logger.error(f"Error in stream_analysis DB commit: {db_e}")
                yield f"\n[Error interno guardando análisis: {str(db_e)}]"

        return event_generator()


    async def list_analyses(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        limit: int = 20,
        offset: int = 0,
        analysis_type: AiAnalysisType | None = None,
    ) -> AiAnalysisListResponse:
        await self._get_owned_project(project_id=project_id, owner_id=owner_id)
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

    async def get_analysis(
        self, *, project_id: UUID, analysis_id: UUID, owner_id: UUID
    ) -> AiAnalysis:
        await self._get_owned_project(project_id=project_id, owner_id=owner_id)
        analysis = await self.ai_analysis_repository.get_by_id_for_project(
            analysis_id=analysis_id,
            saas_project_id=project_id,
        )
        if analysis is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Análisis de IA no encontrado.",
            )
        return analysis

    # -----------------------------------------------------------------------
    # Helpers privados
    # -----------------------------------------------------------------------

    async def _get_owned_project(self, *, project_id: UUID, owner_id: UUID):
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto SaaS no encontrado.",
            )
        return project

    def _get_project_phase(self, stage: SaasStage) -> ProjectPhase:
        """Determina la fase de evaluación basada en el stage del proyecto."""
        return ProjectPhase.PLANNING if stage in PLANNING_STAGES else ProjectPhase.IMPLEMENTED

    def _build_planning_prompt(self, *, project) -> str:
        """Construye el prompt para proyectos en fase PLANNING.

        Incluye todos los campos descriptivos del proyecto con su contexto
        y solicita el JSON estructurado con el sistema de pesos.
        """
        fields = {
            "Nombre del proyecto": project.name,
            "Descripción": project.description or "No provisto",
            "Problema principal que resuelve (PESO 30%)": project.main_problem or "No provisto",
            "Propuesta de valor (PESO 25%)": project.value_proposition or "No provisto",
            "Mercado objetivo (PESO 20%)": project.target_market or "No provisto",
            "Audiencia objetivo": project.target_audience or "No provisto",
            "País/región de enfoque": project.country_focus or "No provisto",
            "Modelo de negocio (PESO 15%)": project.business_model.value if project.business_model else "No provisto",
            "Categoría": project.category.value if project.category else "No provisto",
            "Precio actual propuesto (PESO 10%)": str(project.current_price) + f" {project.currency}" if project.current_price else "No provisto",
            "Notas sobre pricing": project.pricing_notes or "No provisto",
            "Etapa actual": project.stage.value,
        }

        fields_text = "\n".join(f"  {k}: {v}" for k, v in fields.items())

        return (
            f"Analiza este proyecto SaaS estudiantil. Escribe tu análisis en Markdown y al final incluye obligatoriamente un bloque ```json con este esquema.\n"
            f"REGLA OBLIGATORIA: NO escribas NINGUNA frase como 'Aquí tienes la respuesta en json:'. Simplemente termina tu análisis e INMEDIATAMENTE abre el bloque ```json.\n\n"
            f"{PLANNING_JSON_SCHEMA}\n\n"
            f"Reglas del veredicto para el JSON:\n"
            f"  - overall_score >= 70 → verdict: 'CONSTRUYE'\n"
            f"  - overall_score 50-69 → verdict: 'VALIDA_PRIMERO'\n"
            f"  - overall_score < 50 → verdict: 'REPLANTEA'\n\n"
            f"Datos del proyecto:\n{fields_text}\n\n"
            f"IMPORTANTE: Si algún campo dice 'No provisto', asigna un puntaje bajo (< 40) a esa dimensión en el JSON."
        )

    def _build_implemented_prompt(
        self,
        *,
        analysis_type: AiAnalysisType,
        context: dict,
        custom_question: str | None,
    ) -> str:
        """Construye el prompt para proyectos en fase IMPLEMENTED."""
        if analysis_type == AiAnalysisType.CUSTOM:
            instruction = f"Responde esta pregunta sobre el SaaS: {custom_question}"
        else:
            instruction = ANALYSIS_INSTRUCTIONS.get(
                analysis_type,
                ANALYSIS_INSTRUCTIONS[AiAnalysisType.FULL_DIAGNOSIS],
            )
        return (
            f"Tipo de análisis: {analysis_type.value}\n"
            f"Instrucciones: {instruction}\n\n"
            "Contexto del proyecto (JSON):\n"
            f"{json.dumps(context, ensure_ascii=False, indent=2)}"
        )

    def _parse_planning_output(self, output_text: str) -> dict | None:
        """Parsea el JSON estructurado de la respuesta del LLM para PLANNING.

        Intenta extraer el JSON incluso si el LLM añadió texto extra.
        Normaliza los valores de verdict e infrastructure_complexity.
        """
        text = output_text.strip()

        # Intentar extraer JSON de bloques de código markdown
        if "```json" in text:
            try:
                text = text.split("```json")[1].split("```")[0].strip()
            except IndexError:
                pass
        elif "```" in text:
            try:
                text = text.split("```")[1].split("```")[0].strip()
            except IndexError:
                pass

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Intentar encontrar el primer { ... } en el texto
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    data = json.loads(text[start:end])
                except json.JSONDecodeError:
                    logger.warning("No se pudo parsear el JSON de planning: %s", text[:200])
                    return None
            else:
                return None

        # Normalizar verdict (acepta español e inglés)
        if "verdict" in data:
            data["verdict"] = VERDICT_MAP.get(str(data["verdict"]).upper(), "VALIDATE_FIRST")

        # Normalizar infrastructure_complexity
        if "infrastructure_complexity" in data:
            data["infrastructure_complexity"] = COMPLEXITY_MAP.get(
                str(data["infrastructure_complexity"]).upper(), "MEDIUM"
            )

        # Calcular overall_score si no viene o está fuera de rango
        if "overall_score" not in data or not (0 <= data.get("overall_score", -1) <= 100):
            scores = [
                data.get("problem_clarity_score", 0) * 0.30,
                data.get("value_prop_score", 0) * 0.25,
                data.get("market_fit_score", 0) * 0.20,
                data.get("business_model_score", 0) * 0.15,
                data.get("pricing_feasibility_score", 0) * 0.10,
            ]
            data["overall_score"] = round(sum(scores))

        return data

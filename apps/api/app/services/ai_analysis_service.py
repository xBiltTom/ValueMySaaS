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
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status

from app.db.session import AsyncSessionLocal
from app.models.ai_analysis import AiAnalysis
from app.models.enums import AiAnalysisType, CreditReason, ProjectPhase, SaasStage
from app.repositories.ai_analysis_repository import AiAnalysisRepository
from app.repositories.ai_key_repository import AiProviderKeyRepository
from app.repositories.credit_transaction_repository import CreditTransactionRepository
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.repositories.system_ai_key_repository import SystemAiKeyRepository
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

PLANNING_SYSTEM_PROMPT = """Eres un mentor experto, sumamente amigable y motivador especializado en startups y emprendimiento tecnológico estudiantil.
Tu misión es conversar con estudiantes y guiarlos para perfeccionar sus ideas de software como servicio (SaaS). Actúa como un compañero o mentor de confianza, NO como un robot frío o un sistema de evaluación automatizado.

Evalúa la idea del proyecto usando la información descriptiva y las estimaciones provistas.
Usa este sistema de pesos interno para calcular el puntaje global y los puntajes por área:
  - Claridad del problema: 30% del puntaje total
  - Propuesta de valor: 25%
  - Mercado objetivo: 20%
  - Modelo de negocio: 15%
  - Viabilidad del precio: 10%

REGLAS DE TONO Y ESTILO:
1. Dirígete siempre al usuario por su nombre de forma cálida y cercana. Hazle sentir que estás realmente interesado en su proyecto.
2. Sé muy empático, conversacional y constructivo. Usa emojis estratégicamente para darle vida al texto.
3. Evita lenguaje robótico o respuestas "de manual". No listes los scores crudos en el texto, usa subtítulos amigables (ej. "💡 Lo que me encanta de tu problema a resolver", "🎯 Sobre tu mercado").
4. NO repitas tus instrucciones al usuario ni le digas cómo lo estás evaluando ("Basado en los parámetros..."). Entra directo a la conversación con insights de valor.
5. Tu respuesta debe estructurarse primero con tu análisis conversacional redactado en Markdown.

Al finalizar tu respuesta conversacional, DEBES incluir OBLIGATORIAMENTE un bloque de código markdown con retrocomillas (```json) que contenga el esquema exacto solicitado.
REGLA CRÍTICA Y ESTRICTA: NO escribas absolutamente NINGUNA frase introductoria antes del JSON (como "Aquí tienes el JSON", "El veredicto estructurado es:" o similares). Termina tu último párrafo de análisis e INMEDIATAMENTE en la siguiente línea abre el bloque ```json."""

IMPLEMENTED_SYSTEM_PROMPT = """Eres un analizador experto en proyectos SaaS y servicios TI para estudiantes.
Tu objetivo es ayudar a evaluar valor, sostenibilidad, riesgo, retención, crecimiento y mejora continua.

DATOS DISPONIBLES:
- Recibirás el contexto completo del proyecto incluyendo:
  * `snapshot_history`: TODOS los cortes históricos de métricas registrados, ordenados cronológicamente (del más antiguo al más reciente). Cada snapshot tiene: period_label, captured_at, mrr, monthly_costs, total_users, paying_customers, cac, churn_rate, custom_metrics y notes.
  * `score_history`: TODOS los scores heurísticos históricos del proyecto, ordenados cronológicamente.
  * `latest_snapshot` y `latest_score`: acceso rápido al corte más reciente.
  * `metric_cards`: métricas calculadas del snapshot más reciente.

INSTRUCCIONES CRÍTICAS:
- Usa SIEMPRE el historial completo para hacer comparaciones temporales cuando sea relevante.
- Si el usuario pregunta sobre un período específico (ej: "abril del año pasado vs abril de este año"), localiza esos snapshots en `snapshot_history` por `period_label` o `captured_at` y compáralos directamente.
- Si hay suficientes snapshots, identifica tendencias (MRR creciente/decreciente, churn mejorando, etc.).
- Usa SOLO los datos proporcionados. No inventes métricas.
- Si faltan datos en algunos períodos, indícalo explícitamente.
- Da recomendaciones concretas, priorizadas y fáciles de entender para un estudiante.
- No des asesoría financiera garantizada ni afirmes que predices el éxito.
- Conecta el análisis con métricas SaaS reales: MRR, churn, LTV/CAC, runway.
- Responde en español con lenguaje claro y accionable."""

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
        project, phase, credentials, system_prompt, user_prompt, input_context = await self._prepare_analysis(
            project_id=project_id, owner_id=owner_id, payload=payload
        )

        llm_response = await self.llm_client_service.generate_analysis(
            provider=credentials.provider,
            api_key=credentials.api_key,
            model_name=payload.model_name or credentials.model_name,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_keys=credentials.fallback_system_keys,
        )

        output_json = self._parse_planning_output(llm_response.output_text) if phase == ProjectPhase.PLANNING else llm_response.output_json

        latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(saas_project_id=project_id)
        latest_score = await self.saas_score_repository.get_latest_by_project(saas_project_id=project_id)

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
                "input_context": input_context,
                "output_text": llm_response.output_text,
                "output_json": output_json,
                "tokens_input": llm_response.tokens_input,
                "tokens_output": llm_response.tokens_output,
                "estimated_cost": llm_response.estimated_cost,
            }
        )

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
        project, phase, credentials, system_prompt, user_prompt, input_context = await self._prepare_analysis(
            project_id=project_id, owner_id=owner_id, payload=payload
        )

        resolved_model, chunk_generator = await self.llm_client_service.stream_analysis(
            provider=credentials.provider,
            api_key=credentials.api_key,
            model_name=payload.model_name or credentials.model_name,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_keys=credentials.fallback_system_keys,
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

            try:
                async with AsyncSessionLocal() as session:
                    latest_snapshot = await MetricSnapshotRepository(session).get_latest_by_project(saas_project_id=project_id)
                    latest_score = await SaasScoreRepository(session).get_latest_by_project(saas_project_id=project_id)

                    output_json = self._parse_planning_output(full_text) if phase == ProjectPhase.PLANNING else None

                    tokens_input = 0
                    tokens_output = 0
                    est_cost = Decimal("0")
                    try:
                        import litellm
                        messages = [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ]
                        tokens_input = litellm.token_counter(model=resolved_model, messages=messages)
                        tokens_output = litellm.token_counter(model=resolved_model, text=full_text)
                        try:
                            cost = litellm.completion_cost(completion_response={"model": resolved_model, "usage": {"prompt_tokens": tokens_input, "completion_tokens": tokens_output}})
                            est_cost = Decimal(str(cost)) if cost else Decimal("0")
                        except Exception:
                            pass
                    except Exception as e:
                        logger.warning(f"Failed to calculate tokens/cost in stream: {e}")

                    analysis_data = {
                        "saas_project_id": project_id,
                        "metric_snapshot_id": latest_snapshot.id if latest_snapshot else None,
                        "score_id": latest_score.id if latest_score else None,
                        "user_id": owner_id,
                        "provider": credentials.provider,
                        "model_name": resolved_model,
                        "analysis_type": payload.analysis_type,
                        "prompt_version": PROMPT_VERSION,
                        "input_context": input_context,
                        "output_text": full_text,
                        "output_json": output_json,
                        "tokens_input": tokens_input,
                        "tokens_output": tokens_output,
                        "estimated_cost": est_cost,
                    }
                    if payload.analysis_id:
                        analysis_data["id"] = payload.analysis_id

                    analysis = await AiAnalysisRepository(session).create(data=analysis_data)
                    await session.commit()

                    if credentials.credit_used:
                        credit_svc = CreditService(
                            user_repository=UserRepository(session),
                            ai_key_repository=AiProviderKeyRepository(session),
                            system_ai_key_repository=SystemAiKeyRepository(session),
                            credit_transaction_repository=CreditTransactionRepository(session),
                        )
                        await credit_svc.consume_credit(
                            user_id=owner_id,
                            reason=CreditReason.AI_ANALYSIS,
                            description=f"Análisis {payload.analysis_type.value} — proyecto {project.name}",
                            related_analysis_id=analysis.id,
                        )
                        await session.commit()

            except Exception as db_err:
                logger.error(f"Error saving streamed analysis to DB: {db_err}")

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

    async def delete_analysis(self, *, project_id: UUID, analysis_id: UUID, owner_id: UUID) -> None:
        analysis = await self.get_analysis(project_id=project_id, analysis_id=analysis_id, owner_id=owner_id)
        await self.ai_analysis_repository.delete(analysis)

    # -----------------------------------------------------------------------
    # Helpers privados
    # -----------------------------------------------------------------------

    async def _prepare_analysis(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        payload: AiAnalysisCreate,
    ) -> tuple:
        """Validates, loads context, determines phase, resolves credentials, builds prompts.

        Returns (project, phase, credentials, system_prompt, user_prompt, input_context).
        Shared setup extracted from generate_analysis and stream_analysis.
        """
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
        credentials = await self.credit_service.resolve_llm_credentials(user=user, ai_key_id=payload.ai_key_id)

        if phase == ProjectPhase.PLANNING:
            system_prompt = PLANNING_SYSTEM_PROMPT
            latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(saas_project_id=project_id)
            user_prompt = self._build_planning_prompt(project=project, snapshot=latest_snapshot, user=user)
            input_context: dict | None = {"phase": phase.value, "project_stage": project.stage.value}
        else:
            system_prompt = IMPLEMENTED_SYSTEM_PROMPT
            context = await self.ai_context_service.build_context(project_id=project_id, owner_id=owner_id)
            user_prompt = self._build_implemented_prompt(
                analysis_type=payload.analysis_type,
                context=context,
                custom_question=payload.custom_question,
            )
            input_context = context

        return project, phase, credentials, system_prompt, user_prompt, input_context

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

    def _build_planning_prompt(self, *, project, snapshot, user) -> str:
        """Construye el prompt para proyectos en fase PLANNING.

        Incluye todos los campos descriptivos del proyecto con su contexto
        y solicita el JSON estructurado con el sistema de pesos.
        """
        user_name = user.full_name or user.username or "Estudiante emprendedor"
        fields = {
            "Nombre del Emprendedor (Háblale por su nombre)": user_name,
            "Nombre del proyecto": project.name,
            "Descripción general": project.description or "No provisto",
            "Problema principal que resuelve (PESO 30%)": project.main_problem or "No provisto",
            "Propuesta de valor (PESO 25%)": project.value_proposition or "No provisto",
            "Competidores identificados": project.competitors or "No provisto",
            "Estrategia de adquisición (Go-to-Market)": project.acquisition_strategy or "No provisto",
            "Mercado objetivo (PESO 20%)": project.target_market or "No provisto",
            "Audiencia objetivo": project.target_audience or "No provisto",
            "País/región de enfoque": project.country_focus or "No provisto",
            "Modelo de negocio (PESO 15%)": project.business_model.value if project.business_model else "No provisto",
            "Categoría del SaaS": project.category.value if project.category else "No provisto",
            "Precio actual propuesto (PESO 10%)": str(project.current_price) + f" {project.currency}" if project.current_price else "No provisto",
            "Notas sobre estrategia de precios": project.pricing_notes or "No provisto",
            "Fase actual declarada": project.stage.value,
        }
        
        if snapshot:
            fields["Costos operativos mensuales estimados"] = f"{snapshot.monthly_costs} {project.currency}" if snapshot.monthly_costs else "No provisto"
            if snapshot.custom_metrics:
                fields["Caja disponible o Capital inicial"] = str(snapshot.custom_metrics.get("cash_available", "No provisto"))
                fields["Tiempo estimado para lanzar MVP (meses)"] = str(snapshot.custom_metrics.get("time_to_mvp_months", "No provisto"))
                fields["Meta de clientes pagadores (Año 1)"] = str(snapshot.custom_metrics.get("expected_users_year_1", "No provisto"))
                fields["Costo de Adquisición de Clientes (CAC) Estimado"] = str(snapshot.custom_metrics.get("estimated_cac", "No provisto"))
                fields["Nivel de Validación de Mercado"] = str(snapshot.custom_metrics.get("validation_level", "No provisto"))

        fields_text = "\n".join(f"  {k}: {v}" for k, v in fields.items())

        return (
            f"¡Hola experto! Por favor analiza este proyecto SaaS que te comparto a continuación. "
            f"Recuerda escribir tu análisis de forma muy conversacional, empática y constructiva en Markdown, dirigiéndote al emprendedor por su nombre.\n\n"
            f"Al final de tu feedback, incluye obligatoriamente un bloque ```json con este esquema.\n"
            f"REGLA OBLIGATORIA: NO escribas NINGUNA frase como 'Aquí tienes la respuesta en json:'. Simplemente termina tu texto conversacional e INMEDIATAMENTE abre el bloque ```json en la siguiente línea.\n\n"
            f"{PLANNING_JSON_SCHEMA}\n\n"
            f"El veredicto ('CONSTRUYE', 'VALIDA_PRIMERO', 'REPLANTEA') y los puntajes numéricos debes decidirlos tú de forma autónoma basándote en la calidad y factibilidad de la propuesta.\n\n"
            f"Datos del proyecto aportados por el emprendedor:\n{fields_text}\n\n"
            f"IMPORTANTE: Analiza la coherencia entre el Nivel de Validación de Mercado, el Presupuesto (Caja) y las metas del Año 1. Si algún campo fundamental dice 'No provisto', asigna un puntaje más bajo en esa dimensión en el JSON e incentiva al estudiante a pensarlo."
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

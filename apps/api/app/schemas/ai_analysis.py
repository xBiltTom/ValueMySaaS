"""Schemas para análisis de IA — soporta dos modos:
- PLANNING: Análisis cualitativo con veredicto y pesos.
- IMPLEMENTED: Análisis cuantitativo sobre métricas reales.
"""
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AiAnalysisType, AiProvider, IdeaVerdict, InfrastructureComplexity, ProjectPhase


# ---------------------------------------------------------------------------
# Request / Create
# ---------------------------------------------------------------------------

class AiAnalysisCreate(BaseModel):
    """Payload para solicitar un análisis de IA.

    ai_key_id es opcional:
    - Si se provee → BYOK (sin créditos)
    - Si es None → usa créditos del sistema
    """
    ai_key_id: UUID | None = Field(
        default=None,
        description="ID de tu API Key propia. Si no se provee, se usarán créditos del sistema.",
    )
    analysis_type: AiAnalysisType
    model_name: str | None = Field(
        default=None,
        max_length=100,
        description="Modelo a usar (ej: gpt-4o-mini). Solo aplica con BYOK.",
    )
    custom_question: str | None = Field(default=None, max_length=2000)
    prompt: str | None = Field(default=None, description="Ignorado, pero requerido por Vercel AI SDK")
    analysis_id: UUID | None = Field(default=None, description="ID pre-generado por el frontend para el análisis")


# ---------------------------------------------------------------------------
# Output estructurado para proyectos en fase PLANNING
# ---------------------------------------------------------------------------

class PlanningAnalysisOutput(BaseModel):
    """Salida estructurada del LLM para proyectos en fase de planificación.

    El LLM evalúa los campos descriptivos del proyecto usando un sistema
    de pesos diseñado para estudiantes de ingeniería.
    """
    # Puntajes individuales (0-100) por dimensión
    problem_clarity_score: int = Field(
        ge=0, le=100,
        description="Qué tan claro y relevante es el problema que resuelve el proyecto. Peso: 30%"
    )
    value_prop_score: int = Field(
        ge=0, le=100,
        description="Qué tan diferenciada y convincente es la propuesta de valor. Peso: 25%"
    )
    market_fit_score: int = Field(
        ge=0, le=100,
        description="Qué tan bien definido está el mercado objetivo. Peso: 20%"
    )
    business_model_score: int = Field(
        ge=0, le=100,
        description="Qué tan viable y coherente es el modelo de negocio. Peso: 15%"
    )
    pricing_feasibility_score: int = Field(
        ge=0, le=100,
        description="Qué tan realista es el precio propuesto para el mercado. Peso: 10%"
    )

    # Puntaje global calculado con pesos
    overall_score: int = Field(ge=0, le=100)

    # Estimaciones cualitativas
    market_size_estimate: str = Field(
        description="Estimación aterrizada del tamaño de mercado local/regional en términos concretos."
    )
    infrastructure_complexity: InfrastructureComplexity = Field(
        description="Complejidad técnica estimada para construir el MVP."
    )
    breakeven_customers: str = Field(
        description="Estimación hipotética de cuántos clientes se necesitarían para el punto de equilibrio."
    )

    # Veredicto final
    verdict: str = Field(
        description="Veredicto final resumido en una frase corta (max 6 palabras)."
    )
    verdict_rationale: str = Field(
        description="Justificación del veredicto en 2-3 oraciones claras para un estudiante."
    )

    # Fortalezas y riesgos
    strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)

    # Próximos pasos accionables
    next_steps: list[str] = Field(
        default_factory=list,
        description="Máximo 3 pasos concretos y accionables para el estudiante."
    )


# ---------------------------------------------------------------------------
# Read / Response
# ---------------------------------------------------------------------------

class AiAnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    saas_project_id: UUID
    metric_snapshot_id: UUID | None
    score_id: UUID | None
    user_id: UUID
    provider: AiProvider
    model_name: str | None
    analysis_type: AiAnalysisType
    prompt_version: str
    input_context: dict[str, Any] | None
    output_text: str
    output_json: dict[str, Any] | None
    tokens_input: int | None
    tokens_output: int | None
    estimated_cost: Decimal | None
    # Fase del proyecto en el momento del análisis
    project_phase: ProjectPhase | None = None
    # Output estructurado para proyectos en PLANNING (parseado desde output_json)
    planning_output: PlanningAnalysisOutput | None = None
    created_at: datetime


class AiAnalysisListItem(AiAnalysisRead):
    pass


class AiAnalysisListResponse(BaseModel):
    items: list[AiAnalysisListItem]
    total: int
    limit: int
    offset: int

"use client";

import Link from "next/link";
import { ArrowRight, Gauge, Sparkles, TerminalSquare, AlertTriangle, ShieldCheck, HelpCircle, BrainCircuit } from "lucide-react";
import { formatEnum } from "@/lib/utils";
import { MaybeNumber, PlanningAiOutput, ProjectDashboardResponse } from "@/types/api";
import { cn } from "@/lib/utils";
import { AiScoreBar } from "./project-kpi-cards";

function toPercent(value: MaybeNumber) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-1.5 align-top mt-[-1px]">
      <HelpCircle className="h-3 w-3 text-muted-foreground/50 hover:text-primary cursor-help inline transition-colors" />
      <span className="pointer-events-none absolute left-0 bottom-full mb-2 z-50 hidden w-56 rounded-[8px] border-2 border-border/60 bg-card p-3 text-[10px] font-mono uppercase text-muted-foreground shadow-[4px_4px_0_rgba(0,0,0,0.4)] group-hover:block whitespace-normal leading-relaxed before:content-[''] before:absolute before:-bottom-1.5 before:left-2 before:w-2.5 before:h-2.5 before:bg-card before:border-b-2 before:border-r-2 before:border-border/60 before:rotate-45">
        <span className="text-primary mr-1">&gt;</span>{text}
      </span>
    </span>
  );
}

function DigitalMeter({ score, color }: { score: number; color: string }) {
  const percent = Math.round(score);
  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className="text-[10px] font-mono tracking-widest text-muted-foreground mb-1 uppercase">Sys_Score</div>
      <div className="text-6xl font-black font-mono tracking-tighter" style={{ color }}>
        {percent}
      </div>
      <div className="flex gap-1 mt-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div 
            key={i} 
            className="w-1.5 h-4 transition-all duration-500" 
            style={{ 
              backgroundColor: i * 10 < percent ? color : 'rgba(255,255,255,0.05)',
              boxShadow: i * 10 < percent ? `0 0 10px ${color}` : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ProjectScoreCard({
  projectId,
  score,
  isPlanning = false,
  onAiAnalysis,
  planningAiOutput,
}: {
  projectId: string;
  score: ProjectDashboardResponse["latest_score"];
  isPlanning?: boolean;
  onAiAnalysis?: () => void;
  planningAiOutput?: PlanningAiOutput | null;
}) {
  // Planning mode with AI output: show AI overall score
  if (isPlanning && planningAiOutput) {
    const aiScore = planningAiOutput.overall_score;
    const colorHex = aiScore >= 75 ? "#F59E0B" : aiScore >= 50 ? "#D97706" : "#EF4444";
    return (
      <div className="relative overflow-visible rounded-[24px] border border-amber-500/30 bg-card/40 backdrop-blur-xl p-6 shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-[24px] overflow-hidden" />
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-amber-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center overflow-visible">
              SYS_AI_VIABILITY
              <Tooltip text="Score de viabilidad generado por IA. Evalúa mercado, propuesta de valor y modelo de negocio con pesos ponderados." />
            </p>
          </div>
          <a
            href={`/projects/${projectId}/ai-analysis/${planningAiOutput.analysis_id}`}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-background/50 border border-border/40 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-400 transition-all"
            title="Ver análisis completo"
          >
            <TerminalSquare className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 mb-6">
          <DigitalMeter score={aiScore} color={colorHex} />
          <div className="min-w-0 flex-1 space-y-4 w-full">
            <div className="rounded-[12px] bg-background/50 border border-border/40 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">VEREDICTO</p>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider flex items-center gap-2",
                aiScore >= 75 ? "text-emerald-400" :
                aiScore >= 50 ? "text-amber-400" : "text-destructive"
              )}>
                {planningAiOutput.verdict}
              </span>
            </div>
            {onAiAnalysis && (
              <button
                onClick={onAiAnalysis}
                className="w-full flex items-center justify-center gap-2 rounded-[12px] bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <BrainCircuit className="h-3.5 w-3.5" /> Nuevo Análisis
              </button>
            )}
          </div>
        </div>

        {/* 5 dimension bars */}
        <div className="relative z-10 space-y-3 pt-4 border-t border-amber-500/20">
          <AiScoreBar
            label="PROBLEMA"
            score={planningAiOutput.problem_clarity_score}
            weight="peso 30%"
            tooltip="Qué tan claro y relevante es el problema que resuelve el proyecto."
          />
          <AiScoreBar
            label="VALOR"
            score={planningAiOutput.value_prop_score}
            weight="peso 25%"
            tooltip="Qué tan diferenciada y convincente es la propuesta de valor."
          />
          <AiScoreBar
            label="MERCADO"
            score={planningAiOutput.market_fit_score}
            weight="peso 20%"
            tooltip="Qué tan bien definido está el mercado objetivo y su tamaño."
          />
          <AiScoreBar
            label="NEGOCIO"
            score={planningAiOutput.business_model_score}
            weight="peso 15%"
            tooltip="Qué tan viable y coherente es el modelo de negocio propuesto."
          />
          <AiScoreBar
            label="PRECIO"
            score={planningAiOutput.pricing_feasibility_score}
            weight="peso 10%"
            tooltip="Qué tan realista es el precio propuesto para el mercado objetivo."
          />
        </div>

        {/* Rationale & Info */}
        <div className="relative z-10 mt-6 space-y-4">
          {planningAiOutput.verdict_rationale && (
            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed border-t border-amber-500/20 pt-4">
              &gt; {planningAiOutput.verdict_rationale}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {planningAiOutput.market_size_estimate && (
              <div className="rounded-[10px] bg-background/50 border border-border/40 px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Tamaño de mercado</p>
                <p className="text-[11px] font-mono text-foreground leading-snug">{planningAiOutput.market_size_estimate}</p>
              </div>
            )}
            {planningAiOutput.breakeven_customers && (
              <div className="rounded-[10px] bg-background/50 border border-border/40 px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Clientes para break-even</p>
                <p className="text-[11px] font-mono text-foreground leading-snug">{planningAiOutput.breakeven_customers}</p>
              </div>
            )}
          </div>

          {planningAiOutput.infrastructure_complexity && (
            <div className="flex items-center gap-2 pt-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Complejidad técnica:</p>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[4px]",
                planningAiOutput.infrastructure_complexity === "LOW" ? "bg-emerald-500/20 text-emerald-400" :
                planningAiOutput.infrastructure_complexity === "MEDIUM" ? "bg-amber-500/20 text-amber-400" :
                "bg-destructive/20 text-destructive"
              )}>
                {planningAiOutput.infrastructure_complexity}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className={cn(
        "rounded-[24px] border p-8 flex flex-col items-center justify-center text-center gap-5 min-h-[200px] relative overflow-hidden",
        isPlanning
          ? "border-status-warning-fg/30 bg-status-warning-bg/10"
          : "border-primary/30 bg-primary/5"
      )}>
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        <div className={cn("rounded-[16px] p-4 relative z-10 border shadow-inner", isPlanning ? "bg-status-warning-bg border-status-warning-fg/20" : "bg-card border-primary/20")}>
          <Gauge className={cn("h-8 w-8", isPlanning ? "text-status-warning-fg" : "text-primary")} />
        </div>
        <div className="relative z-10">
          <h2 className="text-lg font-black uppercase tracking-wider font-mono">Status: Sin Diagnóstico</h2>
          <p className="text-[11px] font-mono text-muted-foreground mt-2 max-w-[250px] leading-relaxed">
            {isPlanning
              ? "> Requiere escaneo inicial. Inicializa IA para evaluar viabilidad."
              : "> Registros insuficientes. Inyecta métricas para compilar score heurístico."}
          </p>
        </div>
        {isPlanning && onAiAnalysis ? (
          <button
            onClick={onAiAnalysis}
            className="relative z-10 flex items-center gap-2 rounded-[12px] bg-accent px-5 py-3 text-[11px] font-black uppercase tracking-widest text-accent-foreground hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--accent),0.2)]"
          >
            <TerminalSquare className="h-4 w-4" />
            Exec_Scanner
            <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-70" />
          </button>
        ) : (
          <Link
            href={isPlanning ? `/projects/${projectId}/ai-analysis` : `/projects/${projectId}/score`}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-[12px] px-5 py-3 text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all",
              isPlanning ? "bg-status-warning-fg text-background shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.2)]"
            )}
          >
            {isPlanning ? <Sparkles className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
            {isPlanning ? "Exec_Scanner" : "Compilar Score"}
            <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-70" />
          </Link>
        )}
      </div>
    );
  }

  const percent = toPercent(score.overall_score);
  const level = formatEnum(score.sustainability_level);
  const rec = formatEnum(score.decision_recommendation);

  const isGood = percent >= 75;
  const isWarn = percent >= 50 && percent < 75;
  const isDanger = percent < 50;

  const colorHex = isGood ? "#22C55E" : isWarn ? "#F59E0B" : "#EF4444";
  const statusColor = isGood ? "text-emerald-500" : isWarn ? "text-amber-500" : "text-destructive";

  return (
    <div className={cn(
      "relative overflow-visible rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 shadow-sm",
    )}>
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-[24px] overflow-hidden" />

      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className={cn("h-4 w-4", isPlanning ? "text-status-warning-fg" : "text-primary")} />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center overflow-visible">
            {isPlanning ? "SYS_VIABILITY" : "SYS_HEURISTIC"}
            <Tooltip text={isPlanning ? "Diagnóstico de IA basado en la propuesta de valor y modelo, sin usar datos transaccionales." : "Diagnóstico basado en algoritmos usando tus métricas reales y benchmarks de la industria."} />
          </p>
        </div>
        <Link
          href={`/projects/${projectId}/score`}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-background/50 border border-border/40 text-muted-foreground hover:bg-card hover:text-primary transition-all"
          title="Ver Log Completo"
        >
          <TerminalSquare className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 mb-6">
        <DigitalMeter score={percent} color={colorHex} />
        
        <div className="min-w-0 flex-1 space-y-4 w-full">
          <div className="rounded-[12px] bg-background/50 border border-border/40 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center overflow-visible">
              RATING
              <Tooltip text="Nivel de sostenibilidad y salud del proyecto según sus resultados." />
            </p>
            <div className="flex items-center gap-2">
              {isGood ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className={cn("h-4 w-4", statusColor)} />}
              <span className={cn("text-xs font-bold uppercase tracking-wider", statusColor)}>
                {level}
              </span>
            </div>
          </div>
          
          <div className="rounded-[12px] bg-background/50 border border-border/40 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center overflow-visible">
              OUTPUT
              <Tooltip text="Decisión recomendada por el sistema según el análisis global." />
            </p>
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">{rec}</p>
          </div>
        </div>
      </div>

      {/* Quick sub-score bars - Terminal style */}
      <div className="relative z-10 space-y-3 pt-4 border-t border-border/40">
        {[
          { label: "FIN_METRICS", value: score.financial_score, tooltip: "Puntuación de finanzas y rentabilidad (MRR, Costos, Burn rate)." },
          { label: "GRW_METRICS", value: score.growth_score, tooltip: "Puntuación de adquisición y crecimiento de base de usuarios." },
          { label: "RET_METRICS", value: score.retention_score, tooltip: "Puntuación de fidelidad y prevención de abandono (Churn)." },
        ].map(({ label, value, tooltip }) => {
          const v = toPercent(value);
          const barColor = v >= 75 ? "bg-emerald-500" : v >= 50 ? "bg-amber-500" : "bg-destructive";
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-muted-foreground w-[95px] shrink-0 uppercase flex items-center overflow-visible">
                {label}
                <Tooltip text={tooltip} />
              </span>
              <div className="flex-1 flex gap-0.5 h-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex-1 transition-all duration-500",
                      i * 5 < v ? barColor : "bg-muted",
                      i * 5 < v ? "opacity-100" : "opacity-30"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono font-bold text-foreground w-[28px] text-right">{Math.round(v)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

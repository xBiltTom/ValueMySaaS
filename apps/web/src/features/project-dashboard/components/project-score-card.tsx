"use client";

import Link from "next/link";
import { ArrowRight, Gauge, Lightbulb, Sparkles } from "lucide-react";
import { formatEnum } from "@/lib/utils";
import { MaybeNumber, ProjectDashboardResponse } from "@/types/api";
import { cn } from "@/lib/utils";

function toPercent(value: MaybeNumber) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function ScoreGauge({ score, isPlanning }: { score: number; isPlanning: boolean }) {
  const percent = toPercent(score);
  const color = percent >= 75 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444";
  const trackColor = percent >= 75 ? "rgba(16,185,129,0.15)" : percent >= 50 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)";

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke={trackColor} strokeWidth="10" />
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${percent * 2.51} 251`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span className="text-3xl font-display font-black" style={{ color }}>{Math.round(percent)}</span>
        <span className="text-xs font-semibold text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

export function ProjectScoreCard({
  projectId,
  score,
  isPlanning = false,
  onAiAnalysis,
}: {
  projectId: string;
  score: ProjectDashboardResponse["latest_score"];
  isPlanning?: boolean;
  onAiAnalysis?: () => void;
}) {
  if (!score) {
    return (
      <div className={cn(
        "rounded-3xl border p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]",
        isPlanning
          ? "border-dashed border-amber-300/70 bg-amber-50/50"
          : "border-dashed border-primary/30 bg-primary/5"
      )}>
        <div className={cn("rounded-2xl p-4", isPlanning ? "bg-amber-100" : "bg-primary/10")}>
          <Gauge className={cn("h-8 w-8", isPlanning ? "text-amber-600" : "text-primary")} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Sin diagnóstico aún</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
            {isPlanning
              ? "Genera un análisis IA para evaluar la viabilidad de tu idea."
              : "Registra métricas y genera un score explicable de tu SaaS."}
          </p>
        </div>
        {isPlanning && onAiAnalysis ? (
          <button
            onClick={onAiAnalysis}
            className="flex items-center gap-2 rounded-xl bg-white border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Analizar con IA
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
          </button>
        ) : (
          <Link
            href={isPlanning ? `/projects/${projectId}/ai-analysis` : `/projects/${projectId}/score`}
            className="flex items-center gap-2 rounded-xl bg-white border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
          >
            {isPlanning ? <Sparkles className="h-4 w-4 text-amber-500" /> : <Gauge className="h-4 w-4 text-primary" />}
            {isPlanning ? "Analizar con IA" : "Generar score"}
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
          </Link>
        )}
      </div>
    );
  }

  const percent = toPercent(score.overall_score);
  const level = formatEnum(score.sustainability_level);
  const rec = formatEnum(score.decision_recommendation);

  const levelColor = percent >= 75 ? "text-emerald-700 bg-emerald-100" : percent >= 50 ? "text-amber-700 bg-amber-100" : "text-red-700 bg-red-100";

  return (
    <div className={cn(
      "rounded-3xl border p-6 space-y-4",
      isPlanning
        ? "border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white"
        : "border-primary/15 bg-gradient-to-b from-primary/5 to-white"
    )}>
      <div className="flex items-center gap-2">
        <Gauge className={cn("h-4 w-4", isPlanning ? "text-amber-600" : "text-primary")} />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {isPlanning ? "Score de Viabilidad" : "Score Heurístico"}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <ScoreGauge score={percent} isPlanning={isPlanning} />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", levelColor)}>
              {level}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Recomendación</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{rec}</p>
          </div>
          <Link
            href={`/projects/${projectId}/score`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            Ver diagnóstico completo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Quick sub-score bars */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        {[
          { label: "Finanzas", value: score.financial_score },
          { label: "Crecimiento", value: score.growth_score },
          { label: "Retención", value: score.retention_score },
        ].map(({ label, value }) => {
          const v = toPercent(value);
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-700"
                  style={{ width: `${v}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-foreground w-6 text-right">{Math.round(v)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { AlertTriangle, TrendingUp, TrendingDown, Cpu, Info, Zap, Minus } from "lucide-react";
import { formatEnum } from "@/lib/utils";
import { MetricCalculationResponse } from "@/features/metrics/types";
import { cn } from "@/lib/utils";

// ─── Dictionary ───────────────────────────────────────────────────────────────

const metricDictionary: Record<string, {
  label: string;
  tooltip: string;
  short: string;
  unit?: "money" | "pct" | "ratio" | "count" | "months";
  good?: "high" | "low";
  thresholds?: { warn: number; danger: number };
}> = {
  net_profit: {
    label: "Utilidad Neta",
    tooltip: "Ingresos recurrentes menos costos operativos",
    short: "NET_PROFIT",
    unit: "money",
    good: "high",
  },
  arr: {
    label: "Ingresos Anuales",
    tooltip: "Proyección anual del MRR × 12",
    short: "ARR",
    unit: "money",
    good: "high",
  },
  arpu: {
    label: "Ingreso por Usuario",
    tooltip: "MRR dividido entre clientes pagadores (ARPU)",
    short: "ARPU",
    unit: "money",
    good: "high",
  },
  ltv: {
    label: "Valor de Vida del Cliente",
    tooltip: "ARPU ÷ Churn Rate — cuánto genera un cliente en promedio",
    short: "LTV",
    unit: "money",
    good: "high",
  },
  conversion_rate: {
    label: "Tasa de Conversión",
    tooltip: "% de usuarios registrados que terminan pagando",
    short: "CONV_RATE",
    unit: "pct",
    good: "high",
    thresholds: { warn: 0.03, danger: 0.01 },
  },
  churn_rate: {
    label: "Tasa de Abandono",
    tooltip: "% de clientes que cancelan cada mes (< 5% es saludable)",
    short: "CHURN",
    unit: "pct",
    good: "low",
    thresholds: { warn: 0.05, danger: 0.10 },
  },
  mrr_growth_rate: {
    label: "Crecimiento MRR",
    tooltip: "Crecimiento del MRR respecto al mes anterior (> 10% = bueno)",
    short: "MRR_GROWTH",
    unit: "pct",
    good: "high",
    thresholds: { warn: 0.05, danger: 0 },
  },
  ltv_cac_ratio: {
    label: "Ratio LTV/CAC",
    tooltip: "Por cada $1 en adquisición, cuánto genera el cliente. > 3 es saludable.",
    short: "LTV/CAC",
    unit: "ratio",
    good: "high",
    thresholds: { warn: 1, danger: 0.5 },
  },
  runway_months: {
    label: "Runway",
    tooltip: "Meses hasta quedar sin caja si los gastos no cambian",
    short: "RUNWAY",
    unit: "months",
    good: "high",
    thresholds: { warn: 6, danger: 3 },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(value: any, unit?: string, key?: string): string {
  if (value === null || value === undefined) return "N/A";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return String(value);

  if (unit === "pct") {
    // If value is already between 0 and 1 (ratio), multiply by 100
    const pct = Math.abs(num) <= 1 ? num * 100 : num;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  }
  if (unit === "ratio") return `${num.toFixed(2)}x`;
  if (unit === "money") {
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  }
  if (unit === "months") return `${num.toFixed(1)} mo.`;
  if (unit === "count") return num.toLocaleString();
  return String(value);
}

type HealthStatus = "good" | "warn" | "danger" | "neutral";

function getHealthStatus(
  value: any,
  good?: "high" | "low",
  thresholds?: { warn: number; danger: number }
): HealthStatus {
  if (!thresholds || value === null || value === undefined) return "neutral";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "neutral";

  // Normalize: if it looks like a ratio (0-1) and unit is pct
  const normalized = Math.abs(num) <= 1 ? num : num / 100;

  if (good === "high") {
    if (normalized >= thresholds.warn) return "good";
    if (normalized >= thresholds.danger) return "warn";
    return "danger";
  }
  if (good === "low") {
    if (normalized <= thresholds.warn) return "good";
    if (normalized <= thresholds.danger) return "warn";
    return "danger";
  }
  return "neutral";
}

const statusStyles: Record<HealthStatus, { border: string; value: string; badge: string; badgeBg: string }> = {
  good: {
    border: "border-emerald-500/30",
    value: "text-emerald-400",
    badge: "PASS",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  warn: {
    border: "border-amber-500/30",
    value: "text-amber-400",
    badge: "WARN",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  danger: {
    border: "border-red-500/30",
    value: "text-red-400",
    badge: "CRIT",
    badgeBg: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  neutral: {
    border: "border-border/40",
    value: "text-foreground",
    badge: "",
    badgeBg: "",
  },
};

function TrendIcon({ value, unit, good }: { value: any; unit?: string; good?: "high" | "low" }) {
  const num = parseFloat(String(value));
  if (isNaN(num)) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (num > 0) return good === "low"
    ? <TrendingUp className="h-3 w-3 text-red-400" />
    : <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (num < 0) return good === "low"
    ? <TrendingDown className="h-3 w-3 text-emerald-400" />
    : <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

const LAUNCHED_METRICS = [
  "net_profit",
  "mrr_growth_rate",
  "conversion_rate",
  "churn_rate",
  "ltv_cac_ratio",
  "arpu",
  "ltv",
  "arr",
  "runway_months",
];

const PLANNING_METRICS = ["runway_months", "net_profit"];

export function MetricCalculationPanel({
  calculation,
  projectStage = "LAUNCHED",
}: {
  calculation: MetricCalculationResponse;
  projectStage?: string;
}) {
  const isPlanning = projectStage === "PLANNING" || projectStage === "IDEA";
  const preferredKeys = isPlanning ? PLANNING_METRICS : LAUNCHED_METRICS;

  const metrics = preferredKeys
    .map((key) => [key, calculation.metrics[key]] as const)
    .filter(([, metric]) => metric && metric.source !== "missing" && metric.value !== null);

  const missingCount = preferredKeys.filter((key) => {
    const m = calculation.metrics[key];
    return !m || m.source === "missing" || m.value === null;
  }).length;

  const activeWarnings = calculation.warnings.filter(
    (w) => !w.includes("No hay snapshot anterior") // don't show this one as alarming
  );

  if (isPlanning && metrics.length === 0) {
    return (
      <div className="rounded-[12px] border-2 border-border/40 bg-card p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-foreground font-mono mb-1">
              DATA_REQUIRED
            </p>
            <p className="text-[10px] font-mono leading-relaxed text-muted-foreground uppercase">
              &gt; Registra caja disponible y gastos mensuales para ver la proyección de runway.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2 font-mono">
          <Cpu className="h-4 w-4" />
          SYS_INDICATORS_COMPUTED
        </h2>
        {missingCount > 0 && (
          <span className="text-[9px] font-black uppercase tracking-widest font-mono px-2 py-1 rounded-[4px] border-2 border-amber-500/30 bg-amber-500/5 text-amber-400">
            {missingCount} pendientes
          </span>
        )}
      </div>

      {/* Warnings block (only meaningful ones) */}
      {activeWarnings.length > 0 && (
        <div className="rounded-[8px] border-2 border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          {activeWarnings.map((warning) => (
            <p key={warning} className="flex gap-2 text-[10px] font-mono text-amber-400 uppercase leading-relaxed items-start">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      )}

      {/* MRR Growth special callout (if available) */}
      {!isPlanning && (() => {
        const growth = calculation.metrics["mrr_growth_rate"];
        if (!growth || growth.source === "missing" || growth.value === null) {
          return (
            <div className="rounded-[8px] border-2 border-border/40 bg-card/50 p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-muted-foreground uppercase leading-relaxed">
                <span className="font-black text-foreground">MRR Growth:</span> Registra al menos 2 snapshots consecutivos con MRR para calcular el crecimiento mes a mes.
              </p>
            </div>
          );
        }
        return null;
      })()}

      {/* Metrics grid */}
      {metrics.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([key, metric]) => {
            const dict = metricDictionary[key] ?? {
              label: formatEnum(key),
              tooltip: "",
              short: key.toUpperCase(),
            };
            const status = getHealthStatus(metric.value, dict.good, dict.thresholds);
            const s = statusStyles[status];
            const formattedValue = formatValue(metric.value, dict.unit, key);

            return (
              <div
                key={key}
                className={cn(
                  "group relative rounded-[10px] border-2 bg-card p-5 transition-all",
                  "hover:shadow-[4px_4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5",
                  s.border
                )}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary font-mono">
                      [{dict.short}]
                    </p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mt-0.5">
                      {dict.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {metric.source === "calculated" && (
                      <span title="Calculado automáticamente">
                        <Zap className="h-3 w-3 text-emerald-400" />
                      </span>
                    )}
                    {status !== "neutral" && (
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-[3px] border font-mono",
                        s.badgeBg
                      )}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <p className={cn(
                  "text-3xl font-mono font-black tracking-tighter leading-none mb-3",
                  s.value
                )}>
                  {formattedValue}
                </p>

                {/* Explanation */}
                {metric.explanation && (
                  <div className="border-t-2 border-dashed border-border/30 pt-3">
                    <p className="text-[9px] font-mono leading-relaxed text-muted-foreground uppercase flex gap-1.5 items-start">
                      <span className="text-primary shrink-0">&gt;</span>
                      {metric.formula
                        ? <span>{metric.formula}</span>
                        : <span>{metric.explanation}</span>}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[10px] border-2 border-border/40 bg-card p-6 text-center">
          <p className="text-[11px] font-mono uppercase text-muted-foreground">
            &gt; No hay indicadores calculados aún. Registra un snapshot con los datos financieros.
          </p>
        </div>
      )}

      {/* Source summary */}
      <div className="flex gap-4 text-[9px] font-mono uppercase text-muted-foreground border-t-2 border-border/40 pt-4">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
          {calculation.summary.provided_metrics_count} ingresados
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-2.5 w-2.5 text-emerald-400" />
          {calculation.summary.calculated_metrics_count} auto-calculados
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 inline-block" />
          {calculation.summary.missing_metrics_count} faltantes
        </span>
      </div>
    </div>
  );
}

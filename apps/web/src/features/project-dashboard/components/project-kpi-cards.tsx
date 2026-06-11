"use client";

import { Activity, Banknote, CircleDollarSign, Users, TrendingDown, Target } from "lucide-react";
import { MaybeNumber } from "@/types/api";
import { cn } from "@/lib/utils";

function display(value: MaybeNumber | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (isNaN(n)) return String(value);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return String(n % 1 !== 0 ? n.toFixed(2) : n);
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  isPlanning,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
  isPlanning?: boolean;
}) {
  const noData = value === "—";
  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
      isPlanning
        ? "border-status-warning-border/50 bg-card"
        : "border-border bg-card"
    )}>
      <div className={cn(
        "inline-flex rounded-xl p-2 mb-3",
        isPlanning ? "bg-status-warning-bg" : "bg-primary/10"
      )}>
        <Icon className={cn("h-4 w-4", isPlanning ? "text-status-warning-fg" : "text-primary")} />
      </div>
      <p className={cn(
        "text-xl font-display font-bold tracking-tight",
        noData ? "text-muted-foreground/40" : accent ?? "text-foreground"
      )}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
    </div>
  );
}

export function ProjectKpiCards({
  metrics,
  score,
  isPlanning = false,
}: {
  metrics: Record<string, MaybeNumber>;
  score?: MaybeNumber;
  isPlanning?: boolean;
}) {
  if (isPlanning) {
    // Planning mode: show minimal financial planning metrics
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
        <KpiCard icon={CircleDollarSign} label="Caja disponible" value={display(metrics.cash_available)} isPlanning accent="text-status-success-text" />
        <KpiCard icon={Banknote} label="Costos mensuales" value={display(metrics.monthly_costs)} isPlanning accent="text-status-danger-fg" />
        <KpiCard icon={Target} label="Score de viabilidad" value={score !== undefined && score !== null ? `${Number(score).toFixed(0)}/100` : "—"} isPlanning accent="text-status-warning-text" />
        <KpiCard icon={TrendingDown} label="Burn rate estimado" value={display(metrics.burn_rate)} isPlanning accent="text-status-danger-fg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <KpiCard icon={CircleDollarSign} label="MRR" value={display(metrics.mrr)} />
      <KpiCard icon={Banknote} label="Revenue mensual" value={display(metrics.monthly_revenue)} />
      <KpiCard icon={Users} label="Clientes pagos" value={display(metrics.paying_customers)} />
      <KpiCard icon={Activity} label="Usuarios activos" value={display(metrics.active_users)} />
      <KpiCard icon={TrendingDown} label="Churn rate" value={metrics.churn_rate !== null && metrics.churn_rate !== undefined ? `${Number(metrics.churn_rate).toFixed(1)}%` : "—"} accent="text-status-danger-fg" />
      <KpiCard icon={Target} label="Score general" value={score !== undefined && score !== null ? `${Number(score).toFixed(0)}/100` : "—"} accent="text-primary" />
    </div>
  );
}

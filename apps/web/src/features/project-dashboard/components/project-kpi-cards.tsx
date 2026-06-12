"use client";

import { Activity, Banknote, CircleDollarSign, Users, TrendingDown, Target, TerminalSquare } from "lucide-react";
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
      "group relative overflow-hidden rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md p-5 transition-all duration-300 hover:bg-card hover:border-primary/40 hover:-translate-y-1 shadow-sm",
    )}>
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
      
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground line-clamp-1">{label}</p>
          <Icon className={cn("h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity", accent || (isPlanning ? "text-status-warning-fg" : "text-primary"))} />
        </div>
        
        <div className="flex items-end gap-2">
          <p className={cn(
            "text-3xl font-mono font-bold tracking-tight leading-none",
            noData ? "text-muted-foreground/30" : accent ?? "text-foreground"
          )}>
            {noData ? "NULL" : value}
          </p>
        </div>
      </div>
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
        <KpiCard icon={CircleDollarSign} label="Caja disponible" value={display(metrics.cash_available)} isPlanning accent="text-status-success-fg" />
        <KpiCard icon={Banknote} label="Costos mensuales" value={display(metrics.monthly_costs)} isPlanning accent="text-destructive" />
        <KpiCard icon={Target} label="Score de viabilidad" value={score !== undefined && score !== null ? `${Number(score).toFixed(0)}/100` : "—"} isPlanning accent="text-status-warning-fg" />
        <KpiCard icon={TrendingDown} label="Burn rate estimado" value={display(metrics.burn_rate)} isPlanning accent="text-destructive" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <KpiCard icon={CircleDollarSign} label="MRR" value={display(metrics.mrr)} accent="text-emerald-500" />
      <KpiCard icon={Banknote} label="Revenue mensual" value={display(metrics.monthly_revenue)} />
      <KpiCard icon={Users} label="Clientes pagos" value={display(metrics.paying_customers)} />
      <KpiCard icon={Activity} label="Usuarios activos" value={display(metrics.active_users)} />
      <KpiCard icon={TrendingDown} label="Churn rate" value={metrics.churn_rate !== null && metrics.churn_rate !== undefined ? `${Number(metrics.churn_rate).toFixed(1)}%` : "—"} accent="text-destructive" />
      <KpiCard icon={TerminalSquare} label="Score general" value={score !== undefined && score !== null ? `${Number(score).toFixed(0)}/100` : "—"} accent="text-primary" />
    </div>
  );
}

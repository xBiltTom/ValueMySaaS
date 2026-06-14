"use client";

import { Activity, Banknote, CircleDollarSign, Users, TrendingDown, Target, TerminalSquare, HelpCircle } from "lucide-react";
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

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  isPlanning,
  tooltip,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
  isPlanning?: boolean;
  tooltip?: string;
}) {
  const noData = value === "—";
  return (
    <div className={cn(
      "group relative overflow-visible rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md p-5 transition-all duration-300 hover:bg-card hover:border-primary/40 hover:-translate-y-1 shadow-sm",
    )}>
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 rounded-[16px] overflow-hidden" />
      
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground line-clamp-1 flex items-center overflow-visible">
            {label}
            {tooltip && <Tooltip text={tooltip} />}
          </p>
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
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
        <KpiCard icon={CircleDollarSign} label="Caja disponible" value={display(metrics.cash_available)} isPlanning accent="text-status-success-fg" tooltip="Dinero en efectivo o runway actual del que dispones para mantener el proyecto operando." />
        <KpiCard icon={Banknote} label="Costos mensuales" value={display(metrics.monthly_costs)} isPlanning accent="text-destructive" tooltip="Estimación de los gastos operativos fijos y variables necesarios al mes." />
        <KpiCard icon={Target} label="Score de viabilidad" value={score !== undefined && score !== null ? `${Number(score).toFixed(0)}/100` : "—"} isPlanning accent="text-status-warning-fg" tooltip="Puntuación generada por la IA evaluando mercado, modelo de negocio y propuesta de valor." />
        <KpiCard icon={TrendingDown} label="Burn rate estimado" value={display(metrics.burn_rate)} isPlanning accent="text-destructive" tooltip="Velocidad a la que tu startup 'quema' o agota sus reservas de capital cada mes." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <KpiCard icon={CircleDollarSign} label="MRR" value={display(metrics.mrr)} accent="text-emerald-500" tooltip="Monthly Recurring Revenue. Ingresos recurrentes y predecibles normalizados a un mes." />
      <KpiCard icon={Banknote} label="Revenue mensual" value={display(metrics.monthly_revenue)} tooltip="Total de ingresos del mes, incluyendo ventas únicas, setup fees y suscripciones." />
      <KpiCard icon={Users} label="Clientes pagos" value={display(metrics.paying_customers)} tooltip="Total de usuarios distintos que tienen una suscripción activa o han realizado pagos." />
      <KpiCard icon={Activity} label="Usuarios activos" value={display(metrics.active_users)} tooltip="Número de usuarios únicos que interactúan con tu aplicación de manera frecuente." />
      <KpiCard icon={TrendingDown} label="Churn rate" value={metrics.churn_rate !== null && metrics.churn_rate !== undefined ? `${(Number(metrics.churn_rate) * 100).toFixed(1)}%` : "—"} accent="text-destructive" tooltip="Porcentaje de clientes o ingresos que se pierden o cancelan durante un periodo determinado." />
      <KpiCard icon={TerminalSquare} label="Score general" value={score !== undefined && score !== null ? `${Number(score).toFixed(0)}/100` : "—"} accent="text-primary" tooltip="Puntuación heurística de salud basada en métricas reales de crecimiento, retención y finanzas." />
    </div>
  );
}

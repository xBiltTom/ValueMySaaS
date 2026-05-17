import { Activity, Banknote, CircleDollarSign, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { MaybeNumber } from "@/types/api";

function display(value: MaybeNumber | undefined, fallback = "Sin dato") {
  return value ?? fallback;
}

export function ProjectKpiCards({ metrics, score }: { metrics: Record<string, MaybeNumber>; score?: MaybeNumber }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard icon={CircleDollarSign} label="MRR" value={display(metrics.mrr)} />
      <MetricCard icon={Banknote} label="Revenue mensual" value={display(metrics.monthly_revenue)} />
      <MetricCard icon={Users} label="Clientes pagos" value={display(metrics.paying_customers)} />
      <MetricCard icon={Activity} label="Usuarios activos" value={display(metrics.active_users)} />
      <MetricCard icon={Activity} label="Churn rate" value={display(metrics.churn_rate)} />
      <MetricCard icon={Activity} label="Score general" value={display(score)} />
    </div>
  );
}

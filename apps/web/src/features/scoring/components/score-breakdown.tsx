import { Activity, Banknote, Bug, RefreshCcw, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { SaasScore } from "@/features/scoring/types";

export function ScoreBreakdown({ score }: { score: SaasScore }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
      <MetricCard icon={Banknote} label="Financiero" value={score.financial_score ?? "N/A"} />
      <MetricCard icon={TrendingUp} label="Crecimiento" value={score.growth_score ?? "N/A"} />
      <MetricCard icon={RefreshCcw} label="Retención" value={score.retention_score ?? "N/A"} />
      <MetricCard icon={Activity} label="Producto" value={score.product_score ?? "N/A"} />
      <MetricCard icon={Bug} label="Riesgo" value={score.risk_score ?? "N/A"} />
    </div>
  );
}

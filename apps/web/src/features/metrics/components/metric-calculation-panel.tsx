import { AlertTriangle, TrendingUp, Cpu, Info } from "lucide-react";
import { formatEnum } from "@/lib/utils";
import { MetricCalculationResponse } from "@/features/metrics/types";

const metricDictionary: Record<string, { label: string; tooltip: string; short: string }> = {
  arr: { label: "Ingresos Anuales (ARR)", tooltip: "Proyección anual de tus ingresos mensuales", short: "ARR" },
  conversion_rate: { label: "Tasa de Conversión", tooltip: "% de usuarios gratis que terminan pagando", short: "CONV_RATE" },
  churn_rate: { label: "Tasa de Abandono (Churn)", tooltip: "% de clientes que cancelan cada mes", short: "CHURN" },
  retention_rate: { label: "Tasa de Retención", tooltip: "% de clientes que se quedan contigo", short: "RETENTION" },
  ltv_cac_ratio: { label: "Ratio LTV/CAC", tooltip: "Por cada $1 en marketing, cuánto ganas a futuro. (>3 es bueno)", short: "LTV/CAC" },
  runway_months: { label: "Tiempo de Vida (Runway)", tooltip: "Meses antes de quebrar si los gastos no cambian", short: "RUNWAY" },
  burn_rate: { label: "Gasto Mensual Neto (Burn Rate)", tooltip: "Dinero que 'quemas' o pierdes cada mes", short: "BURN_RATE" },
  gross_profit: { label: "Ganancia Bruta", tooltip: "Ingresos totales menos gastos operativos", short: "GROSS_PROFIT" },
};

export function MetricCalculationPanel({ calculation, projectStage = "LAUNCHED" }: { calculation: MetricCalculationResponse; projectStage?: string }) {
  const isPlanning = projectStage === "PLANNING" || projectStage === "IDEA";
  const preferredMetrics = isPlanning 
    ? ["runway_months", "burn_rate", "gross_profit"] 
    : ["arr", "conversion_rate", "churn_rate", "retention_rate", "ltv_cac_ratio", "runway_months"];

  const metrics = preferredMetrics
    .map((key) => [key, calculation.metrics[key]] as const)
    .filter(([, metric]) => Boolean(metric));

  if (isPlanning && metrics.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-border/40 bg-card/40 backdrop-blur-md p-6">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
        <div className="relative z-10 flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground mb-1">DATA_REQUIRED</h3>
            <p className="text-[11px] font-mono leading-relaxed text-muted-foreground uppercase">
              &gt; Aún no hay suficientes datos financieros registrados para proyectar tu runway (tiempo de vida). Registra tu caja y gastos para comenzar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[12px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
        <Cpu className="h-4 w-4" /> 
        SYS_INDICATORS_COMPUTED
      </h2>
      
      {calculation.warnings.length ? (
        <div className="relative overflow-hidden rounded-[16px] border border-status-danger-border/60 bg-status-danger-bg/20 p-5 shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.03)_25%,rgba(239,68,68,0.03)_50%,transparent_50%,transparent_75%,rgba(239,68,68,0.03)_75%,rgba(239,68,68,0.03)_100%)] bg-[length:20px_20px] pointer-events-none" />
          <div className="relative z-10 space-y-3">
            {calculation.warnings.map((warning) => (
              <p key={warning} className="flex gap-3 text-[11px] font-mono text-status-danger-text uppercase leading-relaxed items-start">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span><strong className="mr-1">WARN:</strong>{warning}</span>
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map(([key, metric]) => {
          const dictionaryData = metricDictionary[key] || { label: formatEnum(key), tooltip: "", short: key.toUpperCase() };
          return (
            <div key={key} className="group relative overflow-hidden rounded-[20px] border border-border/40 bg-card/40 backdrop-blur-md p-6 transition-all hover:bg-card hover:border-primary/40 shadow-sm flex flex-col justify-between">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
              <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary/30 rounded-tr-[20px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10 flex items-start justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-primary mb-1">
                    [ {dictionaryData.short} ]
                  </h3>
                  <p className="text-[11px] font-bold text-foreground uppercase">{dictionaryData.label}</p>
                </div>
              </div>
              
              <div className="relative z-10">
                <p className="text-5xl font-mono font-black text-foreground tracking-tighter drop-shadow-sm group-hover:text-primary transition-colors">
                  {metric.value ?? "N/A"}
                </p>
              </div>

              {metric.explanation && (
                <div className="relative z-10 mt-6 pt-4 border-t border-dashed border-border/40">
                  <p className="text-[10px] font-mono leading-relaxed text-muted-foreground uppercase">
                    <span className="text-primary mr-1">&gt;</span>{metric.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

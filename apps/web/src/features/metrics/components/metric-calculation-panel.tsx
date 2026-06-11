import { AlertTriangle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEnum } from "@/lib/utils";
import { MetricCalculationResponse } from "@/features/metrics/types";

const metricDictionary: Record<string, { label: string; tooltip: string }> = {
  arr: { label: "Ingresos Anuales (ARR)", tooltip: "Proyección anual de tus ingresos mensuales" },
  conversion_rate: { label: "Tasa de Conversión", tooltip: "% de usuarios gratis que terminan pagando" },
  churn_rate: { label: "Tasa de Abandono (Churn)", tooltip: "% de clientes que cancelan cada mes" },
  retention_rate: { label: "Tasa de Retención", tooltip: "% de clientes que se quedan contigo" },
  ltv_cac_ratio: { label: "Ratio LTV/CAC", tooltip: "Por cada $1 en marketing, cuánto ganas a futuro. (>3 es bueno)" },
  runway_months: { label: "Tiempo de Vida (Runway)", tooltip: "Meses antes de quebrar si los gastos no cambian" },
  burn_rate: { label: "Gasto Mensual Neto (Burn Rate)", tooltip: "Dinero que 'quemas' o pierdes cada mes" },
  gross_profit: { label: "Ganancia Bruta", tooltip: "Ingresos totales menos gastos operativos" },
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
      <Card className="border-none shadow-sm glass bg-primary/5">
        <CardContent className="p-6 text-center text-muted-foreground">
          Aún no hay suficientes datos financieros registrados para proyectar tu runway (tiempo de vida). Registra tu caja y gastos para comenzar.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" /> Indicadores Clave
      </h2>
      
      {calculation.warnings.length ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
          {calculation.warnings.map((warning) => (
            <p key={warning} className="flex gap-2 text-sm text-destructive font-medium items-start">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map(([key, metric]) => {
          const dictionaryData = metricDictionary[key] || { label: formatEnum(key), tooltip: "" };
          return (
            <div key={key} className="relative rounded-2xl border border-primary/10 bg-card/60 p-5 backdrop-blur-md transition-all hover:bg-card hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{dictionaryData.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[90%]">{dictionaryData.tooltip}</p>
                </div>
              </div>
              <p className="mt-4 text-4xl font-display font-bold text-primary tracking-tight">
                {metric.value ?? "N/A"}
              </p>
              {metric.explanation && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm leading-relaxed text-muted-foreground">{metric.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

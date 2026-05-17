import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEnum } from "@/lib/utils";
import { MetricCalculationResponse } from "@/features/metrics/types";

const preferredMetrics = ["arr", "conversion_rate", "churn_rate", "retention_rate", "ltv_cac_ratio", "runway_months"];

export function MetricCalculationPanel({ calculation }: { calculation: MetricCalculationResponse }) {
  const metrics = preferredMetrics
    .map((key) => [key, calculation.metrics[key]] as const)
    .filter(([, metric]) => Boolean(metric));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cálculos latest</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Badge>Provistas: {calculation.summary.provided_metrics_count}</Badge>
          <Badge>Calculadas: {calculation.summary.calculated_metrics_count}</Badge>
          <Badge>Faltantes: {calculation.summary.missing_metrics_count}</Badge>
        </div>
        {calculation.warnings.length ? (
          <div className="rounded-md border border-destructive/20 bg-white p-4">
            {calculation.warnings.map((warning) => (
              <p key={warning} className="flex gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {warning}
              </p>
            ))}
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {metrics.map(([key, metric]) => (
            <div key={key} className="rounded-md border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{formatEnum(key)}</h3>
                <Badge>{metric.source}</Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold">{metric.value ?? "N/A"}</p>
              {metric.formula ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{metric.formula}</p> : null}
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.explanation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { Calendar, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricSnapshotListResponse } from "@/features/metrics/types";

export function MetricSnapshotList({ snapshots }: { snapshots: MetricSnapshotListResponse }) {
  if (!snapshots.items.length) {
    return (
      <EmptyState
        icon={Database}
        title="Aun no hay snapshots."
        description="Registra el primer corte de metricas para activar calculos, graficas y diagnostico."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snapshots registrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshots.items.map((snapshot) => (
          <div key={snapshot.id} className="rounded-md border border-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{snapshot.period_label || "Sin periodo"}</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(snapshot.captured_at).toLocaleString("es-PE")}
                </p>
              </div>
              <Badge>{snapshot.mrr ? `MRR ${snapshot.mrr}` : "MRR sin dato"}</Badge>
            </div>
            {snapshot.notes ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{snapshot.notes}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

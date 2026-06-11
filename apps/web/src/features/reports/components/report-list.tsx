import Link from "next/link";
import { FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime, formatEnum } from "@/lib/formatters";
import { SaasReportListResponse } from "@/features/reports/types";
import { reportTypeLabel } from "@/features/reports/utils";

export function ReportList({ projectId, reports }: { projectId: string; reports: SaasReportListResponse }) {
  if (!reports.items.length) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Aún no hay reportes generados."
        description="Genera un reporte básico o ejecutivo para convertir el diagnóstico en evidencia."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes generados</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {reports.items.map((report) => (
          <Link key={report.id} href={`/projects/${projectId}/reports/${report.id}`} className="block">
            <article className="h-full rounded-md border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDateTime(report.generated_at || report.created_at)}
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary">{reportTypeLabel(report.report_type)}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{formatEnum(report.status)}</Badge>
                {report.metric_snapshot_id ? <Badge>Snapshot vinculado</Badge> : null}
                {report.score_id ? <Badge>Score vinculado</Badge> : null}
              </div>
            </article>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

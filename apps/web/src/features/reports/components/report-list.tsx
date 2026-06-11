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
    <section className="mt-8">
      <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
        <FileSearch className="h-6 w-6 text-primary" />
        Reportes Generados
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.items.map((report) => (
          <Link key={report.id} href={`/projects/${projectId}/reports/${report.id}`} className="block h-full">
            <article className="bento-card h-full flex flex-col justify-between p-6 cursor-pointer group">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <Badge className="bg-primary/10 text-primary uppercase text-[10px] tracking-widest font-bold">
                    {reportTypeLabel(report.report_type)}
                  </Badge>
                  <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <FileSearch className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {report.title}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {formatDateTime(report.generated_at || report.created_at)}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-background">
                  {formatEnum(report.status)}
                </Badge>
                {report.metric_snapshot_id ? <Badge variant="secondary" className="text-[10px] uppercase">Snapshot</Badge> : null}
                {report.score_id ? <Badge variant="secondary" className="text-[10px] uppercase">Score</Badge> : null}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}

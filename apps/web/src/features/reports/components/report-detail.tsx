import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatEnum } from "@/lib/formatters";
import { SaasReport } from "@/features/reports/types";
import { reportTypeLabel } from "@/features/reports/utils";
import { ReportViewer } from "@/features/reports/components/report-viewer";

export function ReportDetail({ report }: { report: SaasReport }) {
  return (
    <div className="space-y-6">
      <Card className="bento-card border-none bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground mb-3">
              <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
              Reporte
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{report.title}</h1>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Generado: {formatDateTime(report.generated_at || report.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary uppercase font-bold tracking-wider">{reportTypeLabel(report.report_type)}</Badge>
            <Badge variant="outline" className="uppercase font-bold tracking-wider">{formatEnum(report.status)}</Badge>
          </div>
        </div>
      </Card>
      
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-background to-background opacity-50"></div>
        <ReportViewer content={report.content} />
      </div>
    </div>
  );
}

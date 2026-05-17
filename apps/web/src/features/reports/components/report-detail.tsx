import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SaasReport } from "@/features/reports/types";
import { reportTypeLabel } from "@/features/reports/utils";
import { ReportJsonRenderer } from "@/features/reports/components/report-json-renderer";

export function ReportDetail({ report }: { report: SaasReport }) {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Reporte</p>
            <h1 className="mt-2 font-display text-4xl font-semibold">{report.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Generado: {new Date(report.generated_at || report.created_at).toLocaleString("es-PE")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary">{reportTypeLabel(report.report_type)}</Badge>
            <Badge>{report.status}</Badge>
          </div>
        </div>
      </Card>
      <ReportJsonRenderer content={report.content} />
    </div>
  );
}

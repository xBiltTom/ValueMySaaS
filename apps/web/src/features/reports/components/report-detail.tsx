import { formatDateTime, formatEnum } from "@/lib/formatters";
import { SaasReport } from "@/features/reports/types";
import { reportTypeLabel } from "@/features/reports/utils";
import { ReportViewer } from "@/features/reports/components/report-viewer";

export function ReportDetail({ report }: { report: SaasReport }) {
  return (
    <div className="space-y-8">
      {/* Brutalist Header Card */}
      <div className="relative overflow-hidden rounded-[20px] border border-border/40 bg-card/40 backdrop-blur-md p-6 shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
        <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary/30 rounded-tr-[20px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="inline-flex items-center gap-2 border border-border/40 bg-background/50 px-3 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-widest text-foreground mb-4">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              VISOR DE REPORTE
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight mb-2 text-foreground">
              {report.title}
            </h1>
            <p className="text-[11px] font-mono text-muted-foreground uppercase flex items-center gap-2">
              <span className="text-primary">&gt;</span> CREADO: {formatDateTime(report.generated_at || report.created_at)}
            </p>
          </div>
          
          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
            <span className="inline-block border border-primary/20 bg-primary/10 text-primary uppercase text-[10px] tracking-widest font-black px-3 py-1 rounded-[6px]">
              Reporte General
            </span>
            <span className="inline-block border border-border/40 bg-background/50 text-muted-foreground uppercase text-[10px] tracking-widest font-bold px-3 py-1 rounded-[6px]">
              ESTADO: {formatEnum(report.status)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Report Content */}
      <div className="relative mt-8">
        <ReportViewer content={report.content} />
      </div>
    </div>
  );
}

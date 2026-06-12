"use client";

import Link from "next/link";
import { FileSearch, TerminalSquare, ArrowRight, Trash2 } from "lucide-react";
import { formatDateTime, formatEnum } from "@/lib/formatters";
import { SaasReportListResponse } from "@/features/reports/types";
import { reportTypeLabel } from "@/features/reports/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteReport } from "@/features/reports/api";
import { toast } from "sonner";

export function ReportList({ projectId, reports }: { projectId: string; reports: SaasReportListResponse }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (reportId: string) => deleteReport(projectId, reportId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
      toast.success("Reporte eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar reporte");
    }
  });

  if (!reports.items.length) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-dashed border-border/60 bg-card/20 backdrop-blur-md p-8 text-center shadow-sm">
        <TerminalSquare className="mx-auto h-8 w-8 text-muted-foreground/30 mb-4" />
        <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground mb-2">Aún no hay reportes</h3>
        <p className="text-[11px] font-mono text-muted-foreground uppercase">
          &gt; Genera un nuevo reporte para obtener tu análisis.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
        <span className="h-1.5 w-1.5 bg-primary rounded-full"></span>
        TUS REPORTES
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.items.map((report, i) => (
          <div key={report.id} className="relative group h-full">
            <Link href={`/projects/${projectId}/reports/${report.id}`} className="block h-full">
              <article className="relative overflow-hidden rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md h-full flex flex-col justify-between p-5 transition-all hover:bg-card hover:border-primary/40 shadow-sm cursor-pointer">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3 mb-4 border-b border-dashed border-border/40 pb-4">
                    <span className="inline-block border border-primary/20 bg-primary/10 text-primary uppercase text-[9px] tracking-widest font-black px-2 py-0.5 rounded-[4px]">
                      Reporte General
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">ID_{i.toString().padStart(3, '0')}</span>
                  </div>
                  <h3 className="font-display text-lg font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">
                    &gt; {formatDateTime(report.generated_at || report.created_at)}
                  </p>
                </div>
                
                <div className="relative z-10 mt-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    LEER REPORTE <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </article>
            </Link>
            
            {/* Delete button (absolute positioned top right over the card) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm("¿Estás seguro de eliminar este reporte?")) {
                  deleteMutation.mutate(report.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-background/80 border border-border/40 text-muted-foreground hover:text-status-danger-fg hover:border-status-danger-border hover:bg-status-danger-bg/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 backdrop-blur-md"
              title="Eliminar reporte"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

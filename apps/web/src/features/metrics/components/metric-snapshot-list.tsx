import { Calendar, Database, TerminalSquare } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import { MetricSnapshotListResponse } from "@/features/metrics/types";

export function MetricSnapshotList({ snapshots }: { snapshots: MetricSnapshotListResponse }) {
  if (!snapshots.items.length) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-dashed border-border/60 bg-card/20 backdrop-blur-md p-8 text-center shadow-sm">
        <TerminalSquare className="mx-auto h-8 w-8 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-2">SYS_ERR: EMPTY_DATASET</h3>
        <p className="text-[11px] font-mono text-muted-foreground uppercase">
          &gt; Registra un corte de métricas para inicializar cálculos y el dashboard histórico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
        <span className="h-1.5 w-1.5 bg-primary rounded-full"></span>
        DATA_LOG_HISTORY
      </h3>
      <div className="space-y-3">
        {snapshots.items.map((snapshot, i) => (
          <div key={snapshot.id} className="group relative overflow-hidden rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md p-5 transition-all hover:bg-card hover:border-primary/40 shadow-sm">
            {/* Background scanline */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
            
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase border border-border/40 rounded-[4px] px-1.5 py-0.5 bg-background">IDX_{i.toString().padStart(2, '0')}</span>
                  <h3 className="font-bold text-[13px] uppercase tracking-wider text-foreground">{snapshot.period_label || "UNLABELED_PERIOD"}</h3>
                </div>
                <p className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-2 uppercase">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(snapshot.captured_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex items-center rounded-[6px] bg-primary/10 border border-primary/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  {snapshot.mrr ? `MRR_VAL: ${snapshot.mrr}` : "MRR_VAL: NULL"}
                </span>
                {snapshot.cash_available && (
                  <span className="inline-flex items-center rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    CASH: {snapshot.cash_available}
                  </span>
                )}
              </div>
            </div>
            {snapshot.notes ? (
              <div className="relative z-10 mt-4 border-t border-dashed border-border/40 pt-3">
                <p className="text-[11px] font-mono leading-relaxed text-muted-foreground uppercase">
                  <span className="text-primary mr-2">&gt;</span>{snapshot.notes}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

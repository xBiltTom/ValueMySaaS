import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import { providerLabel } from "@/features/ai-keys/utils";
import { AiAnalysis } from "@/features/ai-analyses/types";
import { analysisTypeLabel } from "@/features/ai-analyses/utils";
import { AiAnalysisResult } from "@/features/ai-analyses/components/ai-analysis-result";
import { cn } from "@/lib/utils";

export function AiAnalysisDetail({ analysis }: { analysis: AiAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse"></span>
              SYS_DIAGNOSTIC_LOG
            </p>
            <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-foreground">{analysisTypeLabel(analysis.analysis_type)}</h1>
            <p className="mt-3 text-[12px] font-mono leading-relaxed text-muted-foreground uppercase max-w-xl">
              &gt; Log generado el {formatDateTime(analysis.created_at)} como diagnóstico complementario
              basado en datos de sistema.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="inline-flex items-center rounded-[8px] bg-primary/10 border border-primary/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]">{providerLabel(analysis.provider)}</span>
            <span className="inline-flex items-center rounded-[8px] bg-background/50 border border-border/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{analysis.model_name || "DEFAULT_MODEL"}</span>
            <span className="inline-flex items-center rounded-[8px] bg-background/50 border border-border/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">PROMPT_V{analysis.prompt_version}</span>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "INPUT_TOKENS", value: analysis.tokens_input ?? "N/A", color: "text-accent" },
          { label: "OUTPUT_TOKENS", value: analysis.tokens_output ?? "N/A", color: "text-primary" },
          { label: "EST_COST", value: analysis.estimated_cost ? `$${analysis.estimated_cost}` : "N/A", color: "text-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md p-5 transition-all duration-300 hover:bg-card hover:border-primary/40 shadow-sm">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
            <div className="relative z-10 flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <p className={cn("text-3xl font-mono font-bold tracking-tight", stat.color)}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <AiAnalysisResult analysis={analysis} />
    </div>
  );
}

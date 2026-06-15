import { Streamdown } from "streamdown";
import { Card } from "@/components/ui/card";
import { ReportJsonRenderer } from "@/features/reports/components/report-json-renderer";
import { AiAnalysis } from "@/features/ai-analyses/types";
import { getAnalysisText } from "@/features/ai-analyses/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function PlanningAnalysisRenderer({ data }: { data: any }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-destructive";
  };

  const scoreFields = [
    { key: "problem_clarity_score", label: "CLARIDAD DEL PROBLEMA", weight: "30%" },
    { key: "value_proposition_score", label: "PROPUESTA DE VALOR", weight: "25%" },
    { key: "market_understanding_score", label: "ENTENDIMIENTO DE MERCADO", weight: "20%" },
    { key: "business_model_score", label: "MODELO DE NEGOCIO", weight: "15%" },
    { key: "pricing_feasibility_score", label: "ESTRATEGIA DE PRECIOS", weight: "10%" },
  ];

  return (
    <div className="space-y-6">
      {/* Veredicto y Score General */}
      <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-md shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
        
        <div className="relative z-10 p-8 md:flex md:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 rounded-[8px] bg-background/50 border border-border/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>OUTPUT_VERDICT</span>
              <span className="h-2 w-px bg-border/50"></span>
              <span className={cn(
                data.overall_score >= 75 ? "text-emerald-500" :
                data.overall_score >= 50 ? "text-amber-500" : "text-destructive"
              )}>
                {data.overall_score >= 75 ? "VIABLE" : data.overall_score >= 50 ? "AJUSTAR" : "RIESGO"}
              </span>
            </div>
            <h2 className={cn(
              "font-display text-4xl font-black uppercase tracking-tight leading-none",
              data.overall_score >= 75 ? "text-emerald-500" :
              data.overall_score >= 50 ? "text-amber-500" : "text-destructive"
            )}>
              {data.verdict}
            </h2>
            <p className="text-[13px] font-mono leading-relaxed text-muted-foreground">
              {data.verdict_rationale || data.reasoning}
            </p>
          </div>
          
          <div className="mt-8 md:mt-0 flex flex-col items-center justify-center bg-background/80 rounded-[20px] p-6 border border-border/40 shadow-inner shrink-0 min-w-[160px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">SYS_SCORE</span>
            <span className={cn(
              "text-6xl font-mono font-black tracking-tighter leading-none",
              getScoreColor(data.overall_score)
            )}>
              {data.overall_score}
            </span>
          </div>
        </div>
      </div>

      {/* Barras de progreso de los pilares */}
      <div className="grid gap-4 md:grid-cols-2">
        {scoreFields.map(({ key, label, weight }) => {
          const score = data[key];
          if (score === undefined) return null;
          return (
            <div key={key} className="relative overflow-hidden rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md p-5 shadow-sm group">
              <div className="flex justify-between items-end mb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">W:{weight}</span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">{label}</h3>
                </div>
                <span className={cn("text-xl font-mono font-bold leading-none", getScoreColor(score))}>
                  {score}<span className="text-xs text-muted-foreground/50">/100</span>
                </span>
              </div>
              <div className="flex gap-0.5 h-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex-1 transition-all duration-500 rounded-sm",
                      i * 5 < score ? getProgressColor(score) : "bg-muted/50",
                      i * 5 < score ? "opacity-100" : "opacity-30"
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Siguientes Pasos (si existen) */}
      {data.next_steps && data.next_steps.length > 0 && (
        <div className="relative overflow-hidden rounded-[20px] border border-border/60 bg-card/40 backdrop-blur-md p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-5 flex items-center gap-2">
            <span className="h-2 w-2 bg-primary"></span>
            Próximos Pasos Recomendados
          </h3>
          <ul className="space-y-3">
            {data.next_steps.map((step: string, i: number) => (
              <li key={i} className="flex gap-4 items-start group">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-background border border-border/40 text-muted-foreground text-[10px] font-mono font-bold group-hover:border-primary/50 group-hover:text-primary transition-colors">
                  0{i + 1}
                </span>
                <span className="text-[12px] font-mono text-muted-foreground leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AiAnalysisResult({ analysis }: { analysis: AiAnalysis }) {
  const text = getAnalysisText(analysis);
  const json = analysis.output_json;

  if (!text && !json) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-border/60 bg-card/40 backdrop-blur-md p-6 shadow-sm">
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Log analysis is empty or unavailable.</p>
      </div>
    );
  }

  const isPlanningReport = json && "overall_score" in json;

  return (
    <div className="space-y-6">
      {text && (
        <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          <div className="relative z-10 prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-p:leading-relaxed prose-p:font-medium prose-p:text-[13px] prose-li:leading-relaxed prose-li:text-[13px] prose-strong:text-accent">
            <Streamdown>{text}</Streamdown>
          </div>
        </div>
      )}

      {isPlanningReport && (
        <PlanningAnalysisRenderer data={json} />
      )}

      {json && !isPlanningReport && !text && (
        <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 shadow-sm">
          <ReportJsonRenderer content={json} />
        </div>
      )}
    </div>
  );
}

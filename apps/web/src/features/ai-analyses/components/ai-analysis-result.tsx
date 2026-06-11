import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { ReportJsonRenderer } from "@/features/reports/components/report-json-renderer";
import { AiAnalysis } from "@/features/ai-analyses/types";
import { getAnalysisText } from "@/features/ai-analyses/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function PlanningAnalysisRenderer({ data }: { data: any }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-status-success-text bg-status-success-bg";
    if (score >= 50) return "text-status-warning-text bg-status-warning-bg";
    return "text-status-danger-text bg-status-danger-bg";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-status-success-fg";
    if (score >= 50) return "bg-status-warning-fg";
    return "bg-status-danger-fg";
  };

  const scoreFields = [
    { key: "problem_clarity_score", label: "Claridad del Problema (30%)" },
    { key: "value_proposition_score", label: "Propuesta de Valor (25%)" },
    { key: "market_understanding_score", label: "Entendimiento de Mercado (20%)" },
    { key: "business_model_score", label: "Modelo de Negocio (15%)" },
    { key: "pricing_feasibility_score", label: "Estrategia de Precios (10%)" },
  ];

  return (
    <div className="space-y-6">
      {/* Veredicto y Score General */}
      <Card className="glass shadow-xl border-none overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        <div className="p-8 md:flex md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <h2 className="font-display text-4xl font-bold text-foreground">
              {data.verdict === "BUILD" ? "¡Construye esto! 🚀" : 
               data.verdict === "VALIDATE_MORE" ? "Valida un poco más 🔍" : "Pivota la idea 💡"}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {data.reasoning}
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm rounded-full h-32 w-32 border-4 border-border shadow-sm shrink-0">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Puntaje</span>
            <span className={`text-5xl font-display font-black tracking-tighter ${data.overall_score >= 80 ? "text-status-success-text" : data.overall_score >= 50 ? "text-status-warning-text" : "text-status-danger-text"}`}>
              {data.overall_score}
            </span>
          </div>
        </div>
      </Card>

      {/* Barras de progreso de los pilares */}
      <div className="grid gap-4 md:grid-cols-2">
        {scoreFields.map(({ key, label }) => {
          const score = data[key];
          if (score === undefined) return null;
          return (
            <Card key={key} className="glass p-5 shadow-sm border-white/40">
              <div className="flex justify-between items-end mb-2">
                <span className="font-semibold text-sm">{label}</span>
                <span className={`text-lg font-bold px-2 py-0.5 rounded-md ${getScoreColor(score)}`}>
                  {score}/100
                </span>
              </div>
              <Progress value={score} className="h-2 bg-muted overflow-hidden" indicatorClassName={getProgressColor(score)} />
            </Card>
          );
        })}
      </div>

      {/* Siguientes Pasos (si existen) */}
      {data.next_steps && data.next_steps.length > 0 && (
        <Card className="glass p-6 shadow-sm border-white/40">
          <h3 className="font-display text-xl font-bold mb-4">Próximos Pasos Recomendados</h3>
          <ul className="space-y-3">
            {data.next_steps.map((step: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-bold">{i + 1}</span>
                <span className="text-muted-foreground text-sm leading-6">{step}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function AiAnalysisResult({ analysis }: { analysis: AiAnalysis }) {
  const text = getAnalysisText(analysis);
  const json = analysis.output_json;

  if (!text && !json) {
    return (
      <Card className="glass p-5">
        <p className="text-sm text-muted-foreground">El análisis no tiene resultado disponible.</p>
      </Card>
    );
  }

  const isPlanningReport = json && "overall_score" in json;

  return (
    <div className="space-y-6">
      {text && (
        <Card className="glass p-6 shadow-sm">
          <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:leading-7 prose-li:leading-7">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </Card>
      )}

      {isPlanningReport && (
        <PlanningAnalysisRenderer data={json} />
      )}

      {json && !isPlanningReport && !text && (
        <ReportJsonRenderer content={json} />
      )}
    </div>
  );
}

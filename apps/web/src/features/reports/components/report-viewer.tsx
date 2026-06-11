import React from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  ShieldAlert, 
  Rocket,
  Activity,
  Zap,
  BarChart4
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ReportViewerProps {
  content: Record<string, any> | null;
}

export function ReportViewer({ content }: ReportViewerProps) {
  if (!content) {
    return (
      <Card className="bento-card flex items-center justify-center p-12 text-center text-muted-foreground">
        El reporte está vacío o no pudo ser generado.
      </Card>
    );
  }

  const { phase, kind, summary } = content;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header Summary */}
      {summary && (
        <div className="bento-card overflow-hidden border-primary/20 bg-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_15px_var(--ring)]">
              {phase === "PLANNING" ? <Lightbulb className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
            </div>
            <h2 className="font-display text-2xl font-bold">{summary.title}</h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground">{summary.message}</p>
        </div>
      )}

      {/* PLANNING Phase Layout */}
      {phase === "PLANNING" && (
        <div className="grid gap-6 md:grid-cols-2">
          {content.project_details && (
            <Card className="bento-card p-6 border-border">
              <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-bold">
                <Target className="h-5 w-5 text-accent" />
                Contexto de la Idea
              </h3>
              <div className="space-y-4">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Público Objetivo</p>
                  <p className="text-sm font-medium">{content.project_details.target_audience}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Modelo de Negocio</p>
                  <Badge variant="outline" className="mt-1">{content.project_details.business_model}</Badge>
                </div>
              </div>
            </Card>
          )}

          {content.market_fit && (
            <Card className="bento-card p-6 border-border">
              <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-bold">
                <Zap className="h-5 w-5 text-accent" />
                Market Fit
              </h3>
              <ul className="space-y-3">
                {Object.entries(content.market_fit).map(([key, val]) => (
                  <li key={key} className="flex justify-between items-center rounded-md border border-border/50 bg-background p-3 text-sm">
                    <span className="font-semibold text-muted-foreground uppercase text-xs">{key}</span>
                    <span className="font-bold">{String(val)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {content.strategic_risks && (
            <Card className="bento-card p-6 border-status-danger-border bg-status-danger-bg/20">
              <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-bold text-status-danger-fg">
                <ShieldAlert className="h-5 w-5" />
                Riesgos Estratégicos
              </h3>
              <ul className="space-y-3">
                {content.strategic_risks.map((risk: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-status-danger-text">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{risk}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {content.action_plan && (
            <Card className="bento-card p-6 border-status-success-border bg-status-success-bg/20">
              <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-bold text-status-success-fg">
                <Rocket className="h-5 w-5" />
                Plan de Acción Recomendado
              </h3>
              <ul className="space-y-3">
                {content.action_plan.map((action: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-status-success-text">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(content.recommendation || content.conclusion) && (
            <div className="md:col-span-2 bento-card p-6 bg-primary text-primary-foreground">
              <h3 className="font-display text-lg font-bold mb-2 uppercase tracking-widest opacity-80 text-xs">Veredicto</h3>
              <p className="font-semibold text-lg">{content.recommendation || content.conclusion}</p>
            </div>
          )}
        </div>
      )}

      {/* IMPLEMENTED Phase Layout */}
      {phase === "IMPLEMENTED" && (
        <div className="grid gap-6 md:grid-cols-2">
          {content.metrics && (
            <Card className="bento-card p-6 border-border md:col-span-2">
              <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-bold">
                <BarChart4 className="h-5 w-5 text-accent" />
                Métricas Clave
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Object.entries(content.metrics).map(([key, val]) => (
                  <div key={key} className="rounded-lg border border-border bg-background p-4 text-center hover:border-primary transition-colors">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{key.replace("_", " ")}</p>
                    <p className="font-display text-3xl font-bold text-foreground">{String(val)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {content.kpis && content.kpis.length > 0 && (
             <Card className="bento-card p-6 border-border md:col-span-2">
               <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-bold">
                 <TrendingUp className="h-5 w-5 text-accent" />
                 KPIs Operativos
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {content.kpis.map((kpi: any, i: number) => (
                   <div key={i} className="rounded-md bg-muted/40 p-3">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.title}</p>
                     <p className="font-semibold text-lg">{kpi.formatted_value}</p>
                   </div>
                 ))}
               </div>
             </Card>
          )}

          {(content.strengths?.length > 0 || content.weaknesses?.length > 0) && (
            <>
              <Card className="bento-card p-6 border-status-success-border bg-status-success-bg/10">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-status-success-fg">Fortalezas</h3>
                <ul className="space-y-2">
                  {content.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-status-success-text"><CheckCircle2 className="h-4 w-4 shrink-0" /> {s}</li>
                  ))}
                </ul>
              </Card>
              <Card className="bento-card p-6 border-status-danger-border bg-status-danger-bg/10">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-status-danger-fg">Debilidades</h3>
                <ul className="space-y-2">
                  {content.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-status-danger-text"><AlertTriangle className="h-4 w-4 shrink-0" /> {w}</li>
                  ))}
                </ul>
              </Card>
            </>
          )}

          {content.alerts && content.alerts.length > 0 && (
            <Card className="bento-card p-6 border-border md:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-status-warning-fg">
                <AlertTriangle className="h-5 w-5" />
                Alertas Activas
              </h3>
              <div className="grid gap-3">
                {content.alerts.map((alert: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-status-warning-border bg-status-warning-bg/50 p-4">
                    <div className="mt-0.5"><ShieldAlert className="h-5 w-5 text-status-warning-fg" /></div>
                    <div>
                      <p className="font-bold text-status-warning-text text-sm">{alert.title}</p>
                      <p className="text-sm mt-1 text-status-warning-text/80">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {content.strategic_recommendations && content.strategic_recommendations.length > 0 && (
            <Card className="bento-card p-6 border-border md:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-accent">
                <Lightbulb className="h-5 w-5" />
                Recomendaciones Estratégicas
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {content.strategic_recommendations.map((rec: string, i: number) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4 text-sm font-medium leading-relaxed">
                    <span className="text-accent font-bold mr-2">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(content.decision || content.conclusion) && (
            <div className="md:col-span-2 bento-card p-8 bg-primary text-primary-foreground relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
               <h3 className="font-display text-xs font-bold mb-3 uppercase tracking-[0.2em] opacity-80">Decisión Sugerida</h3>
               <div className="flex flex-col gap-2">
                  {content.decision && typeof content.decision === "object" ? (
                    <>
                      <p className="font-display text-3xl font-bold">{content.decision.action}</p>
                      <p className="text-lg mt-2 font-medium opacity-90">{content.decision.reason}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-3xl font-bold">{String(content.decision || "CONCLUSIÓN")}</p>
                      <p className="text-lg mt-2 font-medium opacity-90">{content.conclusion}</p>
                    </>
                  )}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  BarChart4,
  TerminalSquare
} from "lucide-react";

interface ReportViewerProps {
  content: Record<string, any> | null;
}

export function ReportViewer({ content }: ReportViewerProps) {
  if (!content) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-dashed border-border/60 bg-card/20 backdrop-blur-md p-12 text-center shadow-sm">
        <TerminalSquare className="mx-auto h-8 w-8 text-muted-foreground/30 mb-4" />
        <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground mb-2">Error: Sin contenido</h3>
        <p className="text-[11px] font-mono text-muted-foreground uppercase">
          &gt; El reporte está vacío o no pudo ser procesado correctamente.
        </p>
      </div>
    );
  }

  const { phase, kind, summary } = content;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header Summary */}
      {summary && (
        <div className="relative overflow-hidden rounded-[20px] border border-primary/40 bg-card/40 backdrop-blur-md p-6 md:p-8 shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-primary/10 border border-primary/30 shrink-0 text-primary">
              {phase === "PLANNING" ? <Lightbulb className="h-8 w-8" /> : <Activity className="h-8 w-8" />}
            </div>
            <div>
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-foreground mb-2">
                {summary.title}
              </h2>
              <p className="text-[12px] md:text-[13px] font-mono leading-relaxed text-muted-foreground border-l-2 border-primary/50 pl-4">
                &gt; {summary.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PLANNING Phase Layout */}
      {phase === "PLANNING" && (
        <div className="grid gap-6 md:grid-cols-2">
          {content.project_details && (
            <div className="relative overflow-hidden rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-accent border-b border-dashed border-border/40 pb-3">
                <Target className="h-4 w-4" /> CONTEXTO DEL PROYECTO
              </h3>
              <div className="space-y-5 relative z-10">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 bg-background/50 inline-block px-2 py-0.5 rounded border border-border/40">Audiencia Objetivo</p>
                  <p className="text-[11px] md:text-[12px] font-mono leading-relaxed text-foreground uppercase pl-3 border-l border-border/40">{content.project_details.target_audience}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 bg-background/50 inline-block px-2 py-0.5 rounded border border-border/40">Modelo de Negocio</p>
                  <br/>
                  <span className="inline-block border border-primary/20 bg-primary/10 text-primary uppercase text-[10px] tracking-widest font-black px-2 py-1 rounded-[4px] mt-1">
                    {content.project_details.business_model}
                  </span>
                </div>
              </div>
            </div>
          )}

          {content.market_fit && (
            <div className="relative overflow-hidden rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-accent border-b border-dashed border-border/40 pb-3">
                <Zap className="h-4 w-4" /> ANÁLISIS DE MERCADO
              </h3>
              <ul className="space-y-3 relative z-10">
                {Object.entries(content.market_fit).map(([key, val]) => (
                  <li key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 rounded-[8px] border border-border/40 bg-background/50 p-3">
                    <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">{key.replace(/_/g, " ")}</span>
                    <span className="font-mono text-[11px] md:text-[12px] font-bold text-foreground truncate max-w-full">{String(val)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.strategic_risks && (
            <div className="relative overflow-hidden rounded-[16px] border border-status-danger-border/60 bg-status-danger-bg/10 p-6">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-status-danger-fg border-b border-dashed border-status-danger-border/40 pb-3">
                <ShieldAlert className="h-4 w-4" /> RIESGOS ESTRATÉGICOS
              </h3>
              <ul className="space-y-4 relative z-10">
                {content.strategic_risks.map((risk: string, i: number) => (
                  <li key={i} className="flex gap-3 text-[11px] font-mono text-status-danger-text uppercase leading-relaxed">
                    <span className="text-status-danger-fg font-black">[{i + 1}]</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.action_plan && (
            <div className="relative overflow-hidden rounded-[16px] border border-status-success-border/60 bg-status-success-bg/10 p-6">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-status-success-fg border-b border-dashed border-status-success-border/40 pb-3">
                <Rocket className="h-4 w-4" /> PLAN DE ACCIÓN
              </h3>
              <ul className="space-y-4 relative z-10">
                {content.action_plan.map((action: string, i: number) => (
                  <li key={i} className="flex gap-3 text-[11px] font-mono text-status-success-text uppercase leading-relaxed">
                    <span className="text-status-success-fg font-black text-xs">&gt;</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(content.recommendation || content.conclusion) && (
            <div className="md:col-span-2 relative overflow-hidden rounded-[20px] border border-accent/40 bg-accent/5 p-6 md:p-8 backdrop-blur-md">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(var(--accent),0.03)_25%,rgba(var(--accent),0.03)_50%,transparent_50%,transparent_75%,rgba(var(--accent),0.03)_75%,rgba(var(--accent),0.03)_100%)] bg-[length:20px_20px] pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-accent mb-4 px-3 py-1 bg-background rounded-[6px] border border-accent/20">
                  VEREDICTO FINAL
                </h3>
                <p className="font-display text-xl md:text-2xl font-bold leading-tight text-foreground">
                  {content.recommendation || content.conclusion}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IMPLEMENTED Phase Layout */}
      {phase === "IMPLEMENTED" && (
        <div className="grid gap-6 md:grid-cols-2">
          {content.metrics && (
            <div className="relative overflow-hidden rounded-[20px] border border-border/40 bg-card/40 backdrop-blur-md p-6 md:col-span-2">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-accent border-b border-dashed border-border/40 pb-3">
                <BarChart4 className="h-4 w-4" /> MÉTRICAS CLAVE
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 relative z-10">
                {Object.entries(content.metrics).map(([key, val]) => (
                  <div key={key} className="rounded-[12px] border border-border/40 bg-background/50 p-4 text-center hover:border-primary/50 transition-colors">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 truncate">{key.replace(/_/g, " ")}</p>
                    <p className="font-mono text-xl md:text-2xl font-bold text-foreground break-all">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.kpis && content.kpis.length > 0 && (
            <div className="relative overflow-hidden rounded-[20px] border border-border/40 bg-card/40 backdrop-blur-md p-6 md:col-span-2">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-accent border-b border-dashed border-border/40 pb-3">
                <TrendingUp className="h-4 w-4" /> INDICADORES DE RENDIMIENTO
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                {content.kpis.map((kpi: any, i: number) => (
                  <div key={i} className="rounded-[12px] bg-background/30 border border-border/20 p-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 truncate">{kpi.title}</p>
                    <p className="font-mono text-base md:text-lg font-bold text-foreground">{kpi.formatted_value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.strengths !== undefined && (
              <div className="relative overflow-hidden rounded-[16px] border border-status-success-border/60 bg-status-success-bg/10 p-6">
                <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-status-success-fg border-b border-dashed border-status-success-border/40 pb-3">
                  <CheckCircle2 className="h-4 w-4" /> FORTALEZAS
                </h3>
                <ul className="space-y-4 relative z-10">
                  {content.strengths?.length > 0 ? content.strengths.map((s: any, i: number) => (
                    <li key={i} className="flex gap-3 text-[11px] font-mono text-status-success-text uppercase leading-relaxed">
                      <span className="text-status-success-fg font-black text-xs">&gt;</span>
                      <span>{s.title ? `${s.title}: ${s.message}` : typeof s === 'string' ? s : JSON.stringify(s)}</span>
                    </li>
                  )) : (
                    <li className="flex gap-3 text-[11px] font-mono text-status-success-text/70 uppercase leading-relaxed">
                      <span className="text-status-success-fg/50 font-black text-xs">&gt;</span>
                      <span>SYS_MSG: Sin datos suficientes para detectar fortalezas.</span>
                    </li>
                  )}
                </ul>
              </div>
          )}

          {content.weaknesses !== undefined && (
              <div className="relative overflow-hidden rounded-[16px] border border-status-danger-border/60 bg-status-danger-bg/10 p-6">
                <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-status-danger-fg border-b border-dashed border-status-danger-border/40 pb-3">
                  <AlertTriangle className="h-4 w-4" /> ASPECTOS A MEJORAR
                </h3>
                <ul className="space-y-4 relative z-10">
                  {content.weaknesses?.length > 0 ? content.weaknesses.map((w: any, i: number) => (
                    <li key={i} className="flex gap-3 text-[11px] font-mono text-status-danger-text uppercase leading-relaxed">
                      <span className="text-status-danger-fg font-black">!</span>
                      <span>{w.title ? `${w.title}: ${w.message}` : typeof w === 'string' ? w : JSON.stringify(w)}</span>
                    </li>
                  )) : (
                    <li className="flex gap-3 text-[11px] font-mono text-status-danger-text/70 uppercase leading-relaxed">
                      <span className="text-status-danger-fg/50 font-black">!</span>
                      <span>SYS_OK: No se detectaron métricas en estado crítico. Todo en orden.</span>
                    </li>
                  )}
                </ul>
              </div>
          )}

          {content.alerts !== undefined && (
            <div className="relative overflow-hidden rounded-[20px] border border-status-warning-border/60 bg-status-warning-bg/10 p-6 md:col-span-2">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-status-warning-fg border-b border-dashed border-status-warning-border/40 pb-3">
                <ShieldAlert className="h-4 w-4" /> ALERTAS IMPORTANTES
              </h3>
              <div className="grid gap-4 relative z-10">
                {content.alerts?.length > 0 ? content.alerts.map((alert: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 rounded-[12px] border border-status-warning-border/40 bg-status-warning-bg/30 p-4 md:p-5">
                    <div className="mt-0.5 p-2 bg-status-warning-bg rounded-[8px] border border-status-warning-border/50 shrink-0">
                      <ShieldAlert className="h-5 w-5 text-status-warning-fg" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-status-warning-text uppercase text-[11px] md:text-[12px] mb-1">{alert.title}</p>
                      <p className="text-[10px] md:text-[11px] font-mono leading-relaxed text-status-warning-text/80 uppercase break-words">{alert.message || alert.description}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex items-start gap-4 rounded-[12px] border border-status-warning-border/40 bg-status-warning-bg/30 p-4 md:p-5">
                    <div className="min-w-0">
                      <p className="font-bold text-status-warning-text/70 uppercase text-[11px] md:text-[12px] mb-1">SYS_OK: SIN ALERTAS</p>
                      <p className="text-[10px] md:text-[11px] font-mono leading-relaxed text-status-warning-text/60 uppercase break-words">No se detectaron alertas operativas para este periodo.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {content.strategic_recommendations && content.strategic_recommendations.length > 0 && (
            <div className="relative overflow-hidden rounded-[20px] border border-border/40 bg-card/40 backdrop-blur-md p-6 md:col-span-2">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-accent border-b border-dashed border-border/40 pb-3">
                <Lightbulb className="h-4 w-4" /> RECOMENDACIONES
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 relative z-10">
                {content.strategic_recommendations.map((rec: any, i: number) => (
                  <div key={i} className="rounded-[12px] border border-border/40 bg-background/50 p-4 md:p-5 text-[10px] md:text-[11px] font-mono uppercase leading-relaxed text-foreground">
                    <span className="text-accent font-black mr-2 bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">[{i + 1}]</span>
                    {rec.title ? `${rec.title}: ${rec.message}` : typeof rec === 'string' ? rec : JSON.stringify(rec)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(content.decision || content.conclusion) && (
            <div className="md:col-span-2 relative overflow-hidden rounded-[24px] border border-primary/40 bg-primary/5 p-6 md:p-10 backdrop-blur-xl">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col text-center items-center">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-primary mb-6 px-3 py-1 bg-background rounded-[6px] border border-primary/20">
                  SUGERENCIA PRINCIPAL
                </h3>
                <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
                  {content.decision && typeof content.decision === "object" ? (
                    <>
                      <p className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground break-words">
                        {content.decision.action}
                      </p>
                      <p className="text-[12px] md:text-[13px] font-mono leading-relaxed text-muted-foreground uppercase border-t border-dashed border-primary/20 pt-4 mt-2">
                        {content.decision.reason}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground break-words">
                        {String(content.decision || "CONCLUSIÓN")}
                      </p>
                      <p className="text-[12px] md:text-[13px] font-mono leading-relaxed text-muted-foreground uppercase border-t border-dashed border-primary/20 pt-4 mt-2">
                        {content.conclusion}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

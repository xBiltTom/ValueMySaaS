"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listAiAnalyses } from "@/features/ai-analyses/api";
import {
  Rocket, BarChart3, BrainCircuit, MessageSquareText,
  FileText, PlusCircle, Sparkles, ArrowRight, ChevronRight,
  Zap, TrendingUp, Shield, Target, CheckCircle2, Clock, Trash2, Terminal, Edit2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatEnum } from "@/lib/utils";
import { SaasProject } from "@/features/project-dashboard/types";
import { AiAnalysisModal } from "@/features/ai-analyses/components/ai-analysis-modal";
import { EditProjectModal } from "@/features/projects/components/edit-project-modal";

const STAGE_LABELS: Record<string, string> = {
  IDEA: "Idea",
  PLANNING: "Planeación",
  MVP: "MVP",
  LAUNCHED: "Lanzado",
  GROWING: "En crecimiento",
  PAUSED: "Pausado",
};

const CATEGORY_LABELS: Record<string, string> = {
  EDTECH: "EdTech", FINTECH: "FinTech", HEALTHTECH: "HealthTech",
  PRODUCTIVITY: "Productividad", MARKETING: "Marketing",
  ECOMMERCE: "E-commerce", AI: "Inteligencia Artificial",
  DEVELOPER_TOOLS: "Dev Tools", OTHER: "Otro",
};

export function ProjectHeader({
  project,
  onGenerateScore,
  isGenerating,
  onLaunchProject,
  isLaunching,
  onDeleteProject,
  isDeleting,
}: {
  project: SaasProject;
  onGenerateScore?: () => void;
  isGenerating?: boolean;
  onLaunchProject?: () => void;
  isLaunching?: boolean;
  onDeleteProject?: () => void;
  isDeleting?: boolean;
}) {
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const isPlanning = project.stage === "PLANNING" || project.stage === "IDEA";

  const [showAiModal, setShowAiModal] = useState(false);
  const router = useRouter();

  const aiAnalysesQuery = useQuery({
    queryKey: ["ai-analyses", project.id],
    queryFn: () => listAiAnalyses(project.id),
  });

  const handleAiAnalysisClick = () => {
    // Check if there is ANY existing analysis, and route to the most recent one
    if (aiAnalysesQuery.data?.items && aiAnalysesQuery.data.items.length > 0) {
      const latestAnalysis = aiAnalysesQuery.data.items[0];
      router.push(`/projects/${project.id}/ai-analysis/${latestAnalysis.id}`);
      return;
    }
    setShowAiModal(true);
  };

  const planningActions = [
    { type: 'link', href: `/projects/${project.id}/metrics`, icon: PlusCircle, title: "Estimaciones", desc: "Ingresa proyecciones", color: "text-primary" },
    { type: 'button', onClick: handleAiAnalysisClick, icon: BrainCircuit, title: "Diagnóstico IA", desc: "Evalúa viabilidad", color: "text-accent" },
    { type: 'link', href: `/projects/${project.id}/reports`, icon: FileText, title: "Reportes", desc: "Exporta datos", color: "text-status-success-fg" },
  ];

  const launchedActions = [
    { type: 'link', href: `/projects/${project.id}/metrics`, icon: PlusCircle, title: "Data Input", desc: "Ingresa métricas", color: "text-primary" },
    { type: 'link', href: `/projects/${project.id}/score`, icon: BarChart3, title: "Heurística", desc: "Score del sistema", color: "text-primary" },
    { type: 'button', onClick: handleAiAnalysisClick, icon: BrainCircuit, title: "Análisis IA", desc: "Revisión profunda", color: "text-accent" },
    { type: 'link', href: `/projects/${project.id}/reports`, icon: FileText, title: "Reportes", desc: "Informes listos", color: "text-status-success-fg" },
  ];

  const actions = isPlanning ? planningActions : launchedActions;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero header card */}
      <div className={cn(
        "relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-5 md:p-8 shadow-2xl transition-all",
        isPlanning ? "border-t-4 border-t-status-warning-fg" : "border-t-4 border-t-primary"
      )}>
        {/* Background circuit lines effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        <div className="relative flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-start lg:justify-between z-10">
          {/* Left: project info */}
          <div className="min-w-0 flex-1">
            {/* Phase badge strip */}
            <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest border",
                isPlanning
                  ? "bg-status-warning-bg/50 text-status-warning-fg border-status-warning-fg/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  : "bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.2)]"
              )}>
                {isPlanning
                  ? <><Clock className="h-3 w-3" /> SYS: {STAGE_LABELS[project.stage] ?? project.stage}</>
                  : <><Zap className="h-3 w-3" /> SYS: {STAGE_LABELS[project.stage] ?? project.stage}</>
                }
              </span>
              {project.category && (
                <span className="inline-flex items-center rounded-[8px] bg-background/50 border border-border/40 px-2 py-1 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {CATEGORY_LABELS[project.category] ?? project.category}
                </span>
              )}
              {project.business_model && (
                <span className="inline-flex items-center rounded-[8px] bg-background/50 border border-border/40 px-2 py-1 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {formatEnum(project.business_model)}
                </span>
              )}
            </div>
            
            <div className="flex items-start gap-3 md:gap-4 justify-between md:justify-start">
              <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-none break-words hyphens-auto flex-1 md:flex-none">
                {project.name}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex shrink-0 h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-[12px] bg-card/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] border border-border/40 transition-all hover:scale-110"
                  title="EDITAR PARÁMETROS"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex shrink-0 h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-[12px] bg-card/50 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:shadow-[0_0_15px_rgba(var(--destructive),0.3)] border border-border/40 transition-all hover:scale-110"
                  title="PURGAR SISTEMA"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {project.description && (
              <p className="mt-3 md:mt-4 max-w-2xl text-xs md:text-[13px] leading-relaxed text-muted-foreground font-medium">
                {project.description}
              </p>
            )}

            {/* Meta info pills */}
            <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-3">
              {project.target_market && (
                <div className="flex items-center gap-2 rounded-[10px] bg-background/50 border border-border/40 px-2.5 py-1.5 md:px-3 md:py-2 text-[11px] md:text-xs">
                  <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-bold text-foreground line-clamp-1">{project.target_market}</span>
                </div>
              )}
              {project.value_proposition && (
                <div className="flex items-center gap-2 rounded-[10px] bg-background/50 border border-border/40 px-2.5 py-1.5 md:px-3 md:py-2 text-[11px] md:text-xs flex-1 min-w-[200px]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="font-bold text-foreground line-clamp-2">{project.value_proposition}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: phase-specific CTA */}
          {isPlanning ? (
            <div className="shrink-0 mt-8 md:mt-8 lg:mt-12 lg:self-end w-full md:w-auto">
              {showLaunchConfirm ? (
                <div className="rounded-[16px] border border-status-warning-border bg-card/80 backdrop-blur-md p-4 md:p-5 w-full md:max-w-xs space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-status-warning-bg flex items-center justify-center shrink-0">
                      <Rocket className="h-4 w-4 text-status-warning-fg" />
                    </div>
                    <h3 className="font-black text-status-warning-fg text-sm uppercase tracking-wider">¿Ejecutar Lanzamiento?</h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Cambiarás el sistema a fase <strong className="text-foreground">LAUNCHED</strong>. Esto habilitará métricas de producción y análisis avanzados.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { onLaunchProject?.(); setShowLaunchConfirm(false); }}
                      disabled={isLaunching}
                      className="w-full rounded-[10px] bg-status-warning-fg px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-background shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Rocket className="h-3.5 w-3.5" />
                      {isLaunching ? "Iniciando Secuencia..." : "Confirmar Lanzamiento"}
                    </button>
                    <button
                      onClick={() => setShowLaunchConfirm(false)}
                      className="w-full rounded-[10px] border border-border/40 bg-background/50 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-card transition-colors"
                    >
                      Abortar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLaunchConfirm(true)}
                  className="group relative flex w-full md:w-auto items-center gap-3 md:gap-4 rounded-[16px] border border-border/40 bg-background/80 p-2 pr-4 md:pr-6 shadow-lg transition-all hover:bg-card hover:border-status-warning-fg/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-[12px] bg-status-warning-fg text-background shadow-inner shrink-0">
                    <Rocket className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="text-left flex-1 md:flex-none">
                    <p className="text-[9px] font-black uppercase tracking-widest text-status-warning-fg/80">Secuencia de Inicio</p>
                    <p className="text-xs md:text-sm font-black text-foreground uppercase tracking-wider mt-0.5">Lanzar Sistema</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-2 group-hover:text-status-warning-fg group-hover:translate-x-1 transition-all" />
                </button>
              )}
            </div>
          ) : (
            <div className="shrink-0 flex w-full md:w-auto md:flex-col items-center md:items-end justify-between md:justify-start gap-3 mt-8 md:mt-8 lg:mt-12 lg:self-end">
              <div className="flex items-center gap-2 rounded-[12px] bg-background/50 border border-border/40 px-3 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-foreground">Sistema Online</span>
              </div>
              <Button
                onClick={onGenerateScore}
                disabled={!onGenerateScore || isGenerating}
                className="h-10 md:h-12 w-full md:w-auto rounded-[14px] bg-foreground px-4 md:px-6 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-background shadow-[0_5px_20px_rgba(var(--foreground),0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {isGenerating ? "PROCESANDO..." : "COMPUTAR SCORE"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action navigation grid */}
      <div className={cn(
        "grid gap-3 md:gap-4",
        isPlanning ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
      )}>
        {actions.map((action, i) => {
          const actionClass = "group flex flex-col items-start gap-2 rounded-[16px] border border-border/40 bg-card/40 backdrop-blur-md p-4 transition-all duration-300 hover:bg-card hover:border-primary/40 hover:shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:-translate-y-1";
          
          const ActionContent = (
            <>
              <div className="flex items-center justify-between w-full mb-1">
                <div className={cn("h-8 w-8 rounded-[10px] bg-background/80 flex items-center justify-center border border-border/40 shadow-inner", action.color)}>
                  <action.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{action.title}</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase">{action.desc}</p>
              </div>
            </>
          );
          if (action.type === 'button') {
            return (
              <button key={i} onClick={action.onClick} className={actionClass + " text-left"}>
                {ActionContent}
              </button>
            );
          }
          return (
            <Link key={i} href={action.href || "#"} className={actionClass}>
              {ActionContent}
            </Link>
          );
        })}
      </div>

      {/* Planning phase workflow steps - Brutalist terminal style */}
      {isPlanning && (
        <div className="rounded-[20px] border border-border/40 bg-card/40 backdrop-blur-xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Boot Sequence (Recomendado)</p>
          </div>
          
          <div className="flex items-start gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {[
              { step: "01", label: "INIT_IDEA", desc: "Propuesta de valor", done: true },
              { step: "02", label: "RUN_DIAGNOSTIC", desc: "Análisis IA", done: false },
              { step: "03", label: "EVAL_SCORE", desc: "Revisa viabilidad", done: false },
              { step: "04", label: "EXEC_ITERATE", desc: "Ajusta modelo", done: false },
              { step: "05", label: "SYS_LAUNCH", desc: "Despliegue final", done: false },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex items-center gap-4 min-w-[180px] shrink-0">
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[4px]",
                      item.done ? "bg-status-success-fg/20 text-status-success-fg" : "bg-muted text-muted-foreground"
                    )}>
                      [{item.step}]
                    </span>
                    {i < arr.length - 1 && (
                      <div className={cn("h-px flex-1", item.done ? "bg-status-success-fg/30" : "bg-border/50")} />
                    )}
                  </div>
                  <div>
                    <p className={cn("text-xs font-black uppercase tracking-wider", item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase truncate">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {project && (
        <AiAnalysisModal 
          isOpen={showAiModal} 
          onClose={() => setShowAiModal(false)} 
          projectId={project.id} 
          projectStage={project.stage} 
        />
      )}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="border border-destructive/30 bg-background/95 backdrop-blur-xl sm:rounded-[24px] p-6 sm:p-8 shadow-[0_0_50px_rgba(var(--destructive),0.15)]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-black text-foreground flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              Purge Instance
            </DialogTitle>
            <DialogDescription className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              Estás a punto de ejecutar la destrucción total del nodo <strong className="text-foreground font-black px-1.5 py-0.5 bg-muted rounded-md">{project.name}</strong>.
              <br /><br />
              Esta acción es irreversible y eliminará en cascada todos sus diagnósticos, métricas, logs y reportes generados. ¿Confirmas la purga?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button variant="ghost" className="rounded-[12px] font-bold text-[13px] h-11" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Abortar
            </Button>
            <Button
              variant="danger"
              className="rounded-[12px] font-bold text-[13px] h-11 shadow-[0_0_15px_rgba(var(--destructive),0.4)]"
              onClick={() => {
                onDeleteProject?.();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Ejecutando Purga..." : "Confirmar Destrucción"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

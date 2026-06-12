"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Rocket, BarChart3, BrainCircuit, MessageSquareText,
  FileText, PlusCircle, Sparkles, ArrowRight, ChevronRight,
  Zap, TrendingUp, Shield, Target, CheckCircle2, Clock, Trash2
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
  const isPlanning = project.stage === "PLANNING" || project.stage === "IDEA";

  const [showAiModal, setShowAiModal] = useState(false);

  const planningActions = [
    { type: 'button', onClick: () => setShowAiModal(true), icon: BrainCircuit, label: "Análisis IA", color: "text-accent-foreground", bg: "bg-accent/10 hover:bg-accent/20 border-accent/30" },
    { type: 'link', href: `/projects/${project.id}/score`, icon: BarChart3, label: "Ver Score", color: "text-primary", bg: "bg-primary/5 hover:bg-primary/10 border-primary/20" },
    { type: 'link', href: `/projects/${project.id}/chat`, icon: MessageSquareText, label: "Tutor IA", color: "text-muted-foreground", bg: "bg-muted hover:bg-muted/80 border-border" },
    { type: 'link', href: `/projects/${project.id}/reports`, icon: FileText, label: "Reportes", color: "text-status-success-text", bg: "bg-status-success-bg hover:bg-status-success-bg/80 border-status-success-border" },
  ];

  const launchedActions = [
    { type: 'link', href: `/projects/${project.id}/metrics`, icon: PlusCircle, label: "Métricas", color: "text-primary", bg: "bg-primary/5 hover:bg-primary/10 border-primary/20" },
    { type: 'link', href: `/projects/${project.id}/score`, icon: BarChart3, label: "Score", color: "text-primary", bg: "bg-primary/5 hover:bg-primary/10 border-primary/20" },
    { type: 'button', onClick: () => setShowAiModal(true), icon: BrainCircuit, label: "Análisis IA", color: "text-accent-foreground", bg: "bg-accent/10 hover:bg-accent/20 border-accent/30" },
    { type: 'link', href: `/projects/${project.id}/reports`, icon: FileText, label: "Reportes", color: "text-status-success-text", bg: "bg-status-success-bg hover:bg-status-success-bg/80 border-status-success-border" },
    { type: 'link', href: `/projects/${project.id}/chat`, icon: MessageSquareText, label: "Chat", color: "text-muted-foreground", bg: "bg-muted hover:bg-muted/80 border-border" },
  ];

  const actions = isPlanning ? planningActions : launchedActions;

  return (
    <div className="space-y-4">
      {/* Hero header card */}
      <div className={cn(
        "relative overflow-hidden rounded-3xl border p-6 md:p-8",
        isPlanning
          ? "border-status-warning-border/60 bg-gradient-to-br from-status-warning-bg via-card to-card"
          : "border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card"
      )}>
        {/* Ambient glow */}
        <div className={cn(
          "pointer-events-none absolute inset-0 opacity-40",
          isPlanning
            ? "bg-[radial-gradient(ellipse_at_top_right,var(--status-warning-fg)/20,transparent_60%)]"
            : "bg-[radial-gradient(ellipse_at_top_right,var(--accent)/15,transparent_60%)]"
        )} />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: project info */}
          <div className="min-w-0 flex-1">
            {/* Phase badge strip */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide border",
                isPlanning
                  ? "bg-status-warning-bg text-status-warning-text border-status-warning-border"
                  : "bg-primary/10 text-primary border-primary/20"
              )}>
                {isPlanning
                  ? <><Clock className="h-3 w-3" /> {STAGE_LABELS[project.stage] ?? project.stage}</>
                  : <><Zap className="h-3 w-3" /> {STAGE_LABELS[project.stage] ?? project.stage}</>
                }
              </span>
              {project.category && (
                <span className="inline-flex items-center rounded-full bg-card/80 border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {CATEGORY_LABELS[project.category] ?? project.category}
                </span>
              )}
              {project.business_model && (
                <span className="inline-flex items-center rounded-full bg-card/80 border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {formatEnum(project.business_model)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl leading-tight">
                {project.name}
              </h1>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Eliminar proyecto"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {project.description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {project.description}
              </p>
            )}

            {/* Meta info pills */}
            <div className="mt-5 flex flex-wrap gap-3">
              {project.target_market && (
                <div className="flex items-center gap-1.5 rounded-xl bg-card/70 border border-border/50 px-3 py-1.5 text-xs">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{project.target_market}</span>
                </div>
              )}
              {project.value_proposition && (
                <div className="flex items-center gap-1.5 rounded-xl bg-card/70 border border-border/50 px-3 py-1.5 text-xs max-w-xs truncate">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="font-medium text-foreground truncate">{project.value_proposition}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: phase-specific CTA */}
          {isPlanning ? (
            <div className="shrink-0">
              {showLaunchConfirm ? (
                <div className="rounded-2xl border border-status-warning-border bg-status-warning-bg p-5 max-w-xs space-y-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-status-warning-fg" />
                    <h3 className="font-semibold text-status-warning-text text-sm">¿Listo para lanzar?</h3>
                  </div>
                  <p className="text-xs text-status-warning-text leading-relaxed">
                    Cambiarás el proyecto a fase <strong>LAUNCHED</strong>. Esto activará métricas reales, cálculos financieros y análisis avanzados.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLaunchConfirm(false)}
                      className="flex-1 rounded-xl border border-status-warning-border bg-card px-3 py-2 text-xs font-semibold text-status-warning-text hover:bg-status-warning-bg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => { onLaunchProject?.(); setShowLaunchConfirm(false); }}
                      disabled={isLaunching}
                      className="flex-1 rounded-xl bg-status-warning-fg px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Rocket className="h-3 w-3" />
                      {isLaunching ? "Lanzando..." : "¡Lanzar!"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLaunchConfirm(true)}
                  className="group relative overflow-hidden rounded-2xl border-2 border-status-warning-border bg-gradient-to-br from-status-warning-fg to-primary px-6 py-5 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-3">
                    <div className="rounded-full bg-white/20 p-2">
                      <Rocket className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/70">¿Tu proyecto está listo?</p>
                      <p className="text-base font-bold text-white">Marcar como Lanzado</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 rounded-2xl bg-card/80 border border-primary/20 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-semibold text-foreground">Proyecto Activo</span>
              </div>
              <Button
                onClick={onGenerateScore}
                disabled={!onGenerateScore || isGenerating}
                className="btn-premium rounded-xl"
              >
                <TrendingUp className="h-4 w-4" />
                {isGenerating ? "Analizando..." : "Generar Score"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action navigation grid */}
      <div className={cn(
        "grid gap-3",
        isPlanning ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
      )}>
        {actions.map((action, i) => {
          const actionClass = cn(
            "group flex items-center gap-3 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-left",
            action.bg
          );
          const ActionContent = (
            <>
              <action.icon className={cn("h-5 w-5 shrink-0", action.color)} />
              <span className={cn("text-sm font-semibold", action.color)}>{action.label}</span>
              <ChevronRight className={cn("ml-auto h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all", action.color)} />
            </>
          );
          if (action.type === 'button') {
            return (
              <button key={i} onClick={action.onClick} className={actionClass}>
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

      {/* Planning phase: generate score CTA (separate row for planning) */}
      {isPlanning && (
        <button
          onClick={onGenerateScore}
          disabled={!onGenerateScore || isGenerating}
          className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-5 py-4 text-primary transition-all hover:bg-primary/10 hover:border-primary/50 disabled:opacity-50"
        >
          <span className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">{isGenerating ? "Generando diagnóstico..." : "Generar diagnóstico de viabilidad"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Evalúa el potencial de tu idea con IA y métricas ponderadas</p>
            </div>
          </span>
          <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      )}

      {/* Planning phase workflow steps */}
      {isPlanning && (
        <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Flujo recomendado para ideas en planeación</p>
          <div className="flex items-start gap-0 overflow-x-auto pb-1">
            {[
              { step: 1, label: "Define tu idea", desc: "Registra nombre, problema y propuesta de valor", done: true },
              { step: 2, label: "Análisis IA", desc: "Genera tu primer análisis de viabilidad con IA", done: false },
              { step: 3, label: "Score de viabilidad", desc: "Revisa los puntajes por dimensión", done: false },
              { step: 4, label: "Itera tu modelo", desc: "Ajusta y valida con el tutor inteligente", done: false },
              { step: 5, label: "¡Lanza!", desc: "Cuando estés listo, marca tu proyecto como lanzado", done: false },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex items-start gap-0 min-w-0">
                <div className="flex flex-col items-center min-w-[120px] max-w-[140px] px-2">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2",
                    item.done
                      ? "bg-status-success-fg text-white border-status-success-fg"
                      : "bg-card text-muted-foreground border-border"
                  )}>
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                  </div>
                  <p className="mt-2 text-center text-xs font-bold text-foreground leading-tight">{item.label}</p>
                  <p className="mt-1 text-center text-[10px] text-muted-foreground leading-tight hidden sm:block">{item.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="mt-4 flex-1 min-w-[16px]">
                    <div className="h-px w-full bg-border mt-0" />
                  </div>
                )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proyecto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente el proyecto <strong>{project.name}</strong>?
              Esta acción no se puede deshacer e incluirá la eliminación de todos sus análisis, historiales y reportes.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onDeleteProject?.();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar proyecto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

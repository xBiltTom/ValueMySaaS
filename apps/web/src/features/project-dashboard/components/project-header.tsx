"use client";

import Link from "next/link";
import { BarChart3, Bot, BrainCircuit, FileText, Gauge, MessageSquareText, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatEnum } from "@/lib/utils";
import { SaasProject } from "@/features/project-dashboard/types";

export function ProjectHeader({
  project,
  onGenerateScore,
  isGenerating,
}: {
  project: SaasProject;
  onGenerateScore?: () => void;
  isGenerating?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary">{formatEnum(project.stage)}</Badge>
            <Badge>{formatEnum(project.category)}</Badge>
            <Badge>{formatEnum(project.business_model)}</Badge>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold">{project.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {project.description || "Este SaaS aún no tiene descripción registrada."}
          </p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <span><strong>Precio:</strong> {formatCurrency(project.current_price, project.currency)}</span>
            <span><strong>Mercado:</strong> {project.target_market || "Sin definir"}</span>
            <span><strong>Moneda:</strong> {project.currency}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Link href={`/projects/${project.id}/metrics`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-[#245448]">
            <PlusCircle className="h-4 w-4" />
            Métricas
          </Link>
          <Button variant="secondary" onClick={onGenerateScore} disabled={!onGenerateScore || isGenerating}>
            <Gauge className="h-4 w-4" />
            {isGenerating ? "Generando..." : "Generar diagnóstico"}
          </Button>
          <Link href={`/projects/${project.id}/score`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-white">
            <BarChart3 className="h-4 w-4" />
            Ver score
          </Link>
          <Link href={`/projects/${project.id}/reports`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-white">
            <FileText className="h-4 w-4" />
            Reportes
          </Link>
          <Link href={`/projects/${project.id}/ai-analysis`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-white">
            <BrainCircuit className="h-4 w-4" />
            Análisis IA
          </Link>
          <Link href={`/projects/${project.id}/chat`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-white">
            <MessageSquareText className="h-4 w-4" />
            Chat
          </Link>
        </div>
      </div>
      <div className="border-t border-border bg-[#fbf8f1] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Flujo recomendado</p>
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-7">
          {[
            "Registra métricas",
            "Genera diagnóstico",
            "Revisa dashboard",
            "Genera reporte ejecutivo",
            "Conecta BYOK IA",
            "Genera análisis IA",
            "Conversa con tu SaaS",
          ].map((step, index) => (
            <div key={step} className="rounded-md border border-border bg-white p-3">
              <span className="text-xs font-semibold text-primary">{index + 1}</span>
              <p className="mt-1 font-semibold text-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid border-t border-border bg-[#fbf8f1] text-sm text-muted-foreground sm:grid-cols-3">
        <Link href={`/projects/${project.id}/reports`} className="flex items-center gap-2 px-5 py-3 font-semibold text-primary hover:bg-muted">
          <FileText className="h-4 w-4" /> Reportes disponibles
        </Link>
        <Link href={`/projects/${project.id}/ai-analysis`} className="flex items-center gap-2 px-5 py-3 font-semibold text-primary hover:bg-muted">
          <Bot className="h-4 w-4" /> Análisis IA BYOK
        </Link>
        <Link href={`/projects/${project.id}/chat`} className="flex items-center gap-2 px-5 py-3 font-semibold text-primary hover:bg-muted">
          <MessageSquareText className="h-4 w-4" /> Chat contextual
        </Link>
      </div>
    </Card>
  );
}

"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, FolderKanban, Gauge, Lightbulb, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { formatDate, formatEnum } from "@/lib/utils";
import { PortfolioDashboardResponse } from "@/features/dashboard/types";

export function PortfolioDashboard({ data }: { data: PortfolioDashboardResponse }) {
  const stageData = Object.entries(data.projects_by_stage)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name: formatEnum(name), value }));

  return (
    <div className="space-y-6 relative z-10">
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard icon={FolderKanban} label="Proyectos registrados" value={data.total_projects} />
        <MetricCard
          icon={Gauge}
          label="Score promedio"
          value={data.average_overall_score ?? "Sin score"}
          hint="Basado en diagnósticos reales generados."
        />
        <MetricCard
          icon={AlertTriangle}
          label="Proyectos con alertas altas"
          value={data.high_alert_projects.length}
          hint="Se actualiza con los scores del backend."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bento-card">
          <CardHeader>
            <CardTitle className="font-display">Distribución por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {stageData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="currentColor" opacity={0.6} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="currentColor" opacity={0.6} />
                    <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.1 }} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem' }} />
                    <Bar dataKey="value" fill="#ccff00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No hay etapas para graficar aún.</p>
            )}
          </CardContent>
        </div>

        <div className="bento-card">
          <CardHeader>
            <CardTitle className="font-display">Mejora continua</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.global_recommendations.length ? (
              data.global_recommendations.map((item) => (
                <div key={`${item.priority}-${item.title}`} className="rounded-xl border border-border bg-background p-5 hover:border-primary/50 transition-colors">
                  <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary uppercase tracking-wider text-[10px] font-bold">{item.priority}</Badge>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-5">
                <div className="rounded-full bg-primary/10 p-2">
                  <Lightbulb className="h-5 w-5 text-accent" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Sin recomendaciones globales por ahora.</p>
              </div>
            )}
          </CardContent>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bento-card">
          <CardHeader>
            <CardTitle className="font-display">Proyectos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recent_projects.map((project) => (
              <div key={project.project_id} className="flex items-center justify-between rounded-xl border border-border bg-background p-5 hover:border-primary/50 transition-colors">
                <div>
                  <h3 className="font-bold text-foreground">{project.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{formatEnum(project.category)} · {formatEnum(project.stage)}</p>
                </div>
                <Badge className="border-border text-muted-foreground">{formatDate(project.created_at)}</Badge>
              </div>
            ))}
          </CardContent>
        </div>
        <div className="bento-card">
          <CardHeader>
            <CardTitle className="font-display">Referentes del portafolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProjectScoreLabel icon={Trophy} label="Más saludable" project={data.healthiest_project} />
            <ProjectScoreLabel icon={AlertTriangle} label="Más riesgoso" project={data.riskiest_project} />
          </CardContent>
        </div>
      </div>
    </div>
  );
}

function ProjectScoreLabel({
  icon: Icon,
  label,
  project,
}: {
  icon: typeof Trophy;
  label: string;
  project: PortfolioDashboardResponse["healthiest_project"];
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 hover:border-primary/50 transition-colors">
      <span className="rounded-xl bg-card p-3 text-accent border border-border shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
        <p className="font-bold text-foreground mt-1 text-lg">{project?.name ?? "Sin score generado"}</p>
      </div>
      <Badge className="ml-auto bg-primary text-primary-foreground font-bold shadow-[0_0_10px_var(--ring)]">{project?.overall_score ?? "N/A"}</Badge>
    </div>
  );
}

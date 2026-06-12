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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
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
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData}>
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="currentColor"
                      opacity={0.6}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="currentColor"
                      opacity={0.6}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-primary)", opacity: 0.06 }}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        borderRadius: "0.75rem",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No hay etapas para graficar aún.
              </p>
            )}
          </CardContent>
        </div>

        <div className="bento-card">
          <CardHeader>
            <CardTitle className="font-display">Mejora continua</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.global_recommendations.length ? (
              data.global_recommendations.map((item) => (
                <div
                  key={`${item.priority}-${item.title}`}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30"
                >
                  <Badge className="mb-2 border-primary/20 bg-primary/10 text-primary uppercase tracking-wider text-[10px] font-bold">
                    {item.priority}
                  </Badge>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sin recomendaciones globales por ahora.
                </p>
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
          <CardContent className="space-y-3">
            {data.recent_projects.map((project) => (
              <div
                key={project.project_id}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30"
              >
                <div>
                  <h3 className="font-bold text-foreground">{project.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatEnum(project.category)} · {formatEnum(project.stage)}
                  </p>
                </div>
                <Badge>{formatDate(project.created_at)}</Badge>
              </div>
            ))}
          </CardContent>
        </div>

        <div className="bento-card">
          <CardHeader>
            <CardTitle className="font-display">Referentes del portafolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProjectScoreLabel icon={Trophy} label="Más saludable" project={data.healthiest_project} />
            <ProjectScoreLabel
              icon={AlertTriangle}
              label="Más riesgoso"
              project={data.riskiest_project}
            />
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
    <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30">
      <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-bold text-foreground">
          {project?.name ?? "Sin score generado"}
        </p>
      </div>
      <Badge className="bg-primary text-primary-foreground font-bold shrink-0">
        {project?.overall_score ?? "N/A"}
      </Badge>
    </div>
  );
}

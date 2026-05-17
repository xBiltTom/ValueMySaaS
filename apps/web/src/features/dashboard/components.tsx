"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, FolderKanban, Gauge, Lightbulb, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { formatEnum } from "@/lib/utils";
import { PortfolioDashboardResponse } from "@/features/dashboard/types";

export function PortfolioDashboard({ data }: { data: PortfolioDashboardResponse }) {
  const stageData = Object.entries(data.projects_by_stage)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name: formatEnum(name), value }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={FolderKanban} label="Proyectos registrados" value={data.total_projects} />
        <MetricCard
          icon={Gauge}
          label="Score promedio"
          value={data.average_overall_score ?? "Sin score"}
          hint="Basado en diagnosticos reales generados."
        />
        <MetricCard
          icon={AlertTriangle}
          label="Proyectos con alertas altas"
          value={data.high_alert_projects.length}
          hint="Se actualiza con los scores del backend."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Distribucion por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {stageData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip cursor={{ fill: "rgba(23,63,53,0.08)" }} />
                    <Bar dataKey="value" fill="#173f35" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No hay etapas para graficar aun.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mejora continua</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.global_recommendations.length ? (
              data.global_recommendations.map((item) => (
                <div key={`${item.priority}-${item.title}`} className="rounded-md border border-border bg-white p-4">
                  <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">{item.priority}</Badge>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 rounded-md border border-border bg-white p-4">
                <Lightbulb className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Sin recomendaciones globales por ahora.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Proyectos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_projects.map((project) => (
              <div key={project.project_id} className="flex items-center justify-between rounded-md border border-border bg-white p-4">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatEnum(project.category)} · {formatEnum(project.stage)}</p>
                </div>
                <Badge>{new Date(project.created_at).toLocaleDateString("es-PE")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Referentes del portafolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProjectScoreLabel icon={Trophy} label="Mas saludable" project={data.healthiest_project} />
            <ProjectScoreLabel icon={AlertTriangle} label="Mas riesgoso" project={data.riskiest_project} />
          </CardContent>
        </Card>
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
    <div className="flex items-center gap-3 rounded-md border border-border bg-white p-4">
      <span className="rounded-md bg-muted p-2 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{project?.name ?? "Sin score generado"}</p>
      </div>
      <Badge className="ml-auto">{project?.overall_score ?? "N/A"}</Badge>
    </div>
  );
}

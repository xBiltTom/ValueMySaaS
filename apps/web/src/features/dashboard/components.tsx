"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AlertTriangle, FolderKanban, Activity, Lightbulb, Trophy, Terminal, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { formatDate, formatEnum } from "@/lib/utils";
import { PortfolioDashboardResponse } from "@/features/dashboard/types";

export function PortfolioDashboard({ data }: { data: PortfolioDashboardResponse }) {
  const stageData = Object.entries(data.projects_by_stage)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name: formatEnum(name), value }));

  const DONUT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9"];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-3">
        <MetricCard
          icon={FolderKanban}
          label="Total Deploys"
          value={data.total_projects}
          className="border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.02]"
        />
        <MetricCard
          icon={Activity}
          label="Score Promedio"
          value={data.average_overall_score ?? "N/A"}
          hint="Score global calculado del portafolio."
          className="border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.02]"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Alertas Críticas"
          value={data.high_alert_projects.length}
          hint="Proyectos que requieren refactorización."
          className="border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.02]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg group">
          <CardHeader className="border-b border-border/40 bg-background/50 px-6 py-5">
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5 text-muted-foreground" />
              Distribución por Etapas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {stageData.length ? (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {stageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(var(--background), 0.9)",
                        backdropFilter: "blur(10px)",
                        borderColor: "rgba(var(--border), 0.5)",
                        color: "var(--foreground)",
                        borderRadius: "1rem",
                        fontSize: "13px",
                        fontWeight: "bold",
                        boxShadow: "0 0 20px rgba(0,0,0,0.5)"
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-3 py-12 text-center text-muted-foreground">
                <Terminal className="h-10 w-10 opacity-20" />
                <p className="text-xs sm:text-sm font-medium tracking-wider uppercase">Sin data de etapas</p>
              </div>
            )}
          </CardContent>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="border-b border-border/40 bg-background/50 px-6 py-5">
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-muted-foreground" />
              Logs de Mejora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {data.global_recommendations.length ? (
              data.global_recommendations.map((item) => (
                <div
                  key={`${item.priority}-${item.title}`}
                  className="rounded-[16px] border border-border/60 bg-background/50 p-4 sm:p-5 transition-all hover:border-primary/50 hover:bg-card hover:shadow-md"
                >
                  <div className="mb-2 sm:mb-3 flex items-center gap-2">
                    <Badge className="border-primary/30 bg-primary/20 text-primary uppercase tracking-widest text-[9px] font-black">
                      {item.priority}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-foreground text-xs sm:text-sm uppercase tracking-wide">{item.title}</h3>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] leading-relaxed text-muted-foreground">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-4 rounded-[16px] border border-border/40 bg-background/50 p-4 sm:p-5">
                <div className="rounded-xl bg-primary/10 p-2 sm:p-3">
                  <Code2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary opacity-80" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground tracking-wide uppercase">
                  Sistema Optimizado. 0 logs pendientes.
                </p>
              </div>
            )}
          </CardContent>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="border-b border-border/40 bg-background/50 px-6 py-5">
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
              Instancias Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {data.recent_projects.map((project) => (
              <div
                key={project.project_id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 rounded-[16px] border border-border/40 bg-background/50 p-4 sm:p-5 transition-all hover:border-primary/40 hover:bg-card"
              >
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2 text-sm sm:text-base">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-accent/50 group-hover:bg-accent transition-colors" />
                    {project.name}
                  </h3>
                  <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {formatEnum(project.category)} <span className="opacity-50">/</span> {formatEnum(project.stage)}
                  </p>
                </div>
                <Badge variant="outline" className="w-fit text-[9px] sm:text-[10px] uppercase font-bold tracking-wider border-border/60">
                  {formatDate(project.created_at)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="border-b border-border/40 bg-background/50 px-6 py-5">
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <ProjectScoreLabel icon={Trophy} label="Rank #1 (Healthiest)" project={data.healthiest_project} />
            <ProjectScoreLabel
              icon={AlertTriangle}
              label="Warning (Riskiest)"
              project={data.riskiest_project}
              isAlert
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
  isAlert = false,
}: {
  icon: typeof Trophy;
  label: string;
  project: PortfolioDashboardResponse["healthiest_project"];
  isAlert?: boolean;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-[16px] border ${isAlert ? 'border-destructive/30 hover:border-destructive/60' : 'border-border/40 hover:border-primary/40'} bg-background/50 p-4 sm:p-5 transition-all hover:bg-card group`}>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span className={`rounded-xl p-2.5 sm:p-3 ${isAlert ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} group-hover:scale-110 transition-transform`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="min-w-0 flex-1 sm:hidden">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
          <p className="truncate font-bold text-foreground text-xs">
            {project?.name ?? "N/A"}
          </p>
        </div>
        <Badge className={`sm:hidden ml-auto ${isAlert ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'} font-black text-xs px-2 py-0.5 shrink-0 shadow-lg`}>
          {project?.overall_score ?? "--"}
        </Badge>
      </div>
      <div className="min-w-0 flex-1 hidden sm:block">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className="truncate font-bold text-foreground text-sm">
          {project?.name ?? "N/A"}
        </p>
      </div>
      <Badge className={`hidden sm:inline-flex ${isAlert ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'} font-black text-sm px-3 py-1 shrink-0 shadow-lg`}>
        {project?.overall_score ?? "--"}
      </Badge>
    </div>
  );
}

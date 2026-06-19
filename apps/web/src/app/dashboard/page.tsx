"use client";

import { useQuery } from "@tanstack/react-query";
import { TerminalSquare, Cpu } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getPortfolioDashboard } from "@/features/dashboard/api";
import { PortfolioDashboard } from "@/features/dashboard/components";
import { TutorialTrigger } from "@/features/tutorial/components/tutorial-trigger";

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "portfolio"],
    queryFn: getPortfolioDashboard,
  });

  return (
    <DashboardShell>
      <TutorialTrigger modules={["global", "dashboard"]} />
      <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Background ambient effect */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-[linear-gradient(to_right,rgba(150,150,150,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,150,150,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

        <div className="mb-10 relative">
          <div className="mb-4 inline-flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
            <div className="flex h-2 w-2 items-center justify-center relative">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-accent opacity-75"></span>
              <span className="relative h-2 w-2 rounded-full bg-accent"></span>
            </div>
            SYS_OPERATIONAL // GLOBAL
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl flex items-center gap-4 uppercase">
            <Cpu className="h-10 w-10 sm:h-12 sm:w-12 text-primary opacity-80" />
            Command Center
          </h1>
          <p className="mt-4 text-sm font-mono font-medium text-muted-foreground max-w-2xl border-l-2 border-primary/30 pl-4">
            &gt; INICIALIZANDO REPORTE GLOBAL...<br/>
            &gt; MONITOREANDO MÉTRICAS DE PORTAFOLIO EN TIEMPO REAL.
          </p>
        </div>

        {dashboardQuery.isLoading ? <LoadingState /> : null}
        {dashboardQuery.isError ? (
          <ErrorState message={getApiErrorMessage(dashboardQuery.error)} />
        ) : null}

        {dashboardQuery.data && dashboardQuery.data.total_projects === 0 ? (
          <div className="mt-12 relative overflow-hidden rounded-[32px] border border-border/40 bg-card/30 backdrop-blur-xl p-1 shadow-[0_0_40px_rgba(0,0,0,0.03)] group">
            <div className="absolute -right-20 -top-20 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 pointer-events-none">
              <TerminalSquare className="w-96 h-96 text-primary" />
            </div>
            <div className="bg-background/80 rounded-[28px] p-8 sm:p-16">
              <EmptyState
                icon={TerminalSquare}
                title="SISTEMA VACÍO"
                description="No tienes ningún micro-SaaS desplegado en el sistema. Inicializa un nuevo proyecto para empezar a medir valor, código y mercado."
                actionHref="/projects/new"
                actionLabel="[ INICIALIZAR ]"
              />
            </div>
          </div>
        ) : null}

        {dashboardQuery.data && dashboardQuery.data.total_projects > 0 ? (
          <PortfolioDashboard data={dashboardQuery.data} />
        ) : null}
      </div>
    </DashboardShell>
  );
}

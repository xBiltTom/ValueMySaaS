"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { listAiKeys } from "@/features/ai-keys/api";
import { AiKeyForm } from "@/features/ai-keys/components/ai-key-form";
import { AiKeyList } from "@/features/ai-keys/components/ai-key-list";
import { useCurrentUser } from "@/features/auth/use-auth";
import { KeyRound, ShieldAlert, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TutorialTrigger } from "@/features/tutorial/components/tutorial-trigger";

export default function AiKeysPage() {
  const { data: user } = useCurrentUser();
  const aiKeysQuery = useQuery({
    queryKey: ["ai-keys"],
    queryFn: listAiKeys,
  });

  return (
    <DashboardShell>
      <TutorialTrigger modules={["aiKeys"]} />
      <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
        
        {/* Background ambient effect */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-[linear-gradient(to_right,rgba(150,150,150,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,150,150,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

        <div className="mb-12 relative">
          <div className="mb-4 inline-flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
            <KeyRound className="h-3 w-3 text-accent" />
            Configuración de Nodos IA
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl flex items-center gap-4">
            <Cpu className="hidden sm:block h-10 w-10 text-primary opacity-80" />
            API Keys <span className="text-muted-foreground/50">BYOK</span>
          </h1>
          <p className="mt-4 text-sm font-bold text-muted-foreground max-w-2xl uppercase tracking-wider">
            Créditos del sistema: <span className="text-primary">{user?.ai_credits || 0} DISPONIBLES</span>. Conecta tus propias API Keys para acceso ilimitado.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] relative z-10">
          <div className="space-y-6">
            <div id="tour-ai-keys-form" className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl p-6 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 opacity-[0.03] pointer-events-none">
                <ShieldAlert className="w-48 h-48" />
              </div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Registrar Nuevo Nodo
              </h2>
              <AiKeyForm />
            </div>
          </div>
          
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent" />
                Conexiones Activas
              </h2>
              <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider border-border/60">
                {aiKeysQuery.data?.items.length || 0} Registros
              </Badge>
            </div>

            {aiKeysQuery.isLoading ? <LoadingState /> : null}
            {aiKeysQuery.isError ? (
              <ErrorState message={getApiErrorMessage(aiKeysQuery.error)} />
            ) : null}
            {aiKeysQuery.data ? <AiKeyList aiKeys={aiKeysQuery.data} /> : null}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

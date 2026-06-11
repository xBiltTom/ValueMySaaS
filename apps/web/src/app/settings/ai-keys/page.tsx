"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { listAiKeys } from "@/features/ai-keys/api";
import { AiKeyForm } from "@/features/ai-keys/components/ai-key-form";
import { AiKeyList } from "@/features/ai-keys/components/ai-key-list";
import { ByokInfoCard } from "@/features/ai-keys/components/byok-info-card";
import { useCurrentUser } from "@/features/auth/use-auth";
import { Coins, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AiKeysPage() {
  const { data: user } = useCurrentUser();
  const aiKeysQuery = useQuery({
    queryKey: ["ai-keys"],
    queryFn: listAiKeys,
  });

  return (
    <DashboardShell>
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
            Configuración
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Créditos y API Keys <span className="text-muted-foreground text-3xl font-sans">(BYOK)</span></h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            Usa los créditos otorgados por tus profesores para usar la IA, o conecta tu propia clave API para acceso ilimitado.
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr] relative z-10">
        <div className="space-y-6">
          <div className="bento-card overflow-hidden">
            <div className="bg-primary text-primary-foreground px-6 py-5 flex items-center justify-between border-b border-border/10">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Coins className="h-6 w-6" /> Tus Créditos
              </h2>
              <Badge className="bg-background/20 text-primary-foreground border-none text-sm px-3 py-1 font-bold shadow-none backdrop-blur-sm">
                {user?.ai_credits || 0} Disponibles
              </Badge>
            </div>
            <div className="p-6 bg-card">
              <p className="text-base text-muted-foreground leading-relaxed">
                Cada análisis de IA o resumen de conversación consume <strong className="text-foreground">1 crédito</strong>. 
                Si te quedas sin créditos, puedes pedir una recarga a tu profesor o usar tu propia API Key abajo.
              </p>
            </div>
          </div>

          <ByokInfoCard />
          <AiKeyForm />
        </div>
        
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2"><Sparkles className="h-6 w-6 text-accent" /> Claves Personales</h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Si tienes una clave activa aquí, no consumiremos tus créditos.
            </p>
          </div>
          {aiKeysQuery.isLoading ? <LoadingState label="Cargando API Keys..." /> : null}
          {aiKeysQuery.isError ? (
            <ErrorState title="No se pudo cargar tus API Keys" message={getApiErrorMessage(aiKeysQuery.error)} />
          ) : null}
          {aiKeysQuery.data ? <AiKeyList aiKeys={aiKeysQuery.data} /> : null}
        </section>
      </div>
    </DashboardShell>
  );
}

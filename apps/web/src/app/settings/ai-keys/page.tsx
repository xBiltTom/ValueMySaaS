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

export default function AiKeysPage() {
  const aiKeysQuery = useQuery({
    queryKey: ["ai-keys"],
    queryFn: listAiKeys,
  });

  return (
    <DashboardShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Configuracion</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">API Keys de IA</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Configura tus propias claves para habilitar analisis avanzados sin trasladar costos de IA a la plataforma.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <ByokInfoCard />
          <AiKeyForm />
        </div>
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Claves guardadas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El backend solo devuelve metadata segura. La clave completa no se muestra despues de guardarla.
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

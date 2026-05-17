import { KeyRound } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function NoActiveAiKeyState({ hasKeys }: { hasKeys: boolean }) {
  return (
    <EmptyState
      icon={KeyRound}
      title={hasKeys ? "No tienes API Keys activas." : "Aun no tienes API Keys registradas."}
      description={
        hasKeys
          ? "Activa una key BYOK para generar analisis IA con el contexto real de tu SaaS."
          : "Configura una clave BYOK para generar analisis IA sin trasladar costos a la plataforma."
      }
      actionHref="/settings/ai-keys"
      actionLabel={hasKeys ? "Activar una key" : "Configurar API Key"}
    />
  );
}

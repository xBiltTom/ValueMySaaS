import { KeyRound } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function NoActiveAiKeyState({ hasKeys }: { hasKeys: boolean }) {
  return (
    <EmptyState
      icon={KeyRound}
      title={hasKeys ? "No hay API Keys activas." : "Aún no tienes API Keys registradas."}
      description={
        hasKeys
          ? "Activa una key para chatear con el contexto real de tu SaaS."
          : "Configura una clave BYOK para habilitar el chat contextual."
      }
      actionHref="/settings/ai-keys"
      actionLabel={hasKeys ? "Activar API Key" : "Configurar API Key"}
    />
  );
}

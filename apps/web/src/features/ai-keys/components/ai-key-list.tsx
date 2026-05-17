import { KeyRound } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AiKeyListResponse } from "@/features/ai-keys/types";
import { AiKeyCard } from "@/features/ai-keys/components/ai-key-card";

export function AiKeyList({ aiKeys }: { aiKeys: AiKeyListResponse }) {
  if (!aiKeys.items.length) {
    return (
      <EmptyState
        icon={KeyRound}
        title="Aun no tienes API Keys de IA."
        description="Registra tu primera clave BYOK para dejar lista la siguiente fase de analisis asistido por IA."
      />
    );
  }

  return (
    <div className="space-y-4">
      {aiKeys.items.map((aiKey) => (
        <AiKeyCard key={aiKey.id} aiKey={aiKey} />
      ))}
    </div>
  );
}

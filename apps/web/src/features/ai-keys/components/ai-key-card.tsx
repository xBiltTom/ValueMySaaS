"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, PowerOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { formatDateTime } from "@/lib/formatters";
import { getApiErrorMessage } from "@/lib/api-client";
import { deleteAiKey, updateAiKey } from "@/features/ai-keys/api";
import { AiKey } from "@/features/ai-keys/types";
import { maskedKey } from "@/features/ai-keys/utils";
import { ProviderBadge } from "@/features/ai-keys/components/provider-badge";
import { AiKeyVerifyPanel } from "@/features/ai-keys/components/ai-key-verify-panel";

export function AiKeyCard({ aiKey }: { aiKey: AiKey }) {
  const [showVerify, setShowVerify] = useState(false);
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: () => updateAiKey(aiKey.id, { is_active: !aiKey.is_active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ai-keys"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteAiKey(aiKey.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ai-keys"] });
    },
  });

  const onDelete = () => {
    if (window.confirm("¿Eliminar esta API Key? Esta acción no mostrará ni recuperará la clave.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap gap-2">
            <ProviderBadge provider={aiKey.provider} />
            <Badge className={aiKey.is_active ? "bg-primary/10 text-primary" : "text-muted-foreground"}>
              {aiKey.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          <h3 className="mt-3 text-lg font-semibold">{aiKey.label || "Sin etiqueta"}</h3>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{maskedKey(aiKey.key_last_four)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Actualizada: {formatDateTime(aiKey.updated_at || aiKey.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowVerify((value) => !value)}>
            Verificar
          </Button>
          <Button variant="ghost" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {aiKey.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            {aiKey.is_active ? "Desactivar" : "Activar"}
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
      {updateMutation.isError ? (
        <ErrorState title="No se pudo actualizar la API Key" message={getApiErrorMessage(updateMutation.error)} />
      ) : null}
      {deleteMutation.isError ? (
        <ErrorState title="No se pudo eliminar la API Key" message={getApiErrorMessage(deleteMutation.error)} />
      ) : null}
      {showVerify ? <AiKeyVerifyPanel aiKey={aiKey} /> : null}
    </Card>
  );
}

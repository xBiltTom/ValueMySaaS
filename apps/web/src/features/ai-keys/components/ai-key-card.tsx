"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, PowerOff, Trash2, CheckCircle2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function AiKeyCard({ aiKey }: { aiKey: AiKey }) {
  const [showVerify, setShowVerify] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000);
      return;
    }
    setConfirmDelete(false);
    deleteMutation.mutate();
  };

  return (
    <Card className={cn("p-6 rounded-3xl transition-all duration-300", aiKey.is_active ? "border-primary/25 bg-primary/5 shadow-md" : "border-border opacity-70 hover:opacity-100")}>
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap gap-2 items-center">
            <ProviderBadge provider={aiKey.provider} />
            <Badge className={cn("px-3 py-1 rounded-full text-xs font-semibold", aiKey.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
              {aiKey.is_active ? <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Activa</span> : "Inactiva"}
            </Badge>
          </div>
          <h3 className="mt-4 text-xl font-display font-semibold">{aiKey.label || "Sin etiqueta"}</h3>
          <p className="mt-1 font-mono text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded inline-block">{maskedKey(aiKey.key_last_four)}</p>
          <p className="mt-3 text-xs text-muted-foreground/80">
            Actualizada: {formatDateTime(aiKey.updated_at || aiKey.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="rounded-xl" onClick={() => setShowVerify((value) => !value)}>
            Verificar
          </Button>
          <Button variant="ghost" className="rounded-xl" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {aiKey.is_active ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
            {aiKey.is_active ? "Desactivar" : "Activar"}
          </Button>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-destructive">¿Confirmar?</span>
              <Button variant="danger" className="h-9 rounded-xl px-3 text-xs" onClick={onDelete} disabled={deleteMutation.isPending}>
                Sí, eliminar
              </Button>
              <Button variant="ghost" className="h-9 rounded-xl px-3 text-xs" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="danger" className="rounded-xl" onClick={onDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
      {updateMutation.isError ? (
        <ErrorState title="No se pudo actualizar la API Key" message={getApiErrorMessage(updateMutation.error)} />
      ) : null}
      {deleteMutation.isError ? (
        <ErrorState title="No se pudo eliminar la API Key" message={getApiErrorMessage(deleteMutation.error)} />
      ) : null}
      {showVerify ? <div className="mt-6 pt-4 border-t border-border/50"><AiKeyVerifyPanel aiKey={aiKey} /></div> : null}
    </Card>
  );
}

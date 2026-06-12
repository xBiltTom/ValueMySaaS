"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, Trash2, ShieldCheck, TerminalSquare } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className={cn(
      "group relative overflow-hidden rounded-[24px] border transition-all duration-500",
      aiKey.is_active 
        ? "border-primary/40 bg-card/60 backdrop-blur-xl shadow-[0_0_30px_rgba(var(--primary),0.1)]" 
        : "border-border/40 bg-card/30 backdrop-blur-md opacity-80 hover:opacity-100"
    )}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <ProviderBadge provider={aiKey.provider} />
              <Badge variant="outline" className={cn(
                "px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase tracking-widest border-border/40", 
                aiKey.is_active ? "bg-primary/20 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground"
              )}>
                {aiKey.is_active ? (
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                    </span>
                    ONLINE
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                    OFFLINE
                  </span>
                )}
              </Badge>
            </div>
            
            <h3 className="text-xl font-display font-black text-foreground tracking-tight truncate">
              {aiKey.label || "Sin etiqueta"}
            </h3>
            
            <div className="mt-2 flex items-center gap-2">
              <code className="font-mono text-[11px] font-bold text-muted-foreground bg-background/50 border border-border/40 px-2 py-1 rounded-[6px]">
                {maskedKey(aiKey.key_last_four)}
              </code>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                UPD: {formatDateTime(aiKey.updated_at || aiKey.created_at)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button 
              variant="secondary" 
              className={cn(
                "h-10 rounded-[12px] text-xs font-black uppercase tracking-wider border-border/40 transition-all",
                showVerify ? "bg-accent text-accent-foreground border-accent/50" : "bg-card/50 hover:bg-card"
              )} 
              onClick={() => setShowVerify((value) => !value)}
            >
              <TerminalSquare className="h-4 w-4 mr-2" />
              Terminal Test
            </Button>
            
            <Button 
              variant="ghost" 
              className="h-10 rounded-[12px] text-xs font-black uppercase tracking-wider border border-border/40 bg-card/50 hover:bg-card transition-all" 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isPending}
            >
              <Power className={cn("h-4 w-4 mr-2", aiKey.is_active ? "text-destructive" : "text-primary")} />
              {aiKey.is_active ? "Apagar" : "Encender"}
            </Button>

            {confirmDelete ? (
              <Button 
                variant="danger" 
                className="h-10 rounded-[12px] text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(var(--destructive),0.4)] animate-in fade-in" 
                onClick={onDelete} 
                disabled={deleteMutation.isPending}
              >
                Confirmar
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                className="h-10 w-10 p-0 rounded-[12px] border border-border/40 bg-card/50 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all hover:border-destructive/50" 
                onClick={onDelete} 
                disabled={deleteMutation.isPending}
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {updateMutation.isError ? (
          <div className="mt-4"><ErrorState message={getApiErrorMessage(updateMutation.error)} /></div>
        ) : null}
        {deleteMutation.isError ? (
          <div className="mt-4"><ErrorState message={getApiErrorMessage(deleteMutation.error)} /></div>
        ) : null}
      </div>

      {showVerify ? (
        <div className="border-t border-border/40 bg-background/50 animate-in slide-in-from-top-2 duration-300">
          <AiKeyVerifyPanel aiKey={aiKey} />
        </div>
      ) : null}
    </div>
  );
}

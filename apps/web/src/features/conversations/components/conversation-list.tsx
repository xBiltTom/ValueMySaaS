"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, Trash2, Check, X } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import { deleteConversation } from "@/features/conversations/api";
import { ConversationListResponse } from "@/features/conversations/types";
import { cn } from "@/lib/utils";

export function ConversationList({ projectId, conversations, onSelect }: { projectId: string; conversations: ConversationListResponse; onSelect?: () => void; }) {
  const params = useParams();
  const currentConversationId = params.conversationId as string;
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (conversationId: string) => deleteConversation(projectId, conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversations", projectId] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
    },
  });

  const requestDelete = (conversationId: string) => {
    setConfirmingId(conversationId);
    setTimeout(() => setConfirmingId(null), 3000);
  };

  const confirmDelete = (conversationId: string) => {
    setConfirmingId(null);
    deleteMutation.mutate(conversationId);
  };

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r-2 border-border/60 bg-sidebar relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30" />

      <div className="border-b-2 border-border/60 p-4 relative z-10 bg-background/50 backdrop-blur-md">
        <Link
          href={`/projects/${projectId}/chat?new=true`}
          className="group relative flex h-12 w-full items-center justify-start gap-3 rounded-lg border-2 border-border/60 bg-card px-4 text-[11px] font-black uppercase tracking-widest text-foreground shadow-[2px_2px_0_rgba(0,0,0,0.2)] hover:border-primary hover:shadow-[4px_4px_0_rgba(var(--primary))] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all active:shadow-none active:translate-x-0 active:translate-y-0"
          onClick={onSelect}
        >
          <div className="h-6 w-6 bg-primary/20 text-primary flex items-center justify-center rounded-[4px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Plus aria-hidden="true" className="h-4 w-4 shrink-0" />
          </div>
          NUEVA SESIÓN
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4 relative z-10 custom-scrollbar">
        <div className="flex items-center gap-2 mb-4 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 bg-primary/50 rounded-full" />
          HISTORIAL
        </div>
        
        {conversations.items.length === 0 ? (
          <div className="mt-8 px-4 text-center">
            <p className="text-[11px] font-mono text-muted-foreground uppercase border border-dashed border-border/60 p-4 rounded-lg bg-card/20">
              &gt; NO_DATA_FOUND
            </p>
          </div>
        ) : (
          conversations.items.map((conversation) => {
            const isActive = conversation.id === currentConversationId;
            return (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all border-l-2",
                  isActive
                    ? "bg-primary/10 text-primary border-primary"
                    : "cursor-pointer text-foreground/80 hover:bg-muted/80 hover:text-foreground border-transparent hover:border-primary/50",
                )}
              >
                <MessageSquare
                  aria-hidden="true"
                  className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
                />
                <Link
                  href={`/projects/${projectId}/chat/${conversation.id}`}
                  className="min-w-0 flex-1 truncate outline-none font-mono text-[12px] uppercase"
                  onClick={onSelect}
                >
                  {conversation.title || "SESIÓN SIN TÍTULO"}
                </Link>

                {confirmingId === conversation.id ? (
                  <div className="flex items-center gap-1 opacity-100 bg-background/90 backdrop-blur-md rounded-md p-0.5 absolute right-2">
                    <button
                      type="button"
                      aria-label="Confirmar eliminación"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-destructive/20 text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-95"
                      onClick={(e) => { e.preventDefault(); confirmDelete(conversation.id); }}
                    >
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancelar"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-muted-foreground transition-all hover:bg-muted active:scale-95 border border-border/40"
                      onClick={(e) => { e.preventDefault(); setConfirmingId(null); }}
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label="Eliminar conversación"
                    className={cn(
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-muted-foreground transition-all opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive active:scale-95",
                      deleteMutation.isPending && "cursor-not-allowed opacity-50",
                    )}
                    onClick={(e) => { e.preventDefault(); requestDelete(conversation.id); }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

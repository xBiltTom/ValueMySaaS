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
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="border-b border-border p-4">
        <Link
          href={`/projects/${projectId}/chat`}
          className="inline-flex h-12 w-full items-center justify-start gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-muted hover:text-primary"
          onClick={onSelect}
        >
          <Plus aria-hidden="true" className="h-4 w-4 shrink-0" />
          Nueva conversación
        </Link>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {conversations.items.length === 0 ? (
          <p className="mt-4 px-2 text-center text-sm text-muted-foreground">
            No hay conversaciones previas.
          </p>
        ) : (
          conversations.items.map((conversation) => {
            const isActive = conversation.id === currentConversationId;
            return (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "cursor-pointer text-foreground/80 hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <MessageSquare
                  aria-hidden="true"
                  className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
                />
                <Link
                  href={`/projects/${projectId}/chat/${conversation.id}`}
                  className="min-w-0 flex-1 truncate outline-none focus-visible:underline"
                  onClick={onSelect}
                >
                  {conversation.title || "Nueva conversación"}
                </Link>

                {confirmingId === conversation.id ? (
                  <div className="flex items-center gap-1 opacity-100">
                    <button
                      type="button"
                      aria-label="Confirmar eliminación"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-all hover:bg-destructive hover:text-white active:scale-95"
                      onClick={(e) => { e.preventDefault(); confirmDelete(conversation.id); }}
                    >
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancelar"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted active:scale-95"
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
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive active:scale-95",
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

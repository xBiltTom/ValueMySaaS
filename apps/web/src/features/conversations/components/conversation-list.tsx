"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-client";
import { deleteConversation } from "@/features/conversations/api";
import { ConversationListResponse } from "@/features/conversations/types";
import { cn } from "@/lib/utils";

export function ConversationList({ projectId, conversations }: { projectId: string; conversations: ConversationListResponse }) {
  const params = useParams();
  const currentConversationId = params.conversationId as string;
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (conversationId: string) => deleteConversation(projectId, conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversations", projectId] });
    },
    onError: (err) => {
      alert(getApiErrorMessage(err));
    }
  });

  return (
    <div className="flex flex-col h-full bg-muted/20 border-r w-[280px] shrink-0">
      <div className="p-4 border-b">
        <Link 
          href={`/projects/${projectId}/chat`}
          className="inline-flex w-full justify-start items-center gap-2 bg-white shadow-sm hover:border-primary/40 hover:text-primary hover:bg-white transition-all rounded-xl h-11 font-medium border border-input px-4 text-sm"
        >
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {conversations.items.length === 0 ? (
          <div className="text-center p-4 text-sm text-muted-foreground mt-4">
            No hay conversaciones previas.
          </div>
        ) : (
          conversations.items.map((conversation) => {
            const isActive = conversation.id === currentConversationId;
            return (
              <div 
                key={conversation.id} 
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer text-sm font-medium",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground/80 hover:text-foreground"
                )}
              >
                <MessageSquare className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <Link href={`/projects/${projectId}/chat/${conversation.id}`} className="flex-1 truncate outline-none">
                  {conversation.title || "Nueva conversación"}
                </Link>
                
                <button
                  type="button"
                  className={cn(
                    "shrink-0 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-black/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100",
                    deleteMutation.isPending && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm("¿Eliminar esta conversación?")) deleteMutation.mutate(conversation.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

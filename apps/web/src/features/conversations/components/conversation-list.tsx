"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime, formatEnum } from "@/lib/formatters";
import { deleteConversation } from "@/features/conversations/api";
import { ConversationListResponse } from "@/features/conversations/types";

export function ConversationList({ projectId, conversations }: { projectId: string; conversations: ConversationListResponse }) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (conversationId: string) => deleteConversation(projectId, conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversations", projectId] });
    },
  });

  if (!conversations.items.length) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="Aún no hay conversaciones."
        description="Crea una conversación para preguntar sobre métricas, riesgos, score o acciones de mejora."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deleteMutation.isError ? (
          <ErrorState title="No se pudo eliminar la conversación" message={getApiErrorMessage(deleteMutation.error)} />
        ) : null}
        {conversations.items.map((conversation) => (
          <article key={conversation.id} className="rounded-md border border-border bg-white p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <Link href={`/projects/${projectId}/chat/${conversation.id}`} className="min-w-0 flex-1">
                <h3 className="font-semibold">{conversation.title || "Conversación sin título"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Actualizada: {formatDateTime(conversation.updated_at)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{formatEnum(conversation.status)}</Badge>
                  {conversation.model_name ? <Badge>{conversation.model_name}</Badge> : null}
                </div>
              </Link>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (window.confirm("¿Eliminar esta conversación?")) deleteMutation.mutate(conversation.id);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

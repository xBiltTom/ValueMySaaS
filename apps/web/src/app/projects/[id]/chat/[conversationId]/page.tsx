"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { listAiKeys } from "@/features/ai-keys/api";
import { getProject } from "@/features/project-dashboard/api";
import { getConversation, listConversationMessages, listConversations } from "@/features/conversations/api";
import { ChatInputForm } from "@/features/conversations/components/chat-input-form";
import { ChatMessageList } from "@/features/conversations/components/chat-message-list";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { NoActiveAiKeyState } from "@/features/conversations/components/no-active-ai-key-state";

export default function ConversationPage() {
  const params = useParams<{ id: string; conversationId: string }>();
  const projectId = params.id;
  const conversationId = params.conversationId;

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const keysQuery = useQuery({ queryKey: ["ai-keys"], queryFn: listAiKeys });
  const conversationsQuery = useQuery({
    queryKey: ["conversations", projectId],
    queryFn: () => listConversations(projectId),
  });
  const conversationQuery = useQuery({
    queryKey: ["conversation", projectId, conversationId],
    queryFn: () => getConversation(projectId, conversationId),
  });
  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", projectId, conversationId],
    queryFn: () => listConversationMessages(projectId, conversationId),
  });
  const activeKeys = keysQuery.data?.items.filter((key) => key.is_active) ?? [];

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Link href={`/projects/${projectId}/chat`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" />
            Volver a conversaciones
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {projectQuery.data?.name || "Proyecto"}
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold">
            {conversationQuery.data?.title || "Chat contextual"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {conversationQuery.data ? <Badge>{conversationQuery.data.status}</Badge> : null}
            {conversationQuery.data?.model_name ? <Badge>{conversationQuery.data.model_name}</Badge> : null}
          </div>
        </div>
        <Link href={`/projects/${projectId}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-white">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard del proyecto
        </Link>
      </div>

      {projectQuery.isLoading || keysQuery.isLoading || conversationQuery.isLoading || messagesQuery.isLoading ? (
        <LoadingState />
      ) : null}
      {projectQuery.isError || keysQuery.isError || conversationQuery.isError || messagesQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(projectQuery.error || keysQuery.error || conversationQuery.error || messagesQuery.error)}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          {conversationsQuery.data ? <ConversationList projectId={projectId} conversations={conversationsQuery.data} /> : null}
        </aside>
        <section className="space-y-5">
          {messagesQuery.data ? <ChatMessageList messages={messagesQuery.data} /> : null}
          {keysQuery.data && !activeKeys.length ? <NoActiveAiKeyState hasKeys={keysQuery.data.items.length > 0} /> : null}
          {keysQuery.data && activeKeys.length ? (
            <ChatInputForm projectId={projectId} conversationId={conversationId} activeKeys={activeKeys} />
          ) : null}
        </section>
      </div>
    </DashboardShell>
  );
}

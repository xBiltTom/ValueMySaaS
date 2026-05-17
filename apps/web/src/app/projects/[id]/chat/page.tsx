"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { listAiKeys } from "@/features/ai-keys/api";
import { getProject } from "@/features/project-dashboard/api";
import { listConversations } from "@/features/conversations/api";
import { ChatContextCard } from "@/features/conversations/components/chat-context-card";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { CreateConversationForm } from "@/features/conversations/components/create-conversation-form";
import { NoActiveAiKeyState } from "@/features/conversations/components/no-active-ai-key-state";

export default function ProjectChatPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const keysQuery = useQuery({ queryKey: ["ai-keys"], queryFn: listAiKeys });
  const conversationsQuery = useQuery({
    queryKey: ["conversations", projectId],
    queryFn: () => listConversations(projectId),
  });
  const activeKeys = keysQuery.data?.items.filter((key) => key.is_active) ?? [];

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Conversacion</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Chat contextual</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Conversa sobre tu SaaS usando metricas, score, alertas, reportes y analisis registrados.
          {projectQuery.data ? ` Proyecto: ${projectQuery.data.name}.` : ""}
        </p>
      </div>

      {projectQuery.isLoading || keysQuery.isLoading || conversationsQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError || keysQuery.isError || conversationsQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || keysQuery.error || conversationsQuery.error)} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <ChatContextCard />
          {keysQuery.data && !activeKeys.length ? <NoActiveAiKeyState hasKeys={keysQuery.data.items.length > 0} /> : null}
          <CreateConversationForm projectId={projectId} />
        </div>
        <div>{conversationsQuery.data ? <ConversationList projectId={projectId} conversations={conversationsQuery.data} /> : null}</div>
      </div>
    </DashboardShell>
  );
}

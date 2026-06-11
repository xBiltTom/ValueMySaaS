"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquarePlus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { listAiKeys } from "@/features/ai-keys/api";
import { getProject } from "@/features/project-dashboard/api";
import { listConversations } from "@/features/conversations/api";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { CreateConversationForm } from "@/features/conversations/components/create-conversation-form";

export default function ProjectChatPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const keysQuery = useQuery({ queryKey: ["ai-keys"], queryFn: listAiKeys });
  const conversationsQuery = useQuery({
    queryKey: ["conversations", projectId],
    queryFn: () => listConversations(projectId),
  });

  if (projectQuery.isLoading || keysQuery.isLoading || conversationsQuery.isLoading) {
    return <DashboardShell><LoadingState /></DashboardShell>;
  }

  if (projectQuery.isError || keysQuery.isError || conversationsQuery.isError) {
    return <DashboardShell><ErrorState message={getApiErrorMessage(projectQuery.error || keysQuery.error || conversationsQuery.error)} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <div className="flex h-[calc(100vh-100px)] -mx-4 md:-mx-7 -my-6 bg-white overflow-hidden rounded-xl border border-border shadow-sm">
        
        {/* Left Sidebar for Conversations */}
        <div className="hidden md:block">
          {conversationsQuery.data ? <ConversationList projectId={projectId} conversations={conversationsQuery.data} /> : null}
        </div>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative bg-[#f9fafb] items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <MessageSquarePlus className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold font-display">Chat de Proyecto</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Conversa sobre métricas, score, alertas, reportes y análisis registrados de {projectQuery.data?.name}.
              </p>
            </div>
            
            <CreateConversationForm projectId={projectId} />
          </div>
        </main>
      </div>
    </DashboardShell>
  );
}

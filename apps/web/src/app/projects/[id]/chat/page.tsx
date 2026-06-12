"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id;

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const keysQuery = useQuery({ queryKey: ["ai-keys"], queryFn: listAiKeys });
  const conversationsQuery = useQuery({
    queryKey: ["conversations", projectId],
    queryFn: () => listConversations(projectId),
  });

  useEffect(() => {
    if (searchParams.get("new") !== "true" && conversationsQuery.data?.items && conversationsQuery.data.items.length > 0) {
      // Redirect to the first (most recent) conversation
      router.replace(`/projects/${projectId}/chat/${conversationsQuery.data.items[0].id}`);
    }
  }, [conversationsQuery.data, projectId, router, searchParams]);

  if (projectQuery.isLoading || keysQuery.isLoading || conversationsQuery.isLoading) {
    return <DashboardShell><LoadingState /></DashboardShell>;
  }

  if (projectQuery.isError || keysQuery.isError || conversationsQuery.isError) {
    return <DashboardShell><ErrorState message={getApiErrorMessage(projectQuery.error || keysQuery.error || conversationsQuery.error)} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <div className="flex h-[calc(100vh-100px)] -mx-4 md:-mx-7 -my-6 bg-background overflow-hidden border-2 border-border/60 shadow-[8px_8px_0_rgba(0,0,0,0.2)] md:shadow-[12px_12px_0_rgba(0,0,0,0.2)] rounded-2xl relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
        
        {/* Left Sidebar for Conversations */}
        <div className="hidden md:block border-r-2 border-border/60 bg-sidebar z-10">
          {conversationsQuery.data ? <ConversationList projectId={projectId} conversations={conversationsQuery.data} /> : null}
        </div>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative bg-card/10 backdrop-blur-sm items-center justify-center p-6 z-10">
          <div className="max-w-xl w-full">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="h-20 w-20 bg-background border-2 border-primary/50 text-primary rounded-2xl shadow-[4px_4px_0_rgba(var(--primary),0.2)] flex items-center justify-center relative z-10 transform -rotate-3 hover:rotate-0 transition-transform">
                  <MessageSquare className="h-10 w-10" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display uppercase tracking-tight text-foreground mb-2 md:mb-3 leading-tight px-4">
                TERMINAL DE ANÁLISIS
              </h2>
              <p className="text-muted-foreground font-mono text-[11px] md:text-[13px] uppercase px-4 md:px-8">
                &gt; SISTEMA CONECTADO AL NÚCLEO DE DATOS DE <span className="text-primary font-bold">{projectQuery.data?.name}</span>. PREPARADO PARA PROCESAR CONSULTAS.
              </p>
            </div>
            
            <CreateConversationForm projectId={projectId} />
          </div>
        </main>
      </div>
    </DashboardShell>
  );
}

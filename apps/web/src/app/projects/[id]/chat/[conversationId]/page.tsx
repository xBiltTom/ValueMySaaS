"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { listAiKeys } from "@/features/ai-keys/api";
import { getProject } from "@/features/project-dashboard/api";
import { getConversation, listConversationMessages, listConversations } from "@/features/conversations/api";
import { ChatInputForm } from "@/features/conversations/components/chat-input-form";
import { ChatMessageList } from "@/features/conversations/components/chat-message-list";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { ChatModelSelector } from "@/features/conversations/components/chat-model-selector";
import { getAuthToken } from "@/lib/auth-token";
import { API_BASE_URL } from "@/lib/api-client";

export default function ConversationPage() {
  const params = useParams<{ id: string; conversationId: string }>();
  const projectId = params.id;
  const conversationId = params.conversationId;

  const [selectedKeyId, setSelectedKeyId] = useState("CREDITS");
  const [selectedModel, setSelectedModel] = useState("");

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

  const [messages, setMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<Error | null>(null);

  const appendMessage = async (message: any, opts: any) => {
    if (isChatLoading) return;
    setIsChatLoading(true);
    setChatError(null);

    const userMessage = {
      id: Math.random().toString(),
      role: 'USER',
      content: message.content,
      created_at: new Date().toISOString()
    };
    
    const assistantMessageId = Math.random().toString();
    setMessages(prev => [...prev, userMessage, { id: assistantMessageId, role: 'ASSISTANT', content: '', created_at: new Date().toISOString() }]);

    try {
      const response = await fetch(`${API_BASE_URL}/saas-projects/${projectId}/conversations/${conversationId}/stream`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(opts?.body || {})
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream supported");

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const newMessages = [...prev];
            const last = newMessages[newMessages.length - 1];
            if (last && last.id === assistantMessageId) {
              newMessages[newMessages.length - 1] = { ...last, content: last.content + chunk };
            }
            return newMessages;
          });
        }
      }
      messagesQuery.refetch();
    } catch (e: any) {
      setChatError(e);
      // Remove assistant placeholder on error
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (messagesQuery.data?.items && messages.length === 0) {
      setMessages(
        (messagesQuery.data.items.map(m => ({
          id: m.id,
          role: m.role.toLowerCase() as "user" | "assistant" | "system",
          content: m.content,
          createdAt: new Date(m.created_at)
        })) as any)
      );
    }
  }, [messagesQuery.data, setMessages]);

  if (projectQuery.isLoading || keysQuery.isLoading || conversationQuery.isLoading || messagesQuery.isLoading) {
    return <DashboardShell><LoadingState /></DashboardShell>;
  }

  if (projectQuery.isError || keysQuery.isError || conversationQuery.isError || messagesQuery.isError) {
    return <DashboardShell><ErrorState message={getApiErrorMessage(projectQuery.error || keysQuery.error || conversationQuery.error || messagesQuery.error)} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <div className="flex h-[calc(100vh-100px)] -mx-4 md:-mx-7 -my-6 bg-card overflow-hidden rounded-xl border border-border shadow-sm">
        
        {/* Left Sidebar for Conversations */}
        <div className="hidden md:block">
          {conversationsQuery.data ? <ConversationList projectId={projectId} conversations={conversationsQuery.data} /> : null}
        </div>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative bg-background">
          {/* Topbar: Model Selector */}
          <header className="h-14 border-b bg-card/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 sticky top-0 z-10">
            <h2 className="font-semibold text-foreground truncate max-w-[200px]">
              {conversationQuery.data?.title || "Nueva conversación"}
            </h2>
            <ChatModelSelector
              activeKeys={activeKeys}
              selectedKeyId={selectedKeyId}
              setSelectedKeyId={setSelectedKeyId}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </header>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-36 pt-6">
            <ChatMessageList 
              messages={{ 
                items: messages.map((m: any) => ({
                  id: m.id,
                  conversation_id: conversationId,
                  role: m.role.toUpperCase() as "USER" | "ASSISTANT" | "SYSTEM",
                  content: m.content || "",
                  created_at: m.createdAt?.toISOString() || new Date().toISOString(),
                  message_metadata: {},
                  token_count: 0
                })),
                total: messages.length, limit: 100, offset: 0
              }} 
            />
            {isChatLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start mt-6 mb-4">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-sm text-primary flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  Generando respuesta...
                </div>
              </div>
            )}
            {chatError && (
              <div className="mt-4">
                <ErrorState message={chatError.message} />
              </div>
            )}
          </div>

          {/* Bottom Input Form */}
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-12 pb-6 px-4 md:px-8">
            <ChatInputForm 
              projectId={projectId} 
              conversationId={conversationId} 
              append={appendMessage} 
              isChatLoading={isChatLoading}
              selectedKeyId={selectedKeyId}
              selectedModel={selectedModel}
              isEmptyChat={messages.length === 0}
            />
          </div>
        </main>
      </div>
    </DashboardShell>
  );
}

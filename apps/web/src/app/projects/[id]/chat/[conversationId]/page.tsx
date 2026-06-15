"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Menu, X, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConversationPage() {
  const params = useParams<{ id: string; conversationId: string }>();
  const projectId = params.id;
  const conversationId = params.conversationId;
  const queryClient = useQueryClient();

  const [selectedKeyId, setSelectedKeyId] = useState("CREDITS");
  const [selectedModel, setSelectedModel] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("chat_selected_key");
      const savedModel = localStorage.getItem("chat_selected_model");
      if (savedKey) setSelectedKeyId(savedKey);
      if (savedModel) setSelectedModel(savedModel);
    }
  }, []);

  const handleKeyChange = (val: string) => {
    setSelectedKeyId(val);
    if (typeof window !== "undefined") localStorage.setItem("chat_selected_key", val);
  };

  const handleModelChange = (val: string) => {
    setSelectedModel(val);
    if (typeof window !== "undefined") localStorage.setItem("chat_selected_model", val);
  };

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
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
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

  const isDataLoading = projectQuery.isLoading || keysQuery.isLoading || conversationsQuery.isLoading;
  const isChatSwitching = conversationQuery.isLoading || messagesQuery.isLoading;

  if (isDataLoading) {
    return <DashboardShell><LoadingState /></DashboardShell>;
  }

  if (projectQuery.isError || keysQuery.isError || conversationsQuery.isError) {
    return <DashboardShell><ErrorState message={getApiErrorMessage(projectQuery.error || keysQuery.error || conversationsQuery.error)} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <div className="flex h-[calc(100vh-100px)] -mx-4 md:-mx-7 -my-6 bg-background overflow-hidden relative border-2 border-border/60 shadow-[8px_8px_0_rgba(0,0,0,0.2)] md:shadow-[12px_12px_0_rgba(0,0,0,0.2)] rounded-2xl">
        
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileSidebarOpen(false)} 
          />
        )}

        {/* Sidebar for Conversations */}
        <div className={cn(
          "absolute md:relative z-50 h-full w-72 md:w-80 shrink-0 transform transition-transform duration-300 ease-in-out bg-card/95 backdrop-blur-xl border-r-2 border-border/60",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          {conversationsQuery.data ? (
            <ConversationList 
              projectId={projectId} 
              conversations={conversationsQuery.data} 
              onSelect={() => setMobileSidebarOpen(false)}
            />
          ) : null}
        </div>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative bg-card/10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

          {/* Topbar */}
          <header className="h-16 border-b-2 border-border/60 bg-background/80 backdrop-blur-xl flex items-center px-4 md:px-6 justify-between shrink-0 sticky top-0 z-20 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="md:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors active:scale-95"
                aria-label="Toggle Menu"
              >
                {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4 text-primary hidden sm:block" />
                  <h2 className="font-display font-black uppercase tracking-tight text-foreground text-sm md:text-base truncate">
                    {conversationQuery.data?.title || "NUEVO HILO DE COMUNICACIÓN"}
                  </h2>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70 font-black hidden sm:flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-primary/80 rounded-full animate-pulse" />
                  SISTEMA IA ACTIVO
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ChatModelSelector
                activeKeys={activeKeys}
                selectedKeyId={selectedKeyId} 
                setSelectedKeyId={handleKeyChange} 
                selectedModel={selectedModel}
                setSelectedModel={handleModelChange}
              />
            </div>
          </header>

          {/* Messages Scroll Area */}
          {isChatSwitching ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
              <div className="relative flex h-16 w-16 items-center justify-center mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="h-12 w-12 bg-background border-2 border-primary/50 text-primary rounded-[8px] shadow-[4px_4px_0_rgba(var(--primary),0.2)] flex items-center justify-center relative z-10 animate-bounce">
                  <TerminalSquare className="h-6 w-6" />
                </div>
              </div>
              <p className="text-muted-foreground animate-pulse font-mono font-black tracking-widest text-[11px] uppercase">
                SINCRONIZANDO NODOS...
              </p>
            </div>
          ) : conversationQuery.isError || messagesQuery.isError ? (
            <div className="flex-1 flex items-center justify-center p-8 z-10">
              <ErrorState message="ERR_CONVERSATION_LOAD_FAILED" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-24 pb-48 pt-8 scroll-smooth custom-scrollbar z-10">
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
              {chatError && (
                <div className="mt-6 animate-in fade-in">
                  <div className="bg-destructive/10 border-2 border-destructive p-4 rounded-[8px]">
                    <ErrorState message={chatError.message} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Input Form */}
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-32 pb-6 px-4 md:px-8 lg:px-24 pointer-events-none z-20">
            <div className="pointer-events-auto max-w-4xl mx-auto">
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
          </div>
        </main>
      </div>
    </DashboardShell>
  );
}

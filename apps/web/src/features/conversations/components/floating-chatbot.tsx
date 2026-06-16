"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, X, Maximize2, Minimize2, TerminalSquare, Loader2, PlusCircle, History, Edit2, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { listConversations, createConversation, listConversationMessages, updateConversation, deleteConversation } from "@/features/conversations/api";
import { listAiKeys } from "@/features/ai-keys/api";
import { ChatInputForm } from "@/features/conversations/components/chat-input-form";
import { ChatMessageList } from "@/features/conversations/components/chat-message-list";
import { ChatModelSelector } from "@/features/conversations/components/chat-model-selector";
import { getAuthToken } from "@/lib/auth-token";
import { API_BASE_URL } from "@/lib/api-client";
import { ErrorState } from "@/components/shared/error-state";

type Size = "compact" | "expanded" | "fullscreen";

export function FloatingChatbot({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState<Size>("compact");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [convToDelete, setConvToDelete] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState("CREDITS");
  const [selectedModel, setSelectedModel] = useState("");
  
  const [messages, setMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<Error | null>(null);

  // Load saved preferences
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

  const conversationsQuery = useQuery({
    queryKey: ["conversations", projectId],
    queryFn: () => listConversations(projectId),
    enabled: isOpen,
  });

  const keysQuery = useQuery({ 
    queryKey: ["ai-keys"], 
    queryFn: listAiKeys,
    enabled: isOpen,
  });

  const activeKeys = keysQuery.data?.items.filter((key) => key.is_active) ?? [];
  const latestConversation = conversationsQuery.data?.items?.[0];
  const conversationId = activeConversationId || latestConversation?.id;

  const createMutation = useMutation({
    mutationFn: () => createConversation(projectId, { title: "Nexus Core" }),
    onSuccess: (newConv) => {
      queryClient.setQueryData(["conversations", projectId], (old: any) => ({
        ...old,
        items: [newConv, ...(old?.items || [])],
        total: (old?.total || 0) + 1,
      }));
      setActiveConversationId(newConv.id);
      setShowHistory(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateConversation(projectId, id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", projectId] });
      setEditingConvId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConversation(projectId, id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", projectId] });
      if (activeConversationId === deletedId || conversationId === deletedId) {
        setActiveConversationId(null);
      }
    }
  });

  // Auto-create if no conversation exists when opened
  useEffect(() => {
    if (isOpen && conversationsQuery.isSuccess && !latestConversation && !createMutation.isPending && !createMutation.isSuccess) {
      createMutation.mutate();
    }
  }, [isOpen, conversationsQuery.isSuccess, latestConversation, createMutation]);

  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", projectId, conversationId],
    queryFn: () => listConversationMessages(projectId, conversationId!),
    enabled: !!conversationId && isOpen,
  });

  useEffect(() => {
    if (messagesQuery.data?.items) {
      setMessages(
        messagesQuery.data.items.map(m => ({
          id: m.id,
          role: m.role.toLowerCase() as "user" | "assistant" | "system",
          content: m.content,
          createdAt: new Date(m.created_at)
        }))
      );
    }
  }, [messagesQuery.data]);

  const appendMessage = async (message: any, opts: any) => {
    if (isChatLoading || !conversationId) return;
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
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
    } finally {
      setIsChatLoading(false);
    }
  };

  const isInitializing = conversationsQuery.isLoading || createMutation.isPending || messagesQuery.isLoading;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 p-4 rounded-full shadow-[0_8px_32px_rgba(139,92,246,0.4)] bg-gradient-to-tr from-violet-600 to-indigo-500 text-white hover:scale-110 active:scale-95 transition-all duration-300 animate-in fade-in zoom-in group",
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        <Bot className="h-7 w-7 relative z-10" />
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-20" />
      </button>

      {/* Chat Panel - Glassmorphic HUD */}
      <div
        className={cn(
          "fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.3),_0_0_0_1px_rgba(255,255,255,0.1)]",
          !isOpen && "translate-y-[100%] scale-95 opacity-0 pointer-events-none",
          isOpen && "translate-y-0 scale-100 opacity-100",
          size === "compact" && "bottom-6 right-6 md:bottom-8 md:right-8 w-[calc(100%-3rem)] max-w-[420px] h-[650px] max-h-[calc(100vh-6rem)] rounded-[24px] bg-background/70 backdrop-blur-[40px] border border-white/20 dark:border-white/10",
          size === "expanded" && "bottom-0 right-0 w-full md:w-[480px] lg:w-[540px] h-full rounded-none md:rounded-l-[32px] bg-background/80 backdrop-blur-[40px] border-l border-white/20 dark:border-white/10",
          size === "fullscreen" && "inset-0 w-full h-full rounded-none bg-background/95 backdrop-blur-[40px]"
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center px-5 justify-between shrink-0 relative bg-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-display font-black text-[13px] uppercase tracking-wider text-foreground">NEXUS</h3>
              <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                </span>
                INTELIGENCIA ESTRATÉGICA
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-background/40 p-1 rounded-[12px] border border-white/5 backdrop-blur-md">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-2 rounded-[8px] transition-colors active:scale-95 group relative",
                showHistory ? "bg-primary/20 text-primary" : "hover:bg-white/10 text-muted-foreground hover:text-foreground"
              )}
              title="Historial de Sesiones"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
              className="p-2 rounded-[8px] hover:bg-indigo-500/20 text-muted-foreground hover:text-indigo-400 transition-colors active:scale-95 group relative"
              title="Nueva Sesión"
            >
              <PlusCircle className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button
              onClick={() => setSize(s => s === "compact" ? "expanded" : s === "expanded" ? "fullscreen" : "compact")}
              className="p-2 rounded-[8px] hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
              title="Redimensionar"
            >
              {size === "compact" ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-[8px] hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors active:scale-95"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {isOpen && isInitializing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500 relative z-10" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest animate-pulse">Sincronizando nodos...</p>
            </div>
          ) : showHistory ? (
            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-6 scroll-smooth custom-scrollbar">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Historial de Sesiones</h4>
              </div>
              <div className="flex flex-col gap-2">
                {conversationsQuery.data?.items?.map(conv => (
                  <div
                    key={conv.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-[16px] border transition-all text-[13px] font-medium gap-2 group",
                      conversationId === conv.id 
                        ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                        : "bg-card/40 border-border/40 text-foreground hover:bg-card hover:border-primary/40 hover:-translate-y-0.5"
                    )}
                  >
                    {editingConvId === conv.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-background/50 border border-primary/50 rounded-[8px] px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateMutation.mutate({ id: conv.id, title: editTitle });
                            } else if (e.key === "Escape") {
                              setEditingConvId(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => updateMutation.mutate({ id: conv.id, title: editTitle })}
                          disabled={updateMutation.isPending}
                          className="p-1.5 rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingConvId(null)}
                          className="p-1.5 rounded-[8px] bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="flex-1 flex flex-col gap-1.5 text-left min-w-0"
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            setShowHistory(false);
                          }}
                        >
                          <span className="font-black truncate w-full">{conv.title || "Sesión sin título"}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                            {new Date(conv.created_at).toLocaleString()}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingConvId(conv.id);
                              setEditTitle(conv.title || "");
                            }}
                            className="p-1.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                            title="Renombrar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConvToDelete(conv.id);
                            }}
                            className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {conversationsQuery.data?.items?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-8">No hay sesiones anteriores.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 pt-6 scroll-smooth custom-scrollbar">
                <ChatMessageList 
                  messages={{ 
                    items: messages.map((m: any) => ({
                      id: m.id,
                      conversation_id: conversationId!,
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
                  <div className="mt-4 bg-destructive/10 border border-destructive/50 p-4 rounded-[16px] animate-in fade-in zoom-in-95">
                    <ErrorState message={chatError.message} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-gradient-to-t from-background/95 to-background/50 backdrop-blur-md border-t border-white/10 relative z-10 shrink-0">
                <div className="w-full max-w-4xl mx-auto mb-3 flex justify-end">
                  <ChatModelSelector
                    activeKeys={activeKeys}
                    selectedKeyId={selectedKeyId}
                    setSelectedKeyId={setSelectedKeyId}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                  />
                </div>
                <ChatInputForm
                  projectId={projectId}
                  conversationId={conversationId!}
                  append={appendMessage}
                  isChatLoading={isChatLoading}
                  selectedKeyId={selectedKeyId}
                  selectedModel={selectedModel}
                  isEmptyChat={messages.length === 0}
                />
              </div>
            </>
          )}
        </main>
        
        {/* Delete Confirmation Modal */}
        {convToDelete && (
          <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border/50 rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-6 max-w-[300px] w-full animate-in zoom-in-95">
              <h4 className="font-display font-black text-[14px] uppercase tracking-wider mb-2 text-foreground">¿Eliminar Sesión?</h4>
              <p className="text-xs text-muted-foreground mb-6">Esta acción no se puede deshacer. Todo el historial se perderá para siempre.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConvToDelete(null)}
                  className="px-4 py-2 rounded-[8px] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteMutation.mutate(convToDelete);
                    setConvToDelete(null);
                  }}
                  className="px-4 py-2 rounded-[8px] bg-destructive text-destructive-foreground text-[11px] font-black uppercase tracking-widest hover:bg-destructive/90 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

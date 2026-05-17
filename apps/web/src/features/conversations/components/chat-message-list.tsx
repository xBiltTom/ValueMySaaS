"use client";

import { useEffect, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ConversationMessageListResponse } from "@/features/conversations/types";
import { ChatMessageBubble } from "@/features/conversations/components/chat-message-bubble";

export function ChatMessageList({ messages }: { messages: ConversationMessageListResponse }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.items.length]);

  if (!messages.items.length) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="Esta conversación aún no tiene mensajes."
        description="Pregunta sobre métricas, riesgos, score o acciones de mejora continua."
      />
    );
  }

  return (
    <div className="space-y-4">
      {messages.items.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

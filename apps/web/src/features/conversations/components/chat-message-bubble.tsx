import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/formatters";
import { ConversationMessage } from "@/features/conversations/types";
import { roleLabel } from "@/features/conversations/utils";

export function ChatMessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "USER";
  const isAssistant = message.role === "ASSISTANT";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <article
        className={cn(
          "max-w-[min(760px,100%)] rounded-lg border p-4 shadow-sm",
          isUser && "border-primary bg-primary text-primary-foreground",
          isAssistant && "border-border bg-card",
          !isUser && !isAssistant && "border-border bg-muted",
        )}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold opacity-80">
          <span>{roleLabel(message.role)}</span>
          <span>{formatDateTime(message.created_at)}</span>
        </div>
        {isAssistant ? (
          <div className="prose prose-neutral max-w-none prose-p:leading-7 prose-li:leading-7">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
        )}
      </article>
    </div>
  );
}

import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/formatters";
import { ConversationMessage } from "@/features/conversations/types";
import { BrainCircuit, User } from "lucide-react";

export function ChatMessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "USER";
  const isAssistant = message.role === "ASSISTANT";

  return (
    <div className={cn("group flex w-full mb-8", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[min(800px,100%)] gap-4 md:gap-6", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {/* Avatar */}
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1",
          isUser ? "bg-muted text-muted-foreground hidden md:flex" : "bg-primary text-primary-foreground shadow-sm"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
        </div>

        {/* Bubble / Content */}
        <div className={cn("flex flex-col gap-1.5 min-w-0", isUser ? "items-end" : "items-start")}>
          <div className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-medium text-muted-foreground/60">{formatDateTime(message.created_at)}</span>
          </div>

          {isUser ? (
            <div className="bg-muted/60 text-foreground px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-full overflow-hidden text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-sm border border-border/50">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-neutral max-w-none prose-p:leading-relaxed prose-li:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:text-foreground text-[15px] text-foreground/90 w-full overflow-hidden">
              <Streamdown>{message.content}</Streamdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

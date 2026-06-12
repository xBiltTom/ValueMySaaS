import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/formatters";
import { ConversationMessage } from "@/features/conversations/types";
import { Sparkles } from "lucide-react";

export function ChatMessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "USER";
  const isAssistant = message.role === "ASSISTANT";

  return (
    <div className={cn("group flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex w-full md:max-w-[85%] lg:max-w-[75%] gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {/* Avatar for AI only */}
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1 bg-gradient-to-tr from-primary/80 to-primary text-primary-foreground shadow-sm border border-primary/20">
            <Sparkles className="h-4 w-4" />
          </div>
        )}

        {/* Bubble / Content */}
        <div className={cn("flex flex-col gap-1 min-w-0 w-full", isUser ? "items-end" : "items-start")}>
          <div className="flex items-center gap-2 px-1 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground/50 uppercase">{formatDateTime(message.created_at)}</span>
          </div>

          {isUser ? (
            <div className="bg-foreground text-background px-5 py-3.5 rounded-[24px] rounded-tr-[8px] max-w-full overflow-hidden text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-sm">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-neutral max-w-none prose-p:leading-relaxed prose-li:leading-relaxed prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/40 prose-pre:text-foreground text-[15.5px] text-foreground w-full overflow-hidden">
              <Streamdown>{message.content}</Streamdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

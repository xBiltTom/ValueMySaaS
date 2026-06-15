import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/formatters";
import { ConversationMessage } from "@/features/conversations/types";
import { Sparkles, User, TerminalSquare } from "lucide-react";

export function ChatMessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "USER";

  return (
    <div className={cn("group flex w-full mb-8", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex w-full md:max-w-[85%] lg:max-w-[75%] gap-2 md:gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {/* Avatar */}
        <div className={cn(
          "flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-[8px] mt-1 shadow-[2px_2px_0_rgba(0,0,0,0.2)] border-2 border-border/60",
          isUser 
            ? "bg-muted text-muted-foreground" 
            : "bg-primary text-primary-foreground border-primary"
        )}>
          {isUser ? <User className="h-4 w-4 md:h-5 md:w-5" /> : <TerminalSquare className="h-4 w-4 md:h-5 md:w-5" />}
        </div>

        {/* Bubble / Content */}
        <div className={cn("flex flex-col gap-1 min-w-0 w-full", isUser ? "items-end" : "items-start")}>
          <div className="flex flex-wrap items-center gap-2 mb-1 px-1">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              {isUser ? "USER" : "SYS_AI"}
            </span>
            <span className="text-[9px] font-mono tracking-wide text-muted-foreground/40 uppercase hidden sm:inline-block">
              [{formatDateTime(message.created_at)}]
            </span>
          </div>

          {isUser ? (
            <div className="bg-card/40 backdrop-blur-md border-2 border-border/60 text-foreground px-4 md:px-5 py-3 md:py-4 rounded-[8px] max-w-full overflow-hidden text-[13px] md:text-[14px] font-mono leading-relaxed break-words whitespace-pre-wrap shadow-[4px_4px_0_rgba(0,0,0,0.1)] relative">
              <div className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-primary/30 pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-primary/30 pointer-events-none" />
              {message.content}
            </div>
          ) : (
            <div className="bg-background border-2 border-primary/20 px-4 md:px-5 py-3 md:py-4 rounded-[8px] shadow-[4px_4px_0_rgba(var(--primary),0.1)] relative overflow-hidden w-full break-words">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30" />
              <div className="prose prose-neutral dark:prose-invert max-w-full overflow-hidden prose-p:leading-relaxed prose-li:leading-relaxed prose-pre:bg-muted/30 prose-pre:border-2 prose-pre:border-primary/20 prose-pre:text-primary prose-pre:font-mono prose-pre:rounded-[4px] prose-pre:overflow-x-auto prose-pre:max-w-full text-[13px] md:text-[14px] text-foreground w-full relative z-10 break-words">
                {!message.content ? (
                  <div className="flex items-center gap-3 font-mono text-foreground/70 py-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary m-0.5"></span>
                    </span>
                    <span className="animate-pulse uppercase tracking-wider text-[11px] font-black">INICIALIZANDO IA...</span>
                  </div>
                ) : (
                  <Streamdown>{message.content}</Streamdown>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

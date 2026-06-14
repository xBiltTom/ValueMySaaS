"use client";

import { useForm } from "react-hook-form";
import { Send, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suggestedQuestions } from "@/features/conversations/utils";
import { useEffect, useRef } from "react";

export function ChatInputForm({
  projectId,
  conversationId,
  append,
  isChatLoading,
  selectedKeyId,
  selectedModel,
  isEmptyChat
}: {
  projectId: string;
  conversationId: string;
  append: (message: any, opts: any) => void;
  isChatLoading: boolean;
  selectedKeyId: string;
  selectedModel: string;
  isEmptyChat: boolean;
}) {
  const form = useForm<{ message: string }>({
    defaultValues: { message: "" },
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea
  const watchMessage = form.watch("message");
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [watchMessage]);

  const onSubmit = (values: { message: string }) => {
    if (!values.message.trim() || isChatLoading) return;
    
    append(
      { role: "user", content: values.message },
      {
        body: {
          ai_key_id: selectedKeyId === "CREDITS" ? undefined : selectedKeyId,
          use_system_credits: selectedKeyId === "CREDITS",
          model_name: selectedModel || undefined,
          message: values.message,
        },
      }
    );
    form.reset({ message: "" });
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {isEmptyChat && (
        <div className="flex flex-wrap gap-2 justify-start md:justify-center mb-4">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="group border border-primary/30 bg-card/60 backdrop-blur-md px-3 py-2 text-[11px] font-mono text-primary/80 uppercase shadow-[2px_2px_0_rgba(var(--primary),0.2)] hover:border-primary hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 rounded-[6px]"
              onClick={() => {
                form.setValue("message", question);
                if (textareaRef.current) textareaRef.current.focus();
              }}
            >
              <Sparkles className="h-3 w-3 group-hover:animate-pulse" />
              {question}
            </button>
          ))}
        </div>
      )}

      <form 
        className="relative flex items-end w-full bg-card/90 backdrop-blur-xl border-2 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)] focus-within:shadow-[0_0_20px_rgba(var(--primary),0.2)] focus-within:border-primary transition-all overflow-hidden group"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="absolute left-4 top-4 text-primary pointer-events-none">
          <Terminal className="h-5 w-5" />
        </div>
        <Textarea
          {...form.register("message")}
          ref={(e) => {
            form.register("message").ref(e);
            textareaRef.current = e;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un comando o consulta..."
          className="min-h-[60px] max-h-[200px] w-full resize-none bg-transparent border-0 py-4 pl-12 pr-16 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-primary/40 font-mono text-[14px] text-foreground leading-relaxed custom-scrollbar"
          rows={1}
        />
        <Button 
          type="submit" 
          disabled={!watchMessage?.trim() || isChatLoading} 
          className="absolute right-3 bottom-3 h-10 w-10 p-0 inline-flex items-center justify-center rounded-[6px] transition-all duration-300 disabled:opacity-30 disabled:bg-muted disabled:text-muted-foreground hover:scale-105 active:scale-95 bg-primary text-primary-foreground shadow-[2px_2px_0_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
        >
          <Send className="h-4 w-4 ml-1" />
        </Button>
      </form>
      <div className="flex items-center justify-between mt-1 px-1">
        <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 bg-primary rounded-full animate-pulse"></span>
          Sistema IA activo
        </p>
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-widest uppercase">
          Verifica respuestas crudas
        </p>
      </div>
    </div>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { Send, Sparkles } from "lucide-react";
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
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
      {isEmptyChat && (
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:border-primary/40 hover:text-primary transition-all flex items-center gap-2"
              onClick={() => {
                form.setValue("message", question);
                if (textareaRef.current) textareaRef.current.focus();
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {question}
            </button>
          ))}
        </div>
      )}

      <form 
        className="relative flex items-end w-full rounded-3xl bg-muted/30 border border-border/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] focus-within:shadow-md focus-within:border-primary/30 focus-within:bg-white transition-all overflow-hidden" 
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Textarea
          {...form.register("message")}
          ref={(e) => {
            form.register("message").ref(e);
            textareaRef.current = e;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="min-h-[56px] max-h-[200px] w-full resize-none bg-transparent border-0 py-4 pl-6 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-base"
          rows={1}
        />
        <Button 
          type="submit" 
          disabled={!watchMessage?.trim() || isChatLoading} 
          className="absolute right-2 bottom-2 h-10 w-10 p-0 inline-flex items-center justify-center rounded-full transition-all duration-200 shadow-sm disabled:opacity-30 disabled:bg-muted-foreground"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="text-center">
        <p className="text-xs text-muted-foreground/60">
          La IA puede cometer errores. Considera verificar la información importante.
        </p>
      </div>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Terminal, Plus, TerminalSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { createConversation } from "@/features/conversations/api";
import { createConversationSchema, CreateConversationFormValues } from "@/features/conversations/schemas";

export function CreateConversationForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<CreateConversationFormValues>({
    resolver: zodResolver(createConversationSchema),
    defaultValues: { title: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateConversationFormValues) =>
      createConversation(projectId, { title: values.title || null }),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations", projectId] });
      router.push(`/projects/${projectId}/chat/${conversation.id}`);
    },
  });

  return (
    <div className="relative overflow-hidden rounded-[20px] border-2 border-border/60 bg-card/40 backdrop-blur-md p-6 sm:p-8 shadow-[8px_8px_0_rgba(0,0,0,0.2)] md:shadow-[12px_12px_0_rgba(0,0,0,0.2)]">
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
      <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary/30 rounded-tr-[20px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-dashed border-border/40 pb-4">
          <span className="inline-block border border-primary/20 bg-primary/10 text-primary uppercase text-[9px] md:text-[10px] tracking-widest font-black px-2 py-0.5 rounded-[4px]">
            SYS_INIT
          </span>
          <span className="text-[9px] md:text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
            <TerminalSquare className="h-3 w-3" /> CHAT_NODE
          </span>
        </div>

        <h3 className="font-display text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight mb-2 text-foreground leading-tight">
          NUEVO HILO DE COMUNICACIÓN
        </h3>
        <p className="text-[11px] md:text-[12px] font-mono text-muted-foreground uppercase mb-6 md:mb-8 leading-relaxed">
          &gt; Define un foco o tema central para la nueva instancia de diálogo con la IA.
        </p>

        <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          {mutation.isError ? (
            <div className="bg-destructive/10 border border-destructive p-4 rounded-xl">
              <ErrorState title="ERR_CREATION_FAILED" message={getApiErrorMessage(mutation.error)} />
            </div>
          ) : null}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              IDENTIFICADOR DE SESIÓN
            </label>
            <div className="relative">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10 font-mono h-12 bg-background/50 border-border/60 focus-visible:ring-primary/20 text-sm" 
                placeholder="Ej. Diagnóstico de churn_rate" 
                {...form.register("title")} 
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] rounded-xl shadow-[4px_4px_0_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_rgba(0,0,0,0.2)] transition-all active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
          >
            {mutation.isPending ? "INICIALIZANDO..." : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                ARRANCAR SESIÓN
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

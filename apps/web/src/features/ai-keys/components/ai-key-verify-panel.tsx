"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ShieldAlert, Terminal as TerminalIcon, Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api-client";
import { verifyAiKey, listAiKeyModels } from "@/features/ai-keys/api";
import { providerHints, providerModels } from "@/features/ai-keys/constants";
import { VerifyAiKeyFormValues, verifyAiKeySchema } from "@/features/ai-keys/schemas";
import { AiKey } from "@/features/ai-keys/types";

export function AiKeyVerifyPanel({ aiKey }: { aiKey: AiKey }) {
  const form = useForm<VerifyAiKeyFormValues>({
    resolver: zodResolver(verifyAiKeySchema),
    defaultValues: {
      model_name: providerHints[aiKey.provider],
    },
  });
  const mutation = useMutation({
    mutationFn: (values: VerifyAiKeyFormValues) =>
      verifyAiKey(aiKey.id, { model_name: values.model_name || undefined }),
  });

  const dynamicModelsQuery = useQuery({
    queryKey: ["ai-key-models", aiKey.id],
    queryFn: () => listAiKeyModels(aiKey.id),
    enabled: !!aiKey.id && aiKey.provider !== "ANTHROPIC" && aiKey.is_active,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <form className="p-5 sm:p-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5 flex items-center gap-1.5">
              <TerminalIcon className="h-3 w-3" />
              Target Model (Test)
            </span>
            {dynamicModelsQuery.isLoading ? (
              <div className="h-10 w-full px-3 flex items-center bg-background/50 border border-border/40 rounded-[10px] text-xs font-mono text-muted-foreground animate-pulse">
                _fetching_models...
              </div>
            ) : (dynamicModelsQuery.data?.items?.length || providerModels[aiKey.provider]?.length > 0) ? (
              <Select className="h-10 w-full rounded-[10px] border-border/40 bg-background/50 px-3 text-xs font-mono shadow-inner focus:border-primary" {...form.register("model_name")}>
                {((dynamicModelsQuery.data?.items?.length ? dynamicModelsQuery.data.items : null) || providerModels[aiKey.provider]).map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </Select>
            ) : (
              <Input className="h-10 rounded-[10px] border-border/40 bg-background/50 text-xs font-mono shadow-inner" placeholder={providerHints[aiKey.provider]} {...form.register("model_name")} />
            )}
          </div>
          
          <div className="sm:self-end">
            <Button 
              className="w-full sm:w-auto h-10 rounded-[10px] bg-accent text-accent-foreground text-xs font-black uppercase tracking-wider hover:bg-accent/90" 
              type="submit" 
              disabled={mutation.isPending || !aiKey.is_active}
            >
              {mutation.isPending ? "Ejecutando..." : <><Play className="h-3 w-3 mr-2" /> Run Test</>}
            </Button>
          </div>
        </div>

        {mutation.isError ? (
          <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 p-3 text-xs font-mono text-destructive flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>[ERR] {getApiErrorMessage(mutation.error)}</span>
          </div>
        ) : null}

        {mutation.data ? (
          <div className="rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-mono text-emerald-500 flex items-start gap-2">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <span>[OK] {mutation.data.message} | Model: {mutation.data.model_name}</span>
          </div>
        ) : null}

        {!aiKey.is_active ? (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mt-2">
            // STATUS: OFFLINE. ACTIVA LA KEY PARA CORRER PRUEBAS.
          </p>
        ) : null}
      </div>
    </form>
  );
}

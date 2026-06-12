"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Terminal, KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api-client";
import { createAiKey } from "@/features/ai-keys/api";
import { aiProviders, providerHints, providerLabels } from "@/features/ai-keys/constants";
import { AiKeyFormValues, aiKeySchema } from "@/features/ai-keys/schemas";

export function AiKeyForm() {
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<AiKeyFormValues>({
    resolver: zodResolver(aiKeySchema),
    defaultValues: {
      provider: "GEMINI",
      label: "Google AI Studio",
      api_key: "",
    },
  });
  const provider = useWatch({ control: form.control, name: "provider" });

  const mutation = useMutation({
    mutationFn: createAiKey,
    onSuccess: async () => {
      form.reset({ provider, label: "", api_key: "" });
      setShowKey(false);
      await queryClient.invalidateQueries({ queryKey: ["ai-keys"] });
    },
  });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      {mutation.isSuccess ? (
        <div className="rounded-[12px] border border-primary/30 bg-primary/10 p-3 text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Key cifrada y guardada.
        </div>
      ) : null}
      {mutation.isError ? (
        <ErrorState message={getApiErrorMessage(mutation.error)} />
      ) : null}

      <div className="space-y-3">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proveedor</span>
          <Select className="mt-1.5 h-11 w-full rounded-[12px] border-border/40 bg-background/50 px-3 text-sm font-bold shadow-inner focus:border-primary focus:shadow-[0_0_15px_rgba(var(--primary),0.2)]" {...form.register("provider")}>
            {aiProviders.map((item) => (
              <option key={item} value={item}>
                {providerLabels[item]}
              </option>
            ))}
          </Select>
        </label>
        
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alias (Etiqueta)</span>
          <Input className="mt-1.5 h-11 w-full rounded-[12px] border-border/40 bg-background/50 px-3 text-sm font-bold shadow-inner focus:border-primary focus:shadow-[0_0_15px_rgba(var(--primary),0.2)]" placeholder="Ej. Mi Workspace Principal" {...form.register("label")} />
          {form.formState.errors.label ? (
            <p className="mt-1.5 text-[10px] font-bold text-destructive uppercase">{form.formState.errors.label.message}</p>
          ) : null}
        </label>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clave API</span>
          <div className="mt-1.5 flex gap-2">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              autoComplete="off"
              className="h-11 w-full rounded-[12px] border-border/40 bg-background/50 px-3 text-sm font-mono shadow-inner focus:border-primary focus:shadow-[0_0_15px_rgba(var(--primary),0.2)]"
              {...form.register("api_key")}
            />
            <Button type="button" variant="secondary" className="h-11 w-11 shrink-0 rounded-[12px] border border-border/40 bg-card/50 hover:bg-card" onClick={() => setShowKey((value) => !value)} aria-label="Mostrar u ocultar API Key">
              {showKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
          {form.formState.errors.api_key ? (
            <p className="mt-1.5 text-[10px] font-bold text-destructive uppercase">{form.formState.errors.api_key.message}</p>
          ) : null}
        </label>
      </div>

      <Button type="submit" disabled={mutation.isPending} className="mt-2 h-12 w-full rounded-[14px] bg-foreground text-background text-[13px] font-black uppercase tracking-wider shadow-[0_5px_20px_rgba(var(--foreground),0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
        <KeyRound className="h-4 w-4" />
        {mutation.isPending ? "ENCRIPTANDO..." : "Guardar e Inicializar"}
      </Button>
    </form>
  );
}

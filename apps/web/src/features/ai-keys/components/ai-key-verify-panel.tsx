"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
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
    <form className="mt-4 rounded-md border border-border bg-card p-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <label className="block">
        <span className="text-sm font-semibold">Modelo para verificar</span>
        {dynamicModelsQuery.isLoading ? (
          <div className="mt-2 w-full h-[40px] px-3 flex items-center bg-background border border-border rounded-md text-sm text-muted-foreground">
            Cargando modelos...
          </div>
        ) : (dynamicModelsQuery.data?.items?.length || providerModels[aiKey.provider]?.length > 0) ? (
          <Select className="mt-2 w-full" {...form.register("model_name")}>
            {((dynamicModelsQuery.data?.items?.length ? dynamicModelsQuery.data.items : null) || providerModels[aiKey.provider]).map((model) => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </Select>
        ) : (
          <Input className="mt-2" placeholder={providerHints[aiKey.provider]} {...form.register("model_name")} />
        )}
      </label>
      {mutation.isError ? (
        <ErrorState title="No se pudo verificar la conexión" message={`${getApiErrorMessage(mutation.error)}. Revisa que la API Key esté activa y que el modelo sea compatible con el proveedor.`} />
      ) : null}
      {mutation.data ? (
        <div className="mt-3 flex gap-3 rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
          {mutation.data.ok ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          <p>
            {mutation.data.message} Modelo resuelto: <strong>{mutation.data.model_name}</strong>
          </p>
        </div>
      ) : null}
      <Button className="mt-3" type="submit" disabled={mutation.isPending || !aiKey.is_active}>
        {mutation.isPending ? "Verificando..." : "Verificar conexión"}
      </Button>
      {!aiKey.is_active ? (
        <p className="mt-2 text-xs text-muted-foreground">Activa la key antes de verificarla.</p>
      ) : null}
    </form>
  );
}

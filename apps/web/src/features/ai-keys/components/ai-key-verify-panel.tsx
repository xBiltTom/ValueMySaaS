"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { verifyAiKey } from "@/features/ai-keys/api";
import { providerHints } from "@/features/ai-keys/constants";
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

  return (
    <form className="mt-4 rounded-md border border-border bg-[#fffdf8] p-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <label className="block">
        <span className="text-sm font-semibold">Modelo para verificar</span>
        <Input className="mt-2" placeholder={providerHints[aiKey.provider]} {...form.register("model_name")} />
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

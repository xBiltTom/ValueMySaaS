"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Save } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Registrar API Key</CardTitle>
        <CardDescription>La clave solo se usa para enviarla al backend y cifrarla. No se guarda en localStorage.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          {mutation.isSuccess ? (
            <div className="rounded-md border border-primary/20 bg-primary/10 p-4 text-sm font-semibold text-primary">
              API Key guardada. El campo sensible fue limpiado.
            </div>
          ) : null}
          {mutation.isError ? (
            <ErrorState title="No se pudo guardar la API Key" message={getApiErrorMessage(mutation.error)} />
          ) : null}

          <label className="block">
            <span className="text-sm font-semibold">Proveedor</span>
            <Select className="mt-2" {...form.register("provider")}>
              {aiProviders.map((item) => (
                <option key={item} value={item}>
                  {providerLabels[item]}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Etiqueta</span>
            <Input className="mt-2" placeholder="Google AI Studio" {...form.register("label")} />
            {form.formState.errors.label ? (
              <p className="mt-1 text-xs font-medium text-destructive">{form.formState.errors.label.message}</p>
            ) : null}
          </label>
          <label className="block">
            <span className="text-sm font-semibold">API Key</span>
            <div className="mt-2 flex gap-2">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="Pega tu API Key"
                autoComplete="off"
                {...form.register("api_key")}
              />
              <Button type="button" variant="secondary" onClick={() => setShowKey((value) => !value)} aria-label="Mostrar u ocultar API Key">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {form.formState.errors.api_key ? (
              <p className="mt-1 text-xs font-medium text-destructive">{form.formState.errors.api_key.message}</p>
            ) : null}
          </label>
          <p className="rounded-md border border-border bg-white p-3 text-xs leading-5 text-muted-foreground">
            Modelo sugerido para verificar después: <strong>{providerHints[provider]}</strong>
          </p>
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="h-4 w-4" />
            {mutation.isPending ? "Guardando..." : "Guardar API Key"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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
    <Card className="rounded-3xl">
      <CardHeader className="px-6 md:px-8 pt-6 md:pt-8 pb-4">
        <CardTitle className="text-2xl font-display">Registrar API Key</CardTitle>
        <CardDescription className="text-base mt-2">La clave solo se usa para enviarla al backend y cifrarla. No se guarda en localStorage.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
        <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          {mutation.isSuccess ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-semibold text-primary">
              API Key guardada. El campo sensible fue limpiado.
            </div>
          ) : null}
          {mutation.isError ? (
            <ErrorState title="No se pudo guardar la API Key" message={getApiErrorMessage(mutation.error)} />
          ) : null}

          <label className="block">
            <span className="text-sm font-semibold">Proveedor</span>
            <Select className="input-premium h-12 rounded-xl text-base mt-2" {...form.register("provider")}>
              {aiProviders.map((item) => (
                <option key={item} value={item}>
                  {providerLabels[item]}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Etiqueta</span>
            <Input className="input-premium h-12 rounded-xl text-base mt-2" placeholder="Google AI Studio" {...form.register("label")} />
            {form.formState.errors.label ? (
              <p className="mt-1.5 text-[13px] font-medium text-destructive">{form.formState.errors.label.message}</p>
            ) : null}
          </label>
          <label className="block">
            <span className="text-sm font-semibold">API Key</span>
            <div className="mt-2 flex gap-2">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="Pega tu API Key"
                autoComplete="off"
                className="input-premium h-12 rounded-xl text-base font-mono"
                {...form.register("api_key")}
              />
              <Button type="button" variant="secondary" className="h-12 w-12 rounded-xl" onClick={() => setShowKey((value) => !value)} aria-label="Mostrar u ocultar API Key">
                {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            {form.formState.errors.api_key ? (
              <p className="mt-1.5 text-[13px] font-medium text-destructive">{form.formState.errors.api_key.message}</p>
            ) : null}
          </label>
          <p className="rounded-xl border border-border bg-card/50 p-4 text-sm leading-relaxed text-muted-foreground">
            Modelo sugerido para verificar después: <strong>{providerHints[provider]}</strong>
          </p>
          <div className="pt-2">
            <Button type="submit" disabled={mutation.isPending} className="btn-premium w-full h-12 text-base rounded-xl">
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Guardando..." : "Guardar API Key"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

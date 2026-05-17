"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BrainCircuit, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { AiKey } from "@/features/ai-keys/types";
import { providerHints, providerLabels } from "@/features/ai-keys/constants";
import { maskedKey } from "@/features/ai-keys/utils";
import { createAiAnalysis } from "@/features/ai-analyses/api";
import { analysisDescriptions, analysisLabels, analysisTypes } from "@/features/ai-analyses/constants";
import { aiAnalysisSchema, AiAnalysisFormValues } from "@/features/ai-analyses/schemas";

export function AiAnalysisForm({ projectId, activeKeys }: { projectId: string; activeKeys: AiKey[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const firstKey = activeKeys[0];
  const form = useForm<AiAnalysisFormValues>({
    resolver: zodResolver(aiAnalysisSchema),
    defaultValues: {
      ai_key_id: firstKey?.id || "",
      analysis_type: "FULL_DIAGNOSIS",
      model_name: firstKey ? providerHints[firstKey.provider] : "",
      custom_question: "",
    },
  });

  const selectedKeyId = useWatch({ control: form.control, name: "ai_key_id" });
  const analysisType = useWatch({ control: form.control, name: "analysis_type" });
  const selectedKey = useMemo(
    () => activeKeys.find((key) => key.id === selectedKeyId) || firstKey,
    [activeKeys, firstKey, selectedKeyId],
  );

  const mutation = useMutation({
    mutationFn: (values: AiAnalysisFormValues) =>
      createAiAnalysis(projectId, {
        ai_key_id: values.ai_key_id,
        analysis_type: values.analysis_type,
        model_name: values.model_name || null,
        custom_question: values.analysis_type === "CUSTOM" ? values.custom_question || null : null,
      }),
    onSuccess: async (analysis) => {
      await queryClient.invalidateQueries({ queryKey: ["ai-analyses", projectId] });
      router.push(`/projects/${projectId}/ai-analysis/${analysis.id}`);
    },
  });

  return (
    <Card>
      <CardHeader>
        <BrainCircuit className="h-6 w-6 text-primary" />
        <CardTitle>Generar análisis asistido</CardTitle>
        <CardDescription>
          Usa una key BYOK activa y el contexto registrado del proyecto: métricas, score, alertas y reportes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          {mutation.isError ? (
            <ErrorState
              title="No se pudo generar el análisis IA"
              message={`${getApiErrorMessage(mutation.error)}. Verifica que la API Key esté activa, que el modelo sea compatible y que el SaaS tenga contexto suficiente.`}
            />
          ) : null}
          <label className="block">
            <span className="text-sm font-semibold">API Key activa</span>
            <Select className="mt-2" {...form.register("ai_key_id")}>
              {activeKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.label || "Sin etiqueta"} - {providerLabels[key.provider]} - {maskedKey(key.key_last_four)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Tipo de análisis</span>
            <Select className="mt-2" {...form.register("analysis_type")}>
              {analysisTypes.map((type) => (
                <option key={type} value={type}>
                  {analysisLabels[type]}
                </option>
              ))}
            </Select>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{analysisDescriptions[analysisType]}</p>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Modelo opcional</span>
            <Input
              className="mt-2"
              placeholder={selectedKey ? providerHints[selectedKey.provider] : "gemini-1.5-flash"}
              {...form.register("model_name")}
            />
          </label>
          {analysisType === "CUSTOM" ? (
            <label className="block">
              <span className="text-sm font-semibold">Pregunta personalizada</span>
              <Textarea
                className="mt-2"
                placeholder="Que riesgos deberia priorizar antes de invertir en adquisicion?"
                {...form.register("custom_question")}
              />
              {form.formState.errors.custom_question ? (
                <p className="mt-1 text-xs font-medium text-destructive">{form.formState.errors.custom_question.message}</p>
              ) : null}
            </label>
          ) : null}
          <Button type="submit" disabled={mutation.isPending || !activeKeys.length}>
            <Sparkles className="h-4 w-4" />
            {mutation.isPending ? "Generando..." : "Generar análisis IA"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

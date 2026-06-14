"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrainCircuit, Coins, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listAiKeys, listAiKeyModels } from "@/features/ai-keys/api";
import { listAiAnalyses } from "@/features/ai-analyses/api";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/auth/use-auth";
import { AiKey } from "@/features/ai-keys/types";
import { providerHints, providerLabels, providerModels } from "@/features/ai-keys/constants";
import { maskedKey } from "@/features/ai-keys/utils";
import { ByokOnboardingModal } from "@/features/ai-keys/components/byok-onboarding-modal";
import { analysisDescriptions, analysisLabels, analysisTypes } from "@/features/ai-analyses/constants";
import { aiAnalysisSchema, AiAnalysisFormValues } from "@/features/ai-analyses/schemas";

export function AiAnalysisModal({
  isOpen,
  onClose,
  projectId,
  projectStage,
  latestSnapshotId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectStage: string;
  latestSnapshotId?: string;
}) {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const keysQuery = useQuery({ queryKey: ["ai-keys"], queryFn: listAiKeys, enabled: isOpen });
  const { data: currentUser } = useCurrentUser();
  const activeKeys = keysQuery.data?.items.filter((key) => key.is_active) ?? [];

  const hasCredits = (currentUser?.ai_credits ?? 0) > 0;
  const firstKey = activeKeys[0];
  const isPlanning = projectStage === "PLANNING" || projectStage === "IDEA";

  const form = useForm<AiAnalysisFormValues>({
    resolver: zodResolver(aiAnalysisSchema),
    defaultValues: {
      ai_key_id: firstKey?.id || "",
      analysis_type: isPlanning ? "FULL_DIAGNOSIS" : "FULL_DIAGNOSIS",
      model_name: firstKey ? providerHints[firstKey.provider] : "",
      custom_question: "",
    },
  });

  const selectedKeyId = useWatch({ control: form.control, name: "ai_key_id" });
  const analysisType = useWatch({ control: form.control, name: "analysis_type" });
  const selectedKey = useMemo(
    () => activeKeys.find((key) => key.id === selectedKeyId) || firstKey,
    [activeKeys, firstKey, selectedKeyId]
  );

  const dynamicModelsQuery = useQuery({
    queryKey: ["ai-key-models", selectedKeyId],
    queryFn: () => listAiKeyModels(selectedKeyId as string),
    enabled: !!selectedKeyId && selectedKey?.provider !== "ANTHROPIC",
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const analysesQuery = useQuery({
    queryKey: ["ai-analyses", projectId],
    queryFn: () => listAiAnalyses(projectId),
    enabled: isOpen,
  });

  const onSubmit = (values: AiAnalysisFormValues) => {
    // Evitar generar un análisis repetido si ya existe para este snapshot (o para el proyecto en planeación)
    if (values.analysis_type !== "CUSTOM" && analysesQuery.data) {
      const existing = analysesQuery.data.items.find((a) => {
        if (a.analysis_type !== values.analysis_type) return false;
        if (isPlanning) return true; // En planeación, cualquier análisis previo del mismo tipo es válido
        // En implementación, solo reutilizar si es del mismo snapshot
        return a.metric_snapshot_id === latestSnapshotId;
      });

      if (existing) {
        onClose();
        router.push(`/projects/${projectId}/ai-analysis/${existing.id}`);
        return;
      }
    }

    // Generar el ID desde el cliente para navegar inmediatamente
    const analysisId = crypto.randomUUID();

    // Redirect to the final view with stream=true
    const params = new URLSearchParams({
      stream: "true",
      keyId: values.ai_key_id,
      type: isPlanning ? "FULL_DIAGNOSIS" : values.analysis_type,
    });
    if (values.model_name) params.append("model", values.model_name);
    if (values.custom_question && !isPlanning && values.analysis_type === "CUSTOM") {
      params.append("q", values.custom_question);
    }
    
    onClose();
    router.push(`/projects/${projectId}/ai-analysis/${analysisId}?${params.toString()}`);
  };

  if (keysQuery.isLoading) {
    return null; // Or a simple loading spinner dialog
  }

  // No BYOK keys and no credits → show BYOK onboarding
  if (!activeKeys.length && keysQuery.isSuccess && !hasCredits) {
    return (
      <>
        <Dialog open={isOpen && !showOnboarding} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créditos agotados</DialogTitle>
              <DialogDescription>
                No tienes créditos disponibles ni una API Key configurada. Activa tu propia key gratuita en minutos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={onClose}>Cerrar</Button>
              <Button onClick={() => setShowOnboarding(true)} className="bg-primary text-primary-foreground hover:opacity-90">
                Cómo obtener una key gratis
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <ByokOnboardingModal isOpen={showOnboarding} onClose={() => { setShowOnboarding(false); onClose(); }} />
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] border-2 border-primary/30 bg-primary/10 p-2.5 text-primary shadow-[4px_4px_0_rgba(var(--primary),0.1)]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isPlanning ? "Analizar viabilidad" : "Generar análisis"}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {isPlanning 
                  ? "¿Listo para que la IA evalúe la viabilidad de tu idea?" 
                  : "Usa tus métricas reales para obtener insights con IA."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {!isPlanning && (
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-mono mb-1.5 flex items-center gap-1.5">
                <span className="text-primary">&gt;</span> Tipo de análisis
              </span>
              <Select className="w-full" {...form.register("analysis_type")}>
                {analysisTypes.map((type) => (
                  <option key={type} value={type}>
                    {analysisLabels[type]}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-[10px] font-mono text-muted-foreground uppercase">{analysisDescriptions[analysisType]}</p>
            </label>
          )}

          {!isPlanning && analysisType === "CUSTOM" && (
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-mono mb-1.5 flex items-center gap-1.5">
                <span className="text-primary">&gt;</span> Tu pregunta
              </span>
              <Textarea
                className="w-full"
                placeholder="Ej: ¿Qué riesgos debería priorizar antes de invertir en adquisición?"
                rows={3}
                {...form.register("custom_question")}
              />
              {form.formState.errors.custom_question && (
                <p className="mt-1.5 text-[10px] font-mono text-destructive uppercase">{form.formState.errors.custom_question.message}</p>
              )}
            </label>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-mono mb-1.5 flex items-center gap-1.5">
                <span className="text-primary">&gt;</span> API Key
              </span>
              <Select className="w-full" {...form.register("ai_key_id")}>
                {hasCredits && (
                  <option value="">
                    Créditos del sistema ({currentUser?.ai_credits ?? 0} restantes)
                  </option>
                )}
                {activeKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {providerLabels[key.provider]} ({maskedKey(key.key_last_four)})
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-mono mb-1.5 flex items-center gap-1.5">
                <span className="text-primary">&gt;</span> Modelo (opcional)
              </span>
              {dynamicModelsQuery.isLoading ? (
                <div className="h-10 w-full rounded-[6px] border-2 border-border/60 bg-background/50 px-3 flex items-center text-[10px] font-mono text-muted-foreground uppercase">
                  Cargando modelos...
                </div>
              ) : selectedKey && (dynamicModelsQuery.data?.items?.length || providerModels[selectedKey.provider]?.length > 0) ? (
                <Select className="w-full" {...form.register("model_name")}>
                  <option value="">-- Autoselección --</option>
                  {((dynamicModelsQuery.data?.items?.length ? dynamicModelsQuery.data.items : null) || providerModels[selectedKey.provider]).map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  className="w-full"
                  placeholder={selectedKey ? providerHints[selectedKey.provider] : ""}
                  {...form.register("model_name")}
                />
              )}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Iniciar análisis
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

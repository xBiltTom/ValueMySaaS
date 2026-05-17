"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { AiKey } from "@/features/ai-keys/types";
import { providerHints, providerLabels } from "@/features/ai-keys/constants";
import { maskedKey } from "@/features/ai-keys/utils";
import { sendConversationMessage } from "@/features/conversations/api";
import { sendMessageSchema, SendMessageFormValues } from "@/features/conversations/schemas";
import { suggestedQuestions } from "@/features/conversations/utils";

export function ChatInputForm({
  projectId,
  conversationId,
  activeKeys,
}: {
  projectId: string;
  conversationId: string;
  activeKeys: AiKey[];
}) {
  const queryClient = useQueryClient();
  const firstKey = activeKeys[0];
  const form = useForm<SendMessageFormValues>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      ai_key_id: firstKey?.id || "",
      model_name: firstKey ? providerHints[firstKey.provider] : "",
      message: "",
    },
  });

  const selectedKeyId = useWatch({ control: form.control, name: "ai_key_id" });
  const selectedKey = useMemo(
    () => activeKeys.find((key) => key.id === selectedKeyId) || firstKey,
    [activeKeys, firstKey, selectedKeyId],
  );

  const mutation = useMutation({
    mutationFn: (values: SendMessageFormValues) =>
      sendConversationMessage(projectId, conversationId, {
        ai_key_id: values.ai_key_id,
        model_name: values.model_name || null,
        message: values.message,
      }),
    onSuccess: async () => {
      const currentKey = form.getValues("ai_key_id");
      const currentModel = form.getValues("model_name");
      form.reset({ ai_key_id: currentKey, model_name: currentModel, message: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversation-messages", projectId, conversationId] }),
        queryClient.invalidateQueries({ queryKey: ["conversation", projectId, conversationId] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", projectId] }),
      ]);
    },
  });

  return (
    <Card className="p-4">
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        {mutation.isError ? (
          <ErrorState
            title="No se pudo enviar el mensaje"
            message={`${getApiErrorMessage(mutation.error)}. Verifica que la API Key esté activa, que el modelo sea compatible y vuelve a intentarlo.`}
          />
        ) : null}
        <div className="grid gap-3 lg:grid-cols-2">
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
            <span className="text-sm font-semibold">Modelo opcional</span>
            <Input
              className="mt-2"
              placeholder={selectedKey ? providerHints[selectedKey.provider] : "gemini-1.5-flash"}
              {...form.register("model_name")}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              onClick={() => form.setValue("message", question, { shouldValidate: true })}
            >
              {question}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-sm font-semibold">Mensaje</span>
          <Textarea
            className="mt-2 min-h-32"
            placeholder="¿Qué significa que mi churn esté alto y qué debería mejorar primero?"
            {...form.register("message")}
          />
          {form.formState.errors.message ? (
            <p className="mt-1 text-xs font-medium text-destructive">{form.formState.errors.message.message}</p>
          ) : null}
        </label>
        <Button type="submit" disabled={mutation.isPending || !activeKeys.length}>
          <Send className="h-4 w-4" />
          {mutation.isPending ? "Pensando..." : "Enviar mensaje"}
        </Button>
      </form>
    </Card>
  );
}

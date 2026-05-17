"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Nueva conversación</CardTitle>
        <CardDescription>Define un foco para conversar sobre tu SaaS.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          {mutation.isError ? (
            <ErrorState title="No se pudo crear la conversación" message={getApiErrorMessage(mutation.error)} />
          ) : null}
          <label className="block">
            <span className="text-sm font-semibold">Titulo</span>
            <Input className="mt-2" placeholder="Diagnóstico de retención" {...form.register("title")} />
          </label>
          <Button type="submit" disabled={mutation.isPending}>
            <Plus className="h-4 w-4" />
            {mutation.isPending ? "Creando..." : "Crear conversación"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

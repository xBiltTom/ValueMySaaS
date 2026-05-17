"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatEnum } from "@/lib/utils";
import { createProject } from "@/features/projects/api";
import {
  businessModels,
  categories,
  createProjectSchema,
  CreateProjectFormValues,
  stages,
} from "@/features/projects/schemas";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{message}</p>;
}

export function ProjectForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "PRODUCTIVITY",
      stage: "IDEA",
      business_model: "SUBSCRIPTION",
      target_market: "",
      target_audience: "",
      main_problem: "",
      value_proposition: "",
      current_price: 0,
      currency: "USD",
    },
  });

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate({
      ...values,
      country_focus: "Peru",
      pricing_notes: "",
      is_public_sample: false,
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {mutation.isError ? <ErrorState message={getApiErrorMessage(mutation.error)} /> : null}

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Identidad del SaaS</h2>
        <div className="mt-4 field-grid">
          <label className="block">
            <span className="text-sm font-semibold">Nombre</span>
            <Input className="mt-2" placeholder="StudyFlow AI" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Precio actual</span>
            <Input
              className="mt-2"
              type="number"
              step="0.01"
              min="0"
              {...form.register("current_price", { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.current_price?.message} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Moneda</span>
            <Input className="mt-2" maxLength={10} {...form.register("currency")} />
            <FieldError message={form.formState.errors.currency?.message} />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold">Descripcion</span>
          <Textarea className="mt-2" placeholder="Que hace tu SaaS y para quien existe." {...form.register("description")} />
        </label>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Modelo y etapa</h2>
        <div className="mt-4 field-grid">
          <label className="block">
            <span className="text-sm font-semibold">Categoria</span>
            <Select className="mt-2" {...form.register("category")}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {formatEnum(item)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Etapa</span>
            <Select className="mt-2" {...form.register("stage")}>
              {stages.map((item) => (
                <option key={item} value={item}>
                  {formatEnum(item)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Modelo de negocio</span>
            <Select className="mt-2" {...form.register("business_model")}>
              {businessModels.map((item) => (
                <option key={item} value={item}>
                  {formatEnum(item)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Valor y mercado</h2>
        <div className="mt-4 field-grid">
          <label className="block">
            <span className="text-sm font-semibold">Mercado objetivo</span>
            <Input className="mt-2" placeholder="Estudiantes universitarios" {...form.register("target_market")} />
            <FieldError message={form.formState.errors.target_market?.message} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Audiencia objetivo</span>
            <Input className="mt-2" placeholder="Estudiantes de ingenieria" {...form.register("target_audience")} />
            <FieldError message={form.formState.errors.target_audience?.message} />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Problema principal</span>
            <Textarea className="mt-2" {...form.register("main_problem")} />
            <FieldError message={form.formState.errors.main_problem?.message} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Propuesta de valor</span>
            <Textarea className="mt-2" {...form.register("value_proposition")} />
            <FieldError message={form.formState.errors.value_proposition?.message} />
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push("/projects")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          <Save className="h-4 w-4" />
          {mutation.isPending ? "Creando..." : "Crear SaaS"}
        </Button>
      </div>
    </form>
  );
}

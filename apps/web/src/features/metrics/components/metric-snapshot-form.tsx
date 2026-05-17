"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { createMetricSnapshot } from "@/features/metrics/api";
import { metricSnapshotSchema, MetricSnapshotFormValues } from "@/features/metrics/schemas";
import { MetricSectionCard } from "@/features/metrics/components/metric-section-card";

function Field({
  label,
  type = "number",
  register,
  error,
}: {
  label: string;
  type?: string;
  register: ReturnType<typeof useForm<MetricSnapshotFormValues>>["register"];
  error?: string;
}) {
  const name = label;
  const options =
    type === "number"
      ? {
          setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
        }
      : undefined;
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <Input
        className="mt-2"
        type={type}
        step={type === "number" ? "0.01" : undefined}
        {...register(name as keyof MetricSnapshotFormValues, options)}
      />
      {error ? <p className="mt-1 text-xs font-medium text-destructive">{error}</p> : null}
    </label>
  );
}

export function MetricSnapshotForm({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const form = useForm<MetricSnapshotFormValues>({
    resolver: zodResolver(metricSnapshotSchema),
    defaultValues: {
      period_label: "",
      captured_at: new Date().toISOString().slice(0, 16),
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: MetricSnapshotFormValues) =>
      createMetricSnapshot(projectId, {
        ...values,
        captured_at: values.captured_at ? new Date(values.captured_at).toISOString() : new Date().toISOString(),
      }),
    onSuccess: async () => {
      form.reset({ period_label: "", captured_at: new Date().toISOString().slice(0, 16), notes: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["metric-snapshots", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["project-dashboard", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["metric-calculations", projectId, "latest"] }),
      ]);
    },
  });

  const errors = form.formState.errors;

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      {mutation.isSuccess ? (
        <div className="rounded-md border border-primary/20 bg-primary/10 p-4 text-sm font-semibold text-primary">
          Snapshot creado. Ya puedes generar diagnostico con el ultimo registro.
        </div>
      ) : null}
      {mutation.isError ? <ErrorState message={getApiErrorMessage(mutation.error)} /> : null}

      <MetricSectionCard title="Periodo" description="Define a que corte pertenecen los datos.">
        <label className="block">
          <span className="text-sm font-semibold">period_label</span>
          <Input className="mt-2" placeholder="Marzo 2026" {...form.register("period_label")} />
          {errors.period_label ? <p className="mt-1 text-xs font-medium text-destructive">{errors.period_label.message}</p> : null}
        </label>
        <Field label="captured_at" type="datetime-local" register={form.register} />
      </MetricSectionCard>

      <MetricSectionCard title="Finanzas" description="Ingresos, costos y combustible para operar.">
        {(["mrr", "monthly_revenue", "monthly_costs", "cash_available", "marketing_spend"] as const).map((name) => (
          <Field key={name} label={name} register={form.register} error={errors[name]?.message} />
        ))}
      </MetricSectionCard>

      <MetricSectionCard title="Usuarios y adquisicion" description="Volumen, activacion y clientes de pago.">
        {(["total_users", "active_users", "paying_customers", "new_users", "new_paying_customers"] as const).map((name) => (
          <Field key={name} label={name} register={form.register} error={errors[name]?.message} />
        ))}
      </MetricSectionCard>

      <MetricSectionCard title="Retencion y operacion" description="Riesgo de salida y salud operacional.">
        {(["churned_customers", "nps", "support_tickets", "critical_bugs", "uptime_percentage"] as const).map((name) => (
          <Field key={name} label={name} register={form.register} error={errors[name]?.message} />
        ))}
      </MetricSectionCard>

      <MetricSectionCard title="Notas" description="Contexto cualitativo del periodo.">
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold">notes</span>
          <Textarea className="mt-2" {...form.register("notes")} />
        </label>
      </MetricSectionCard>

      <Button type="submit" disabled={mutation.isPending}>
        <Save className="h-4 w-4" />
        {mutation.isPending ? "Guardando..." : "Guardar snapshot"}
      </Button>
    </form>
  );
}

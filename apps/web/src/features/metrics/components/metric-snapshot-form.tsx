"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { 
  Save, Lightbulb, TrendingUp, Users, Shield, CheckCircle2,
  Info, DollarSign, BarChart3, HelpCircle, Rocket
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { createMetricSnapshot } from "@/features/metrics/api";
import { metricSnapshotSchema, MetricSnapshotFormValues } from "@/features/metrics/schemas";
import { cn } from "@/lib/utils";

function FieldHelp({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-1">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/40 cursor-help inline align-middle" />
      <span className="pointer-events-none absolute left-0 top-5 z-50 hidden w-52 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

function FieldLabel({ children, help }: { children: React.ReactNode; help?: string }) {
  return (
    <span className="block text-sm font-bold text-foreground mb-2">
      {children} {help && <FieldHelp text={help} />}
    </span>
  );
}

function NumberInput({ label, help, placeholder, register, name, errors, integer = false }: {
  label: string; help?: string; placeholder?: string;
  register: any; name: any; errors: any; integer?: boolean;
}) {
  const options = { setValueAs: (v: string) => v === "" ? undefined : (integer ? parseInt(v, 10) : parseFloat(v)) };
  return (
    <label className="block">
      <FieldLabel help={help}>{label}</FieldLabel>
      <input
        type="number" step={integer ? "1" : "0.01"} min="0"
        placeholder={placeholder || "0"}
        className={cn(
          "w-full rounded-2xl border bg-background px-4 py-3.5 text-base text-foreground",
          "placeholder:text-muted-foreground/40 outline-none transition-all",
          "focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]",
          errors[name] ? "border-status-danger-border" : "border-border"
        )}
        {...register(name, options)}
      />
      {errors[name] && <p className="mt-1 text-xs text-status-danger-fg font-semibold">{errors[name].message}</p>}
    </label>
  );
}

function Section({ 
  icon: Icon, title, description, color = "primary", children 
}: { 
  icon: React.ElementType; title: string; description?: string; 
  color?: "primary" | "amber" | "emerald" | "violet"; children: React.ReactNode 
}) {
  const colors = {
    primary: { bg: "bg-primary/5 border-primary/15", icon: "bg-primary/10 text-primary", title: "text-foreground" },
    amber: { bg: "bg-status-warning-bg border-status-warning-border/60", icon: "bg-status-warning-bg text-status-warning-fg", title: "text-status-warning-text" },
    emerald: { bg: "bg-status-success-bg border-status-success-border/60", icon: "bg-status-success-bg text-status-success-fg", title: "text-status-success-text" },
    violet: { bg: "bg-accent/5 border-accent/20", icon: "bg-accent/10 text-foreground", title: "text-foreground" },
  };
  const c = colors[color];
  return (
    <div className={cn("rounded-3xl border p-5 md:p-6 space-y-5", c.bg)}>
      <div className="flex items-start gap-3">
        <div className={cn("rounded-xl p-2.5 shrink-0", c.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className={cn("font-bold text-base", c.title)}>{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export function MetricSnapshotForm({ projectId, projectStage = "LAUNCHED" }: { projectId: string; projectStage?: string }) {
  const queryClient = useQueryClient();
  const form = useForm<MetricSnapshotFormValues>({
    resolver: zodResolver(metricSnapshotSchema),
    defaultValues: { period_label: "", captured_at: new Date().toISOString().slice(0, 16), notes: "" },
  });

  const isPlanning = projectStage === "PLANNING" || projectStage === "IDEA";
  const errors = form.formState.errors;
  const reg = form.register;

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={cn(
        "rounded-3xl border p-5 md:p-6",
        isPlanning
          ? "border-status-warning-border/60 bg-gradient-to-br from-status-warning-bg to-card"
          : "border-primary/20 bg-gradient-to-br from-primary/5 to-card"
      )}>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("rounded-2xl p-3", isPlanning ? "bg-status-warning-bg" : "bg-primary/10")}>
            {isPlanning ? <Lightbulb className="h-6 w-6 text-status-warning-fg" /> : <BarChart3 className="h-6 w-6 text-primary" />}
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">
              {isPlanning ? "Registrar estimaciones" : "Registrar snapshot de métricas"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPlanning
                ? "Ingresa tus proyecciones financieras para evaluar la viabilidad de tu idea"
                : "Captura el estado actual de tu SaaS para análisis y seguimiento"}
            </p>
          </div>
        </div>
        {isPlanning && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-status-warning-border/60 bg-card/70 p-3">
            <Info className="h-4 w-4 text-status-warning-fg shrink-0 mt-0.5" />
            <p className="text-xs text-status-warning-text leading-relaxed">
              Para proyectos en planeación, solo necesitas tus <strong>costos estimados</strong> y <strong>notas del periodo</strong>. El análisis de viabilidad lo hace la <strong>IA</strong> con tu propuesta de valor.
            </p>
          </div>
        )}
      </div>

      {/* Success state */}
      {mutation.isSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-status-success-border bg-status-success-bg px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-status-success-fg shrink-0" />
          <div>
            <p className="text-sm font-bold text-status-success-text">
              {isPlanning ? "Estimaciones guardadas" : "Snapshot registrado exitosamente"}
            </p>
            <p className="text-xs text-status-success-text mt-0.5">
              {isPlanning
                ? "Ahora ve a 'Análisis IA' para evaluar la viabilidad de tu proyecto."
                : "Ya puedes generar un score diagnóstico desde el dashboard."}
            </p>
          </div>
        </div>
      )}
      {mutation.isError ? <ErrorState message={getApiErrorMessage(mutation.error)} /> : null}

      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        {/* Period */}
        <Section icon={isPlanning ? Lightbulb : BarChart3} title="Periodo" description="¿A qué mes o corte corresponden estos datos?" color={isPlanning ? "amber" : "primary"}>
          <div className="sm:col-span-2">
            <FieldLabel>Nombre del periodo</FieldLabel>
            <input
              className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_4px_var(--ring)]"
              placeholder={isPlanning ? "Ej: Junio 2026 (estimación)" : "Ej: Junio 2026"}
              {...reg("period_label")}
            />
            {errors.period_label && <p className="mt-1 text-xs text-status-danger-fg font-semibold">{errors.period_label.message}</p>}
          </div>
          {!isPlanning && (
            <div className="sm:col-span-2">
              <FieldLabel help="Cuándo tomaste estas métricas">Fecha de captura</FieldLabel>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_4px_var(--ring)]"
                {...reg("captured_at")}
              />
            </div>
          )}
        </Section>

        {/* Finances */}
        <Section
          icon={DollarSign}
          title={isPlanning ? "Costos estimados" : "Finanzas"}
          description={isPlanning
            ? "¿Cuánto estimas que costará operar tu SaaS mensualmente?"
            : "Ingresos, gastos y caja disponible de este periodo"}
          color={isPlanning ? "amber" : "emerald"}
        >
          {isPlanning ? (
            <>
              <NumberInput
                label="Costos operativos (S/ o $)"
                help="Servidores, APIs, herramientas, etc."
                placeholder="Ej: 50"
                register={reg} name="monthly_costs" errors={errors}
              />
              <div className="sm:col-span-1">
                <FieldLabel help="Anotaciones sobre tu planificación financiera">Notas del periodo</FieldLabel>
                <textarea
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary focus:shadow-[0_0_0_4px_var(--ring)] resize-none"
                  placeholder="Ej: Estimación inicial. Usaré Supabase gratis + Vercel..."
                  {...reg("notes")}
                />
              </div>
            </>
          ) : (
            <>
              <NumberInput label="MRR (Ingresos recurrentes)" help="Lo que ganas seguro cada mes de suscripciones activas" placeholder="0.00" register={reg} name="mrr" errors={errors} />
              <NumberInput label="Ingresos totales del mes" help="Todo lo que entró (incluye ventas únicas, uno-a-uno, etc.)" placeholder="0.00" register={reg} name="monthly_revenue" errors={errors} />
              <NumberInput label="Gastos operativos" help="Servidores, APIs, personal, marketing, etc." placeholder="0.00" register={reg} name="monthly_costs" errors={errors} />
              <NumberInput label="Caja disponible" help="Efectivo o saldo en cuenta bancaria del proyecto" placeholder="0.00" register={reg} name="cash_available" errors={errors} />
              <NumberInput label="Gasto en marketing" help="Anuncios, influencers, afiliados" placeholder="0.00" register={reg} name="marketing_spend" errors={errors} />
            </>
          )}
        </Section>

        {/* Users (only launched) */}
        {!isPlanning && (
          <Section icon={Users} title="Usuarios y adquisición" description="Volumen, activación y clientes de pago del periodo" color="violet">
            <NumberInput label="Usuarios registrados" help="Total histórico de cuentas creadas" placeholder="0" register={reg} name="total_users" errors={errors} integer />
            <NumberInput label="Usuarios activos" help="Usuarios que usaron tu app este mes" placeholder="0" register={reg} name="active_users" errors={errors} integer />
            <NumberInput label="Clientes de pago" help="Personas que pagan actualmente por tu servicio" placeholder="0" register={reg} name="paying_customers" errors={errors} integer />
            <NumberInput label="Usuarios nuevos" help="Cuentas creadas este mes" placeholder="0" register={reg} name="new_users" errors={errors} integer />
            <NumberInput label="Nuevos clientes de pago" help="Gente que empezó a pagar este mes" placeholder="0" register={reg} name="new_paying_customers" errors={errors} integer />
            <NumberInput label="Clientes perdidos (Churn)" help="Gente que canceló este mes" placeholder="0" register={reg} name="churned_customers" errors={errors} integer />
          </Section>
        )}

        {/* Product health (only launched) */}
        {!isPlanning && (
          <Section icon={Shield} title="Salud del producto" description="Satisfacción, soporte y disponibilidad técnica" color="primary">
            <NumberInput label="NPS (-100 a 100)" help="¿Del -100 al 100 cuánto te recomiendan? Encuesta corta a usuarios" placeholder="0" register={reg} name="nps" errors={errors} />
            <NumberInput label="Tickets de soporte" help="Cuántas quejas o consultas recibiste este mes" placeholder="0" register={reg} name="support_tickets" errors={errors} integer />
            <NumberInput label="Bugs críticos" help="Errores graves que tumaron la app o funciones clave" placeholder="0" register={reg} name="critical_bugs" errors={errors} integer />
            <NumberInput label="Disponibilidad (%)" help="Ej: 99.9 — tiempo que tu app estuvo online" placeholder="99.9" register={reg} name="uptime_percentage" errors={errors} />
          </Section>
        )}

        {/* Notes (launched) */}
        {!isPlanning && (
          <Section icon={Lightbulb} title="Notas del periodo" description="Contexto sobre eventos importantes este mes" color="primary">
            <div className="sm:col-span-2">
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary focus:shadow-[0_0_0_4px_var(--ring)] resize-none"
                placeholder="Ej: Lanzamos v2.0, corrección de bug crítico, nuevo cliente enterprise..."
                {...reg("notes")}
              />
            </div>
          </Section>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className={cn(
            "w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg",
            isPlanning
              ? "bg-gradient-to-r from-status-warning-fg to-primary shadow-status-warning-bg"
              : "bg-primary shadow-primary/25"
          )}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Guardando...</span>
          ) : (
            <>
              {isPlanning ? <Lightbulb className="h-5 w-5" /> : <Save className="h-5 w-5" />}
              {isPlanning ? "Guardar estimaciones" : "Guardar snapshot"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

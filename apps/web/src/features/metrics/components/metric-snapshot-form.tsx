"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { 
  Save, Lightbulb, TrendingUp, Users, Shield, CheckCircle2,
  Info, DollarSign, BarChart3, HelpCircle, Rocket, TerminalSquare
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { createMetricSnapshot } from "@/features/metrics/api";
import { metricSnapshotSchema, MetricSnapshotFormValues } from "@/features/metrics/schemas";
import { cn } from "@/lib/utils";

function FieldHelp({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-2 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help transition-colors group-hover:text-primary" />
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden w-64 rounded-[8px] border border-border/60 bg-card/95 backdrop-blur-md p-3 text-[11px] font-mono leading-relaxed text-foreground shadow-2xl group-hover:block uppercase">
        {text}
        {/* Triángulo del tooltip */}
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border/60"></span>
      </span>
    </span>
  );
}

function FieldLabel({ children, help }: { children: React.ReactNode; help?: string }) {
  return (
    <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
      <span className="text-primary mr-2">&gt;</span>
      {children}
      {help && <FieldHelp text={help} />}
    </span>
  );
}

function NumberInput({ label, help, placeholder, register, name, errors, integer = false }: {
  label: string; help?: string; placeholder?: string;
  register: any; name: any; errors: any; integer?: boolean;
}) {
  const options = { setValueAs: (v: string) => v === "" ? undefined : (integer ? parseInt(v, 10) : parseFloat(v)) };
  return (
    <label className="block group">
      <FieldLabel help={help}>{label}</FieldLabel>
      <div className="relative">
        <input
          type="number" step={integer ? "1" : "0.01"} min="0"
          placeholder={placeholder || "0"}
          className={cn(
            "w-full rounded-[12px] border bg-background/90 dark:bg-background/50 shadow-sm dark:shadow-none backdrop-blur-sm px-4 py-3.5 text-lg font-mono font-bold text-foreground",
            "placeholder:text-muted-foreground/30 outline-none transition-all",
            "focus:border-primary focus:bg-background focus:shadow-[0_0_20px_rgba(var(--primary),0.15)]",
            errors[name] ? "border-status-danger-border focus:border-status-danger-border focus:shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "border-border/80 dark:border-border/40 hover:border-border"
          )}
          {...register(name, options)}
        />
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-primary/20 rounded-tr-[12px] opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
      </div>
      {errors[name] && <p className="mt-2 text-[10px] font-mono uppercase text-status-danger-fg">ERR: {errors[name].message}</p>}
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
    primary: { bg: "bg-primary/5 border-primary/20", icon: "text-primary", title: "text-primary", glow: "shadow-[0_0_15px_rgba(var(--primary),0.05)]" },
    amber: { bg: "bg-status-warning-bg/10 border-status-warning-border/40", icon: "text-status-warning-fg", title: "text-status-warning-fg", glow: "shadow-[0_0_15px_rgba(245,158,11,0.05)]" },
    emerald: { bg: "bg-status-success-bg/10 border-status-success-border/40", icon: "text-status-success-fg", title: "text-status-success-fg", glow: "shadow-[0_0_15px_rgba(16,185,129,0.05)]" },
    violet: { bg: "bg-accent/5 border-accent/20", icon: "text-accent", title: "text-accent", glow: "shadow-[0_0_15px_rgba(var(--accent),0.05)]" },
  };
  const c = colors[color];
  return (
    <div className={cn("relative overflow-hidden rounded-[20px] border p-6 md:p-8 space-y-6 backdrop-blur-md", c.bg, c.glow)}>
      {/* Abstract background elements */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
        <Icon className="h-48 w-48 -mt-12 -mr-12" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 justify-between border-b border-border/30 pb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-background/50 border border-border/40 p-2 shrink-0">
            <Icon className={cn("h-5 w-5", c.icon)} />
          </div>
          <div>
            <h3 className={cn("font-black uppercase tracking-widest text-[13px]", c.title)}>SYS_MODULE: {title}</h3>
            {description && <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">{description}</p>}
          </div>
        </div>
      </div>
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">{children}</div>
    </div>
  );
}

export function MetricSnapshotForm({ projectId, projectStage = "LAUNCHED" }: { projectId: string; projectStage?: string }) {
  const queryClient = useQueryClient();
  const form = useForm<MetricSnapshotFormValues>({
    resolver: zodResolver(metricSnapshotSchema),
    defaultValues: { period_label: "", captured_at: new Date().toISOString().slice(0, 16), notes: "", custom_metrics: {} },
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
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(
        "relative overflow-hidden rounded-[20px] border p-6 md:p-8 backdrop-blur-xl shadow-sm",
        isPlanning
          ? "border-status-warning-border/60 bg-status-warning-bg/10"
          : "border-primary/30 bg-primary/5"
      )}>
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4 mb-2">
          <div className={cn("rounded-[12px] p-3 shadow-inner border", isPlanning ? "bg-status-warning-bg border-status-warning-fg/30" : "bg-primary/10 border-primary/30")}>
            {isPlanning ? <Lightbulb className="h-6 w-6 text-status-warning-fg" /> : <BarChart3 className="h-6 w-6 text-primary" />}
          </div>
          <div>
            <h2 className="text-xl font-display font-black uppercase tracking-tight">
              {isPlanning ? "Input_Estimations()" : "Record_Snapshot()"}
            </h2>
            <p className="text-[11px] font-mono text-muted-foreground mt-1 uppercase">
              {isPlanning
                ? "> Ingresa proyecciones financieras para evaluar la viabilidad."
                : "> Captura el estado actual para análisis y seguimiento."}
            </p>
          </div>
        </div>
        {isPlanning && (
          <div className="relative z-10 mt-6 flex items-start gap-3 rounded-[12px] border border-status-warning-border/60 bg-status-warning-bg/70 px-4 py-3 shadow-inner">
            <Info className="h-4 w-4 text-status-warning-fg shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-[11px] font-mono text-status-warning-text leading-relaxed uppercase">
                [SYS_INFO]: Estima los <strong>costos, tiempo e inversión</strong> que necesitarás. La IA evalúa la viabilidad en base a esto.
              </p>
              <p className="text-[10px] font-mono text-status-warning-text/70 leading-relaxed uppercase">
                * Valores nulos omiten esa variable en el análisis, restando precisión.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Success state */}
      {mutation.isSuccess && (
        <div className="relative overflow-hidden flex items-start gap-4 rounded-[20px] border border-status-success-border/60 bg-status-success-bg px-6 py-5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <CheckCircle2 className="h-6 w-6 text-status-success-fg shrink-0" />
          <div>
            <p className="text-[13px] font-black uppercase tracking-widest text-status-success-text mb-1">
              {isPlanning ? "SYS_STATUS: ESTIMACIONES_OK" : "SYS_STATUS: SNAPSHOT_OK"}
            </p>
            <p className="text-[11px] font-mono text-status-success-text/80 uppercase">
              {isPlanning
                ? "> Transición a 'Análisis IA' disponible."
                : "> Datos inyectados. Score diagnóstico listo."}
            </p>
          </div>
        </div>
      )}
      {mutation.isError ? <ErrorState message={getApiErrorMessage(mutation.error)} /> : null}

      <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        {/* Period */}
        <Section icon={isPlanning ? Lightbulb : BarChart3} title="Periodo_Identificador" description="Mes o corte de datos" color={isPlanning ? "amber" : "primary"}>
          <div className="sm:col-span-2">
            <FieldLabel>Nombre del periodo</FieldLabel>
            <div className="relative">
              <input
                  className="w-full rounded-[12px] border border-border/80 dark:border-border/40 bg-background/90 dark:bg-background/50 shadow-sm dark:shadow-none backdrop-blur-sm px-4 py-3.5 text-base font-mono font-bold outline-none transition-all focus:border-primary focus:bg-background focus:shadow-[0_0_20px_rgba(var(--primary),0.15)] hover:border-border"
                placeholder={isPlanning ? "Ej: Junio 2026_EST" : "Ej: Q2_2026"}
                {...reg("period_label")}
              />
              <div className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-primary/20 rounded-tr-[12px] opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
            {errors.period_label && <p className="mt-2 text-[10px] font-mono uppercase text-status-danger-fg">ERR: {errors.period_label.message}</p>}
          </div>
          {!isPlanning && (
            <div className="sm:col-span-2">
              <FieldLabel help="Momento exacto de lectura de datos">Timestamp de captura</FieldLabel>
              <div className="relative">
                <input
                  type="datetime-local"
                    className="w-full rounded-[12px] border border-border/80 dark:border-border/40 bg-background/90 dark:bg-background/50 shadow-sm dark:shadow-none backdrop-blur-sm px-4 py-3.5 text-base font-mono font-bold outline-none transition-all focus:border-primary focus:bg-background focus:shadow-[0_0_20px_rgba(var(--primary),0.15)] hover:border-border"
                  {...reg("captured_at")}
                />
              </div>
            </div>
          )}
        </Section>

        {/* Finances */}
        <Section
          icon={DollarSign}
          title={isPlanning ? "METRICAS_FINANCIERAS_ESTIMADAS" : "FLUJO_DE_CAJA_Y_RENTABILIDAD"}
          description={isPlanning
            ? "Proyección de costos pre-lanzamiento"
            : "Lecturas financieras reales del periodo"}
          color={isPlanning ? "amber" : "emerald"}
        >
          {isPlanning ? (
            <>
              <NumberInput
                label="OPEX Mensual ($)"
                help="Servidores, dominios, APIs estimadas..."
                placeholder="50.00"
                register={reg} name="monthly_costs" errors={errors}
              />
              <NumberInput
                label="CAPEX Inicial ($)"
                help="Inversión requerida para construir y lanzar MVP"
                placeholder="500.00"
                register={reg} name="custom_metrics.initial_investment_estimated" errors={errors}
              />
              <NumberInput
                label="Time-to-Market (Meses)"
                help="Tiempo estimado hasta la v1"
                placeholder="3"
                register={reg} name="custom_metrics.time_to_mvp_months" errors={errors} integer
              />
              <NumberInput
                label="Target Usuarios (Y1)"
                help="Usuarios esperados año 1"
                placeholder="1000"
                register={reg} name="custom_metrics.expected_users_year_1" errors={errors} integer
              />
              <div className="sm:col-span-2 mt-2">
                <FieldLabel help="Anotaciones técnicas y financieras">Notas_Adicionales</FieldLabel>
                <textarea
                  rows={3}
                  className="w-full rounded-[12px] border border-border/80 dark:border-border/40 bg-background/90 dark:bg-background/50 shadow-sm dark:shadow-none backdrop-blur-sm px-4 py-3.5 text-[13px] font-mono leading-relaxed placeholder:text-muted-foreground/30 outline-none transition-all focus:border-primary focus:bg-background focus:shadow-[0_0_20px_rgba(var(--primary),0.15)] hover:border-border resize-none"
                  placeholder="> Ingresar detalles operativos..."
                  {...reg("notes")}
                />
              </div>
            </>
          ) : (
            <>
              <NumberInput label="MRR ($)" help="Ingreso Recurrente Mensual" placeholder="0.00" register={reg} name="mrr" errors={errors} />
              <NumberInput label="Ingresos_Totales ($)" help="Flujo de entrada total" placeholder="0.00" register={reg} name="monthly_revenue" errors={errors} />
              <NumberInput label="Gastos_Operativos ($)" help="Salida total de dinero" placeholder="0.00" register={reg} name="monthly_costs" errors={errors} />
              <NumberInput label="Caja_Disponible ($)" help="Liquidez actual" placeholder="0.00" register={reg} name="cash_available" errors={errors} />
              <NumberInput label="Marketing_Spend ($)" help="Gasto en adquisición" placeholder="0.00" register={reg} name="marketing_spend" errors={errors} />
            </>
          )}
        </Section>

        {/* Users (only launched) */}
        {!isPlanning && (
          <Section icon={Users} title="ADQUISICION_Y_RETENCION" description="Dinámica de base de usuarios" color="violet">
            <NumberInput label="Usuarios_Totales" help="Cuentas registradas (histórico)" placeholder="0" register={reg} name="total_users" errors={errors} integer />
            <NumberInput label="Usuarios_Activos (MAU)" help="Cuentas activas en el mes" placeholder="0" register={reg} name="active_users" errors={errors} integer />
            <NumberInput label="Clientes_Pago" help="Suscripciones activas" placeholder="0" register={reg} name="paying_customers" errors={errors} integer />
            <NumberInput label="Nuevos_Usuarios" help="Registros del mes" placeholder="0" register={reg} name="new_users" errors={errors} integer />
            <NumberInput label="Nuevos_Clientes" help="Nuevas suscripciones" placeholder="0" register={reg} name="new_paying_customers" errors={errors} integer />
            <NumberInput label="Churn (Clientes)" help="Suscripciones canceladas" placeholder="0" register={reg} name="churned_customers" errors={errors} integer />
          </Section>
        )}

        {/* Product health (only launched) */}
        {!isPlanning && (
          <Section icon={Shield} title="SALUD_DEL_SISTEMA" description="Métricas técnicas y de calidad" color="primary">
            <NumberInput label="NPS_Score" help="Net Promoter Score (-100 a 100)" placeholder="0" register={reg} name="nps" errors={errors} />
            <NumberInput label="Tickets_Soporte" help="Volumen de incidencias" placeholder="0" register={reg} name="support_tickets" errors={errors} integer />
            <NumberInput label="Bugs_Criticos" help="Errores severidad HIGH/CRITICAL" placeholder="0" register={reg} name="critical_bugs" errors={errors} integer />
            <NumberInput label="Uptime (%)" help="Disponibilidad de servicio" placeholder="99.9" register={reg} name="uptime_percentage" errors={errors} />
          </Section>
        )}

        {/* Notes (launched) */}
        {!isPlanning && (
          <Section icon={TerminalSquare} title="LOG_DE_SISTEMA" description="Eventos clave del periodo" color="primary">
            <div className="sm:col-span-2">
              <textarea
                rows={3}
                className="w-full rounded-[12px] border border-border/80 dark:border-border/40 bg-background/90 dark:bg-background/50 shadow-sm dark:shadow-none backdrop-blur-sm px-4 py-3.5 text-[13px] font-mono leading-relaxed placeholder:text-muted-foreground/30 outline-none transition-all focus:border-primary focus:bg-background focus:shadow-[0_0_20px_rgba(var(--primary),0.15)] hover:border-border resize-none"
                placeholder="> Deploy v2.0 realizado. Incremento anormal en latencia de DB mitigado..."
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
            "w-full flex items-center justify-center gap-3 rounded-[16px] py-5 text-[13px] font-black uppercase tracking-widest text-background transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            isPlanning
              ? "bg-status-warning-fg shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]"
              : "bg-primary shadow-[0_0_30px_rgba(var(--primary),0.2)] hover:shadow-[0_0_40px_rgba(var(--primary),0.4)]"
          )}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-[4px] bg-background animate-pulse" />
              EJECUTANDO_INYECCION...
            </span>
          ) : (
            <>
              <TerminalSquare className="h-5 w-5" />
              {isPlanning ? "INJECT_ESTIMATIONS()" : "INJECT_SNAPSHOT()"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

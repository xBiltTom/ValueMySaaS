"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import {
  Lightbulb, TrendingUp, Users, Shield, CheckCircle2,
  Info, DollarSign, BarChart3, HelpCircle, TerminalSquare,
  Cpu, Zap,
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { createMetricSnapshot, updateMetricSnapshot } from "@/features/metrics/api";
import { metricSnapshotSchema, MetricSnapshotFormValues } from "@/features/metrics/schemas";
import { MetricSnapshot } from "@/features/metrics/types";
import { cn } from "@/lib/utils";

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldHelp({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-2 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help transition-colors group-hover:text-primary" />
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden w-64 rounded-[8px] border-2 border-primary/30 bg-card/98 backdrop-blur-md p-3 text-[10px] font-mono leading-relaxed text-foreground shadow-[4px_4px_0_rgba(0,0,0,0.3)] group-hover:block uppercase">
        {text}
      </span>
    </span>
  );
}

function FieldLabel({ children, help }: { children: React.ReactNode; help?: string }) {
  return (
    <div className="flex items-center mb-3">
      <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <span className="text-primary mr-2">&gt;</span>
        {children}
        {help && <FieldHelp text={help} />}
      </span>
    </div>
  );
}

function NumberInput({
  label, help, placeholder, register, name, errors,
  integer = false,
}: {
  label: string; help?: string; placeholder?: string;
  register: any; name: any; errors: any; integer?: boolean;
}) {
  const options = {
    setValueAs: (v: string) => v === "" ? undefined : (integer ? parseInt(v, 10) : parseFloat(v)),
  };
  const hasError = !!errors[name];
  return (
    <label className="block group">
      <FieldLabel help={help}>{label}</FieldLabel>
      <div className="relative">
        <input
          type="number" step={integer ? "1" : "0.01"} min="0"
          placeholder={placeholder || "0"}
          className={cn(
            "w-full rounded-[8px] border-2 bg-background/60 backdrop-blur-sm px-4 py-3 text-[15px] font-mono font-bold text-foreground",
            "placeholder:text-muted-foreground/25 outline-none transition-all",
            "focus:border-primary focus:bg-background focus:shadow-[4px_4px_0_rgba(var(--primary),0.15)]",
            hasError
              ? "border-red-500/70 focus:border-red-500"
              : "border-border/60 hover:border-primary/40"
          )}
          {...register(name, options)}
        />
        <div className="absolute top-0 right-0 h-2.5 w-2.5 border-t-2 border-r-2 border-primary/20 rounded-tr-[8px] opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
      </div>
      {hasError && (
        <p className="mt-1.5 text-[10px] font-mono uppercase text-red-400">
          ERR: {errors[name].message}
        </p>
      )}
    </label>
  );
}

function SectionHeader({
  icon: Icon, title, description, variant = "default",
}: {
  icon: React.ElementType; title: string; description?: string;
  variant?: "default" | "amber" | "emerald" | "violet" | "slate";
}) {
  const styles = {
    default: { border: "border-primary/30", bg: "bg-primary/5", icon: "text-primary", title: "text-primary" },
    amber: { border: "border-amber-500/30", bg: "bg-amber-500/5", icon: "text-amber-400", title: "text-amber-400" },
    emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: "text-emerald-400", title: "text-emerald-400" },
    violet: { border: "border-violet-500/30", bg: "bg-violet-500/5", icon: "text-violet-400", title: "text-violet-400" },
    slate: { border: "border-slate-500/30", bg: "bg-slate-500/5", icon: "text-slate-400", title: "text-slate-400" },
  };
  const s = styles[variant];

  return (
    <div className={cn("flex items-center gap-3 mb-6 pb-4 border-b-2 border-border/40")}>
      <div className={cn("h-8 w-8 rounded-[6px] border-2 flex items-center justify-center shrink-0", s.border, s.bg)}>
        <Icon className={cn("h-4 w-4", s.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[11px] font-black uppercase tracking-widest", s.title)}>
          SYS/{title}
        </p>
        {description && (
          <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function Section({
  icon, title, description, variant, children, className,
}: {
  icon: React.ElementType; title: string; description?: string;
  variant?: "default" | "amber" | "emerald" | "violet" | "slate";
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("rounded-[12px] border-2 border-border/60 bg-card p-6 shadow-[4px_4px_0_rgba(0,0,0,0.08)]", className)}>
      <SectionHeader icon={icon} title={title} description={description} variant={variant} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {children}
      </div>
    </div>
  );
}




export function MetricSnapshotForm({
  projectId,
  projectStage = "LAUNCHED",
  editingSnapshot,
  onCancelEdit,
}: {
  projectId: string;
  projectStage?: string;
  editingSnapshot?: MetricSnapshot | null;
  onCancelEdit?: () => void;
}) {
  const queryClient = useQueryClient();
  const getCurrentMonthStr = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  };

  const form = useForm<MetricSnapshotFormValues>({
    resolver: zodResolver(metricSnapshotSchema),
    defaultValues: {
      period_label: "",
      captured_at: getCurrentMonthStr(),
      notes: "",
      custom_metrics: {},
    },
  });

  useEffect(() => {
    if (editingSnapshot) {
      form.reset({
        period_label: editingSnapshot.period_label || "",
        captured_at: editingSnapshot.captured_at ? new Date(editingSnapshot.captured_at).toISOString().slice(0, 7) : getCurrentMonthStr(),
        notes: editingSnapshot.notes || "",
        mrr: editingSnapshot.mrr !== null ? Number(editingSnapshot.mrr) : undefined,
        monthly_costs: editingSnapshot.monthly_costs !== null ? Number(editingSnapshot.monthly_costs) : undefined,
        total_users: editingSnapshot.total_users ?? undefined,
        paying_customers: editingSnapshot.paying_customers ?? undefined,
        cash_available: editingSnapshot.cash_available !== null ? Number(editingSnapshot.cash_available) : undefined,
        marketing_spend: editingSnapshot.custom_metrics?.marketing_spend !== undefined ? Number(editingSnapshot.custom_metrics.marketing_spend) : undefined,
        churned_customers: editingSnapshot.custom_metrics?.churned_customers !== undefined ? Number(editingSnapshot.custom_metrics.churned_customers) : undefined,
        new_users: editingSnapshot.custom_metrics?.new_users !== undefined ? Number(editingSnapshot.custom_metrics.new_users) : undefined,
        new_paying_customers: editingSnapshot.custom_metrics?.new_paying_customers !== undefined ? Number(editingSnapshot.custom_metrics.new_paying_customers) : undefined,
        monthly_revenue: editingSnapshot.custom_metrics?.monthly_revenue !== undefined ? Number(editingSnapshot.custom_metrics.monthly_revenue) : undefined,
        nps: editingSnapshot.custom_metrics?.nps !== undefined ? Number(editingSnapshot.custom_metrics.nps) : undefined,
        uptime_percentage: editingSnapshot.custom_metrics?.uptime_percentage !== undefined ? Number(editingSnapshot.custom_metrics.uptime_percentage) : undefined,
        critical_bugs: editingSnapshot.custom_metrics?.critical_bugs !== undefined ? Number(editingSnapshot.custom_metrics.critical_bugs) : undefined,
        support_tickets: editingSnapshot.custom_metrics?.support_tickets !== undefined ? Number(editingSnapshot.custom_metrics.support_tickets) : undefined,
        custom_metrics: {
          initial_investment_estimated: editingSnapshot.custom_metrics?.initial_investment_estimated,
          time_to_mvp_months: editingSnapshot.custom_metrics?.time_to_mvp_months,
          expected_users_year_1: editingSnapshot.custom_metrics?.expected_users_year_1,
        }
      });
    } else {
      form.reset({
        period_label: "",
        captured_at: "",
        notes: "",
        mrr: "" as any,
        monthly_costs: "" as any,
        total_users: "" as any,
        paying_customers: "" as any,
        cash_available: "" as any,
        marketing_spend: "" as any,
        churned_customers: "" as any,
        new_users: "" as any,
        new_paying_customers: "" as any,
        monthly_revenue: "" as any,
        nps: "" as any,
        uptime_percentage: "" as any,
        critical_bugs: "" as any,
        support_tickets: "" as any,
        custom_metrics: {
          initial_investment_estimated: "" as any,
          time_to_mvp_months: "" as any,
          expected_users_year_1: "" as any,
        },
      });
    }
  }, [editingSnapshot, form]);

  const isPlanning = projectStage === "PLANNING" || projectStage === "IDEA";
  const errors = form.formState.errors;
  const reg = form.register;

  const mutation = useMutation({
    mutationFn: (values: MetricSnapshotFormValues) => {
      let finalDate = new Date();
      let label = values.period_label;
      const monthStr = values.captured_at;
      
      if (monthStr && monthStr.includes("-")) {
        const [yyyy, mm] = monthStr.split("-");
        finalDate = new Date(Date.UTC(Number(yyyy), Number(mm), 0, 23, 59, 59));
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        label = `${monthNames[Number(mm) - 1]} ${yyyy}`;
      }

      const payload = {
        ...values,
        period_label: label,
        captured_at: finalDate.toISOString(),
      };
      
      if (editingSnapshot) {
        // Strip undefined values for PATCH
        const cleanPayload = Object.fromEntries(
          Object.entries(payload).filter(([, v]) => v !== undefined && v !== "")
        );
        return updateMetricSnapshot(projectId, editingSnapshot.id, cleanPayload);
      }
      return createMetricSnapshot(projectId, payload);
    },
    onSuccess: async () => {
      if (!editingSnapshot) {
        form.reset({
          period_label: "",
          captured_at: "",
          notes: "",
          mrr: "" as any,
          monthly_costs: "" as any,
          total_users: "" as any,
          paying_customers: "" as any,
          cash_available: "" as any,
          marketing_spend: "" as any,
          churned_customers: "" as any,
          new_users: "" as any,
          new_paying_customers: "" as any,
          monthly_revenue: "" as any,
          nps: "" as any,
          uptime_percentage: "" as any,
          critical_bugs: "" as any,
          support_tickets: "" as any,
          custom_metrics: {
            initial_investment_estimated: "" as any,
            time_to_mvp_months: "" as any,
            expected_users_year_1: "" as any,
          },
        });
      }
      if (editingSnapshot && onCancelEdit) {
        onCancelEdit();
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["metric-snapshots", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["project-dashboard", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["metric-calculations", projectId, "latest"] }),
      ]);
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={cn(
        "relative overflow-hidden rounded-[12px] border-2 p-6",
        isPlanning
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-primary/30 bg-primary/5"
      )}>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.01)_40px,rgba(255,255,255,0.01)_41px)] pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className={cn(
            "rounded-[8px] border-2 p-3 shrink-0",
            isPlanning ? "border-amber-500/40 bg-amber-500/10" : "border-primary/40 bg-primary/10"
          )}>
            {isPlanning
              ? <Lightbulb className="h-5 w-5 text-amber-400" />
              : <BarChart3 className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 font-mono", isPlanning ? "text-amber-400" : "text-primary")}>
              {editingSnapshot ? "MODO: EDICIÓN" : isPlanning ? "MODO: PLANEACIÓN" : "MODO: OPERATIVO"}
            </p>
            <h2 className="text-lg font-display font-black uppercase tracking-tight text-foreground">
              {editingSnapshot ? "Actualizar Snapshot" : isPlanning ? "Registrar Proyecciones" : "Registrar Snapshot"}
            </h2>
            <p className="text-[11px] font-mono text-muted-foreground mt-1 uppercase">
              {editingSnapshot
                ? "> Editando los datos del periodo. Algunos campos forzarán recálculo."
                : isPlanning
                ? "> Estima costos y proyecciones para evaluar viabilidad con IA."
                : "> Captura el estado real del periodo para diagnóstico y seguimiento."}
            </p>
          </div>
        </div>
      </div>



      {/* ── Status messages ─────────────────────────────────────────── */}
      {mutation.isSuccess && (
        <div className="flex items-start gap-4 rounded-[12px] border-2 border-emerald-500/40 bg-emerald-500/5 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400 font-mono">
              {editingSnapshot ? "SYS_STATUS: SNAPSHOT_ACTUALIZADO" : isPlanning ? "SYS_STATUS: ESTIMACIONES_OK" : "SYS_STATUS: SNAPSHOT_INYECTADO"}
            </p>
            <p className="text-[10px] font-mono text-emerald-400/70 uppercase mt-1">
              {isPlanning
                ? "> Usa el Análisis IA para diagnóstico de viabilidad."
                : "> Datos procesados. Genera el Score para ver el diagnóstico completo."}
            </p>
          </div>
        </div>
      )}
      {mutation.isError && <ErrorState message={getApiErrorMessage(mutation.error)} />}

      {/* ── Form ────────────────────────────────────────────────────── */}
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>

        {/* PERIODO */}
        <Section icon={TerminalSquare} title="PERIODO_ID" description="Identificador temporal del snapshot">
          <div className="sm:col-span-2">
            <FieldLabel help="Mes y año al que corresponden estas métricas. Solo se permite 1 snapshot por mes.">
              Mes a registrar
            </FieldLabel>
            <input
              type="month"
              className="w-full rounded-[8px] border-2 border-border/60 bg-background/60 backdrop-blur-sm px-4 py-3 text-[15px] font-mono font-bold outline-none transition-all focus:border-primary focus:shadow-[4px_4px_0_rgba(var(--primary),0.15)] hover:border-primary/40 text-foreground"
              {...reg("captured_at")}
            />
            {errors.captured_at && (
              <p className="mt-1.5 text-[10px] font-mono uppercase text-red-400">
                ERR: {errors.captured_at.message}
              </p>
            )}
          </div>
        </Section>

        {/* FINANCIERO */}
        <Section
          icon={DollarSign}
          title={isPlanning ? "FINANCIERO_ESTIMADO" : "FLUJO_FINANCIERO"}
          description={isPlanning ? "Proyección de costos pre-lanzamiento" : "Ingresos y egresos reales del periodo"}
          variant={isPlanning ? "amber" : "emerald"}
        >
          {isPlanning ? (
            <>
              <NumberInput
                label="OPEX Mensual ($)"
                help="Servidores, dominios, APIs estimadas…"
                placeholder="50.00"
                register={reg} name="monthly_costs" errors={errors}
              />
              <NumberInput
                label="CAPEX Inicial ($)"
                help="Inversión requerida para construir y lanzar el MVP"
                placeholder="500.00"
                register={reg} name="custom_metrics.initial_investment_estimated" errors={errors}
              />
              <NumberInput
                label="Time-to-Market (Meses)"
                help="Tiempo estimado hasta la primera versión"
                placeholder="3"
                register={reg} name="custom_metrics.time_to_mvp_months" errors={errors}
                integer
              />
              <NumberInput
                label="Target Usuarios (Año 1)"
                help="Usuarios esperados durante el primer año"
                placeholder="1000"
                register={reg} name="custom_metrics.expected_users_year_1" errors={errors}
                integer
              />
            </>
          ) : (
            <>
              <NumberInput
                label="MRR ($)"
                help="Ingreso Recurrente Mensual — base del análisis"
                placeholder="0.00"
                register={reg} name="mrr" errors={errors}
              />
              <NumberInput
                label="Ingresos Totales ($)"
                help="Flujo total de ingresos del periodo"
                placeholder="0.00"
                register={reg} name="monthly_revenue" errors={errors}
              />
              <NumberInput
                label="Gastos Operativos ($)"
                help="Total de egresos del mes"
                placeholder="0.00"
                register={reg} name="monthly_costs" errors={errors}
              />
              <NumberInput
                label="Caja Disponible ($)"
                help="Liquidez actual — el sistema calcula el Runway con esto"
                placeholder="0.00"
                register={reg} name="cash_available" errors={errors}
              />
            </>
          )}
        </Section>

        {/* USUARIOS Y RETENCIÓN (solo launched) */}
        {!isPlanning && (
          <Section
            icon={Users}
            title="USUARIOS_Y_RETENCIÓN"
            description="Base de usuarios — el sistema calcula Churn Rate y Conversión automáticamente"
            variant="violet"
          >
            <NumberInput
              label="Usuarios Totales"
              help="Cuentas registradas acumuladas"
              placeholder="0"
              register={reg} name="total_users" errors={errors}
              integer
            />
            <NumberInput
              label="Clientes Pagadores"
              help="Suscripciones activas este mes"
              placeholder="0"
              register={reg} name="paying_customers" errors={errors}
              integer
            />
            <NumberInput
              label="Nuevos Usuarios"
              help="Registros del mes"
              placeholder="0"
              register={reg} name="new_users" errors={errors}
              integer
            />
            <NumberInput
              label="Nuevos Clientes"
              help="Nuevas suscripciones este mes — junto con Marketing Spend, el sistema calcula el CAC"
              placeholder="0"
              register={reg} name="new_paying_customers" errors={errors}
              integer
            />
            <div className="sm:col-span-2">
              <NumberInput
                label="Clientes que Cancelaron"
                help="Suscripciones canceladas este mes — el sistema calcula el Churn Rate a partir de este dato"
                placeholder="0"
                register={reg} name="churned_customers" errors={errors}
                integer
              />
            </div>
          </Section>
        )}

        {/* ADQUISICIÓN (solo launched) */}
        {!isPlanning && (
          <Section
            icon={TrendingUp}
            title="ADQUISICIÓN"
            description="Gasto en marketing — el sistema calcula el CAC automáticamente"
            variant="default"
          >
            <div className="sm:col-span-2">
              <NumberInput
                label="Gasto en Marketing ($)"
                help="Total invertido en adquisición este mes — junto con Nuevos Clientes, el sistema calcula el CAC"
                placeholder="0.00"
                register={reg} name="marketing_spend" errors={errors}
              />
            </div>

            {/* Info box sobre métricas auto-derivadas */}
            <div className="sm:col-span-2 rounded-[8px] border-2 border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono mb-2">
                /SYS_AUTO_DERIVATION
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Churn Rate", formula: "Cancelados ÷ Clientes Pago" },
                  { label: "CAC", formula: "Mktg Spend ÷ Nuevos Clientes" },
                  { label: "Runway", formula: "Caja ÷ Gastos Operativos" },
                ].map(({ label, formula }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Zap className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono">{label}</p>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase">{formula}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* SALUD DEL PRODUCTO (opcional, ahora bien contextualizada) */}
        {!isPlanning && (
          <Section
            icon={Shield}
            title="SALUD_PRODUCTO"
            description="Métricas de calidad — enriquecen el análisis pero son opcionales"
            variant="slate"
          >
            <NumberInput
              label="NPS Score"
              help="Net Promoter Score (-100 a 100). Mide si tus usuarios te recomiendan. Impacta el puntaje de producto."
              placeholder="0"
              register={reg} name="nps" errors={errors}
            />
            <NumberInput
              label="Uptime (%)"
              help="Disponibilidad del servicio este mes"
              placeholder="99.9"
              register={reg} name="uptime_percentage" errors={errors}
            />
            <NumberInput
              label="Bugs Críticos"
              help="Errores de severidad alta reportados"
              placeholder="0"
              register={reg} name="critical_bugs" errors={errors}
              integer
            />
            <NumberInput
              label="Tickets Soporte"
              help="Volumen de incidencias de usuarios"
              placeholder="0"
              register={reg} name="support_tickets" errors={errors}
              integer
            />
          </Section>
        )}

        {/* NOTAS */}
        <Section
          icon={TerminalSquare}
          title="LOG_SISTEMA"
          description="Eventos y contexto del periodo"
          variant="slate"
          className="border-border/40"
        >
          <div className="sm:col-span-2">
            <FieldLabel>Notas del periodo</FieldLabel>
            <textarea
              rows={3}
              className="w-full rounded-[8px] border-2 border-border/60 bg-background/60 backdrop-blur-sm px-4 py-3 text-[13px] font-mono leading-relaxed placeholder:text-muted-foreground/25 outline-none transition-all focus:border-primary focus:shadow-[4px_4px_0_rgba(var(--primary),0.15)] hover:border-primary/40 text-foreground resize-none"
              placeholder={isPlanning
                ? "> Contexto del equipo, supuestos de mercado, riesgos identificados..."
                : "> Deploy v2.0 realizado. Campaña de marketing activa. Incidente de DB resuelto..."}
              {...reg("notes")}
            />
          </div>
        </Section>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {editingSnapshot && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={mutation.isPending}
              className="w-full sm:w-1/3 rounded-[10px] border-2 border-border/60 bg-card py-4 text-[12px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:opacity-50"
            >
              Cancelar Edición
            </button>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className={cn(
              "group relative flex items-center justify-center gap-3 rounded-[10px] border-2 border-primary py-4 text-[12px] font-black uppercase tracking-widest text-primary-foreground transition-all",
              editingSnapshot ? "w-full sm:w-2/3" : "w-full",
              "bg-primary hover:bg-primary/90 active:translate-y-0.5",
              "shadow-[6px_6px_0_rgba(var(--primary),0.3)] hover:shadow-[3px_3px_0_rgba(var(--primary),0.3)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
              isPlanning && "border-amber-500 bg-amber-500 hover:bg-amber-500/90 shadow-[6px_6px_0_rgba(245,158,11,0.3)] hover:shadow-[3px_3px_0_rgba(245,158,11,0.3)]"
            )}
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-[8px]" />
            {mutation.isPending ? (
              <span className="relative z-10 flex items-center gap-2">
                <span className="h-4 w-4 rounded-[3px] bg-primary-foreground/30 animate-pulse" />
                EJECUTANDO...
              </span>
            ) : (
              <span className="relative z-10 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                {editingSnapshot ? "UPDATE_SNAPSHOT()" : isPlanning ? "INJECT_ESTIMATIONS()" : "INJECT_SNAPSHOT()"}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

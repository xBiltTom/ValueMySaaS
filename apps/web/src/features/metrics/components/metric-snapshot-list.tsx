"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar, TerminalSquare, Pencil, Trash2, X, Check,
  DollarSign, Users, ChevronDown, ChevronUp, AlertTriangle, Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import { MetricSnapshotListResponse, MetricSnapshot } from "@/features/metrics/types";
import { updateMetricSnapshot, deleteMetricSnapshot } from "@/features/metrics/api";
import { metricSnapshotSchema, MetricSnapshotFormValues } from "@/features/metrics/schemas";
import { cn } from "@/lib/utils";

// ─── Edit form (inline) ───────────────────────────────────────────────────────

function InlineField({
  label, name, register, errors, integer = false, step = "0.01",
}: {
  label: string; name: any; register: any; errors: any;
  integer?: boolean; step?: string;
}) {
  const hasError = !!errors[name];
  return (
    <div>
      <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
        <span className="text-primary mr-1">&gt;</span>{label}
      </label>
      <input
        type="number"
        step={integer ? "1" : step}
        min="0"
        className={cn(
          "w-full rounded-[6px] border-2 bg-background/70 px-3 py-2 text-[13px] font-mono font-bold text-foreground",
          "outline-none transition-all placeholder:text-muted-foreground/30",
          "focus:border-primary focus:shadow-[3px_3px_0_rgba(var(--primary),0.15)]",
          hasError ? "border-red-500/60" : "border-border/60 hover:border-primary/40"
        )}
        {...register(name, {
          setValueAs: (v: string) =>
            v === "" ? undefined : integer ? parseInt(v, 10) : parseFloat(v),
        })}
      />
      {hasError && (
        <p className="mt-1 text-[9px] font-mono uppercase text-red-400">
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
}

function EditSnapshotForm({
  snapshot,
  projectId,
  onClose,
}: {
  snapshot: MetricSnapshot;
  projectId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<MetricSnapshotFormValues>({
    resolver: zodResolver(metricSnapshotSchema),
    defaultValues: {
      period_label: snapshot.period_label ?? "",
      mrr: snapshot.mrr !== null ? Number(snapshot.mrr) : undefined,
      monthly_costs: snapshot.monthly_costs !== null ? Number(snapshot.monthly_costs) : undefined,
      total_users: snapshot.total_users ?? undefined,
      paying_customers: snapshot.paying_customers ?? undefined,
      notes: snapshot.notes ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: MetricSnapshotFormValues) => {
      // strip undefined so PATCH only sends changed fields
      const clean = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== undefined && v !== "")
      );
      return updateMetricSnapshot(projectId, snapshot.id, clean);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["metric-snapshots", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["project-dashboard", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["metric-calculations", projectId, "latest"] }),
      ]);
      onClose();
    },
  });

  const errors = form.formState.errors;
  const reg = form.register;

  return (
    <form
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      className="mt-4 pt-4 border-t-2 border-dashed border-primary/30 space-y-4 animate-in slide-in-from-top-2 duration-200"
    >
      <p className="text-[9px] font-black uppercase tracking-widest text-primary font-mono flex items-center gap-1.5">
        <Pencil className="h-3 w-3" /> EDIT_MODE — modifica los campos y guarda
      </p>

      {/* Error global */}
      {mutation.isError && (
        <div className="flex items-start gap-2 rounded-[6px] border-2 border-red-500/30 bg-red-500/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-red-400 uppercase">
            Error al guardar. Verifica los datos e intenta de nuevo.
          </p>
        </div>
      )}

      {/* Period label */}
      <div>
        <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
          <span className="text-primary mr-1">&gt;</span>Nombre del periodo
        </label>
        <input
          className={cn(
            "w-full rounded-[6px] border-2 bg-background/70 px-3 py-2 text-[13px] font-mono font-bold text-foreground",
            "outline-none transition-all",
            "focus:border-primary focus:shadow-[3px_3px_0_rgba(var(--primary),0.15)] border-border/60 hover:border-primary/40"
          )}
          {...reg("period_label")}
        />
        {errors.period_label && (
          <p className="mt-1 text-[9px] font-mono uppercase text-red-400">
            {errors.period_label.message}
          </p>
        )}
      </div>

      {/* Financial row */}
      <div className="grid grid-cols-2 gap-3">
        <InlineField label="MRR ($)" name="mrr" register={reg} errors={errors} />
        <InlineField label="Gastos Operativos ($)" name="monthly_costs" register={reg} errors={errors} />
      </div>

      {/* Users row */}
      <div className="grid grid-cols-2 gap-3">
        <InlineField label="Usuarios Totales" name="total_users" register={reg} errors={errors} integer />
        <InlineField label="Clientes Pagadores" name="paying_customers" register={reg} errors={errors} integer />
      </div>

      {/* Churn / CAC row (direct override) */}
      <div className="grid grid-cols-2 gap-3">
        <InlineField label="Clientes Cancelaron" name="churned_customers" register={reg} errors={errors} integer />
        <InlineField label="Gasto en Marketing ($)" name="marketing_spend" register={reg} errors={errors} />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
          <span className="text-primary mr-1">&gt;</span>Notas
        </label>
        <textarea
          rows={2}
          className="w-full rounded-[6px] border-2 border-border/60 bg-background/70 px-3 py-2 text-[12px] font-mono text-foreground outline-none transition-all focus:border-primary hover:border-primary/40 resize-none"
          {...reg("notes")}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className={cn(
            "flex items-center gap-2 rounded-[6px] border-2 border-primary bg-primary px-4 py-2",
            "text-[10px] font-black uppercase tracking-widest text-primary-foreground",
            "shadow-[3px_3px_0_rgba(var(--primary),0.3)] hover:shadow-[1px_1px_0_rgba(var(--primary),0.3)]",
            "transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {mutation.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Check className="h-3.5 w-3.5" />}
          {mutation.isPending ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-[6px] border-2 border-border/60 bg-card px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirm({
  snapshot,
  projectId,
  onClose,
}: {
  snapshot: MetricSnapshot;
  projectId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteMetricSnapshot(projectId, snapshot.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["metric-snapshots", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["project-dashboard", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["metric-calculations", projectId, "latest"] }),
      ]);
      onClose();
    },
  });

  return (
    <div className="mt-4 pt-4 border-t-2 border-dashed border-red-500/30 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-3 rounded-[8px] border-2 border-red-500/30 bg-red-500/5 p-3 mb-3">
        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400 font-mono mb-0.5">
            CONFIRMAR_ELIMINACIÓN
          </p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase leading-relaxed">
            Esto eliminará el snapshot "{snapshot.period_label}". Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-[6px] border-2 border-red-500/60 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 shadow-[3px_3px_0_rgba(239,68,68,0.15)] hover:shadow-[1px_1px_0_rgba(239,68,68,0.15)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />}
          {mutation.isPending ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button
          onClick={onClose}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-[6px] border-2 border-border/60 bg-card px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Snapshot card ────────────────────────────────────────────────────────────

function SnapshotCard({
  snapshot,
  index,
  projectId,
}: {
  snapshot: MetricSnapshot;
  index: number;
  projectId: string;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[12px] border-2 bg-card transition-all duration-200",
        mode === "edit" && "border-primary/40 shadow-[4px_4px_0_rgba(var(--primary),0.08)]",
        mode === "delete" && "border-red-500/40 shadow-[4px_4px_0_rgba(239,68,68,0.08)]",
        mode === "view" && "border-border/50 hover:border-border"
      )}
    >
      {/* Scanline texture */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.015)_3px,rgba(0,0,0,0.015)_4px)] pointer-events-none" />

      <div className="relative z-10 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="shrink-0 text-[8px] font-mono font-black text-muted-foreground border-2 border-border/50 rounded-[3px] px-1.5 py-0.5 bg-background/50">
                IDX_{index.toString().padStart(2, "0")}
              </span>
              <h3 className="font-black text-[13px] uppercase tracking-wide text-foreground truncate">
                {snapshot.period_label || "UNLABELED_PERIOD"}
              </h3>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatDateTime(snapshot.captured_at)}
            </p>
          </div>

          {/* Action buttons */}
          {mode === "view" && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => { setMode("edit"); setExpanded(true); }}
                title="Editar snapshot"
                className="group flex items-center justify-center rounded-[6px] border-2 border-border/50 bg-card p-1.5 text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Editar</span>
              </button>
              <button
                onClick={() => { setMode("delete"); setExpanded(true); }}
                title="Eliminar snapshot"
                className="group flex items-center justify-center rounded-[6px] border-2 border-border/50 bg-card p-1.5 text-muted-foreground transition-all hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Eliminar</span>
              </button>
              <button
                onClick={() => setExpanded((p) => !p)}
                title="Ver detalles"
                className="rounded-[6px] border-2 border-border/50 bg-card p-1.5 text-muted-foreground transition-all hover:border-border hover:text-foreground"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {/* Cancel mode button when in edit/delete */}
          {mode !== "view" && (
            <button
              onClick={() => setMode("view")}
              className="shrink-0 rounded-[6px] border-2 border-border/50 bg-card p-1.5 text-muted-foreground hover:text-foreground transition-all ml-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Metrics chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {snapshot.mrr !== null && snapshot.mrr !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-[4px] border-2 border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary font-mono">
              <DollarSign className="h-2.5 w-2.5" />
              MRR: {snapshot.mrr}
            </span>
          )}
          {snapshot.paying_customers !== null && snapshot.paying_customers !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-[4px] border-2 border-violet-500/20 bg-violet-500/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-violet-400 font-mono">
              <Users className="h-2.5 w-2.5" />
              CLIENTES: {snapshot.paying_customers}
            </span>
          )}
          {snapshot.monthly_costs !== null && snapshot.monthly_costs !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-[4px] border-2 border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-400 font-mono">
              GASTOS: {snapshot.monthly_costs}
            </span>
          )}
        </div>

        {/* Notes (expanded view) */}
        {expanded && mode === "view" && snapshot.notes && (
          <div className="mt-3 pt-3 border-t-2 border-dashed border-border/30 animate-in fade-in duration-150">
            <p className="text-[10px] font-mono leading-relaxed text-muted-foreground uppercase">
              <span className="text-primary mr-1.5">&gt;</span>
              {snapshot.notes}
            </p>
          </div>
        )}

        {/* Edit form */}
        {mode === "edit" && (
          <EditSnapshotForm
            snapshot={snapshot}
            projectId={projectId}
            onClose={() => setMode("view")}
          />
        )}

        {/* Delete confirmation */}
        {mode === "delete" && (
          <DeleteConfirm
            snapshot={snapshot}
            projectId={projectId}
            onClose={() => setMode("view")}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function MetricSnapshotList({
  snapshots,
  projectId,
}: {
  snapshots: MetricSnapshotListResponse;
  projectId: string;
}) {
  if (!snapshots.items.length) {
    return (
      <div className="rounded-[12px] border-2 border-dashed border-border/50 bg-card/30 p-10 text-center">
        <TerminalSquare className="mx-auto h-8 w-8 text-muted-foreground/20 mb-4" />
        <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground font-mono mb-2">
          SYS_ERR: EMPTY_DATASET
        </h3>
        <p className="text-[10px] font-mono text-muted-foreground uppercase">
          &gt; Registra un corte de métricas para inicializar cálculos y el dashboard histórico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 font-mono">
          <span className="h-1.5 w-1.5 bg-primary rounded-full shrink-0" />
          DATA_LOG_HISTORY
        </h3>
        <span className="text-[9px] font-mono text-muted-foreground uppercase">
          {snapshots.total} snapshot{snapshots.total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {snapshots.items.map((snapshot, i) => (
          <SnapshotCard
            key={snapshot.id}
            snapshot={snapshot}
            index={i}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  );
}

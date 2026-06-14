"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SaasProject } from "@/features/projects/types";
import { updateProject } from "@/features/projects/api";
import { getApiErrorMessage } from "@/lib/api-client";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";
import { categories, businessModels } from "@/features/projects/schemas";
import { Edit2, TerminalSquare, AlertTriangle, Save } from "lucide-react";

function BrutalistInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[8px] border-2 border-border/60 bg-background/50 backdrop-blur-sm px-4 py-2.5 text-[12px] font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all",
        "focus:border-primary focus:shadow-[4px_4px_0_rgba(var(--primary),0.2)] hover:border-primary/50",
        className
      )}
      {...props}
    />
  );
}

function BrutalistSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[8px] border-2 border-border/60 bg-background/50 backdrop-blur-sm px-4 py-2.5 text-[12px] font-mono text-foreground outline-none transition-all appearance-none cursor-pointer",
        "focus:border-primary focus:shadow-[4px_4px_0_rgba(var(--primary),0.2)] hover:border-primary/50",
        className
      )}
      {...props}
    />
  );
}

function BrutalistTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[8px] border-2 border-border/60 bg-background/50 backdrop-blur-sm px-4 py-2.5 text-[12px] font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all resize-y min-h-[80px]",
        "focus:border-primary focus:shadow-[4px_4px_0_rgba(var(--primary),0.2)] hover:border-primary/50",
        className
      )}
      {...props}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 font-mono">
      &gt; {children}
    </span>
  );
}

type EditProjectFormValues = {
  name: string;
  description: string;
  category: string;
  business_model: string;
  target_market: string;
  target_audience: string;
  main_problem: string;
  value_proposition: string;
  current_price: number;
  currency: string;
};

export function EditProjectModal({
  project,
  isOpen,
  onClose,
}: {
  project: SaasProject;
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<EditProjectFormValues>({
    defaultValues: {
      name: project.name || "",
      description: project.description || "",
      category: project.category || "PRODUCTIVITY",
      business_model: project.business_model || "SUBSCRIPTION",
      target_market: project.target_market || "",
      target_audience: project.target_audience || "",
      main_problem: project.main_problem || "",
      value_proposition: project.value_proposition || "",
      current_price: typeof project.current_price === "number" ? project.current_price : (parseFloat(project.current_price as string) || 0),
      currency: project.currency || "USD",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: EditProjectFormValues) => {
      // Create partial payload
      const payload: any = { ...values };
      return updateProject(project.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      onClose();
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-2 border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.15)] bg-card rounded-[16px] sm:rounded-[24px]">
        
        {/* Brutalist Header */}
        <div className="bg-muted/30 border-b-2 border-border/60 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <TerminalSquare className="h-32 w-32" />
          </div>
          <DialogHeader className="relative z-10 text-left space-y-2">
            <div className="flex items-center gap-2 text-primary font-mono text-[10px] font-black uppercase tracking-widest mb-1">
              <Edit2 className="h-3 w-3" /> // OVERRIDE PROTOCOL
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-foreground">
              EDITAR PARÁMETROS
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[11px] font-mono uppercase max-w-lg leading-relaxed">
              &gt; Modifica los metadatos y vectores base del sistema. Los cambios aplicarán para futuros análisis de la IA.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {mutation.isError && (
            <div className="mb-6 animate-in slide-in-from-top-2">
              <ErrorState message={getApiErrorMessage(mutation.error)} />
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-8">
            
            {/* Section 1: Core */}
            <div className="space-y-4">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-foreground font-mono flex items-center gap-2 border-b-2 border-border/60 pb-2">
                <span className="text-primary">01.</span> NÚCLEO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>NOMBRE DEL SISTEMA</Label>
                  <BrutalistInput {...form.register("name")} required />
                </div>
                <div>
                  <Label>CATEGORÍA</Label>
                  <BrutalistSelect {...form.register("category")}>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </BrutalistSelect>
                </div>
                <div className="md:col-span-2">
                  <Label>DESCRIPCIÓN GENERAL</Label>
                  <BrutalistTextarea {...form.register("description")} rows={2} />
                </div>
              </div>
            </div>

            {/* Section 2: Vectors */}
            <div className="space-y-4">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-foreground font-mono flex items-center gap-2 border-b-2 border-border/60 pb-2">
                <span className="text-primary">02.</span> VECTORES DE VALOR
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>AUDIENCIA OBJETIVO</Label>
                  <BrutalistInput {...form.register("target_audience")} />
                </div>
                <div>
                  <Label>MERCADO OBJETIVO</Label>
                  <BrutalistInput {...form.register("target_market")} />
                </div>
                <div className="md:col-span-2">
                  <Label>PROBLEMA DETECTADO</Label>
                  <BrutalistTextarea {...form.register("main_problem")} rows={2} />
                </div>
                <div className="md:col-span-2">
                  <Label>PROPUESTA DE SOLUCIÓN</Label>
                  <BrutalistTextarea {...form.register("value_proposition")} rows={2} />
                </div>
              </div>
            </div>

            {/* Section 3: Finance */}
            <div className="space-y-4">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-foreground font-mono flex items-center gap-2 border-b-2 border-border/60 pb-2">
                <span className="text-primary">03.</span> PARÁMETROS FINANCIEROS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label>MODELO DE NEGOCIO</Label>
                  <BrutalistSelect {...form.register("business_model")}>
                    {businessModels.map((bm) => (
                      <option key={bm} value={bm}>{bm}</option>
                    ))}
                  </BrutalistSelect>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>PRECIO</Label>
                    <BrutalistInput type="number" step="0.01" min="0" {...form.register("current_price", { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label>DIVISA</Label>
                    <BrutalistSelect {...form.register("currency")}>
                      <option value="USD">USD</option>
                      <option value="PEN">PEN</option>
                      <option value="MXN">MXN</option>
                      <option value="COP">COP</option>
                      <option value="EUR">EUR</option>
                    </BrutalistSelect>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Note */}
            <div className="rounded-[8px] bg-status-warning-bg/30 border border-status-warning-border/50 p-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-status-warning-fg shrink-0 mt-0.5" />
              <p className="text-[10px] md:text-[11px] text-status-warning-text uppercase font-mono leading-relaxed">
                <strong className="font-black">ATENCIÓN:</strong> Modificar el modelo de negocio o la divisa puede afectar el cálculo histórico de métricas. Procede con precaución.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-border/60">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-[8px] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors font-mono"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className={cn(
                  "flex items-center gap-2 rounded-[8px] border-2 border-primary bg-primary px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-0.5 shadow-[4px_4px_0_rgba(var(--primary),0.4)] hover:shadow-[2px_2px_0_rgba(var(--primary),0.4)] disabled:opacity-50 disabled:cursor-not-allowed font-mono",
                )}
              >
                {mutation.isPending ? "PROCESANDO..." : <><Save className="h-3.5 w-3.5" /> APLICAR CAMBIOS</>}
              </button>
            </div>

          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

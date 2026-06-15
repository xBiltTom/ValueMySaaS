"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  ArrowRight, Lightbulb, Rocket, Sparkles, HelpCircle,
  Package, Users, Globe, Brain, DollarSign, Check, TerminalSquare
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatEnum } from "@/lib/utils";
import { createProject } from "@/features/projects/api";
import {
  businessModels, categories, createProjectSchema, CreateProjectFormValues,
} from "@/features/projects/schemas";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-[11px] md:text-[12px] font-black uppercase tracking-widest text-foreground mb-3 font-mono">
      &gt; {children} {required && <span className="text-primary">*</span>}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-[10px] md:text-[11px] font-black tracking-widest uppercase text-destructive flex items-center gap-1 font-mono"><span>ERR:</span> {message}</p>;
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-1.5 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary cursor-help inline" />
      <span className="pointer-events-none absolute left-0 top-6 z-50 hidden w-56 rounded-[8px] border-2 border-border/60 bg-card p-3 text-[10px] font-mono uppercase text-muted-foreground shadow-[4px_4px_0_rgba(0,0,0,0.2)] group-hover:block">
        {text}
      </span>
    </span>
  );
}

function StepIndicator({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1 transition-all", active ? "opacity-100" : "opacity-40")}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-black border-2 transition-all font-mono",
          done ? "bg-primary border-primary text-primary-foreground" : active ? "bg-primary/20 border-primary text-primary" : "bg-card border-border/60 text-muted-foreground"
        )}>
          {done ? <Check className="h-3.5 w-3.5" /> : step}
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-widest font-mono hidden sm:block", active ? "text-primary" : "text-muted-foreground")}>
          {label}
        </span>
      </div>
      {active && <div className="h-0.5 w-full bg-primary mt-1" />}
    </div>
  );
}

const STEPS = [
  { label: "Fase" },
  { label: "Identidad" },
  { label: "Propuesta" },
  { label: "Modelo" },
];

function BrutalistInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[8px] border-2 border-border/60 bg-background/50 backdrop-blur-sm px-4 py-3.5 text-[13px] font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all",
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
        "w-full rounded-[8px] border-2 border-border/60 bg-background/50 backdrop-blur-sm px-4 py-3.5 text-[13px] font-mono text-foreground outline-none transition-all appearance-none cursor-pointer",
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
        "w-full rounded-[8px] border-2 border-border/60 bg-background/50 backdrop-blur-sm px-4 py-3.5 text-[13px] font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/50 outline-none transition-all resize-none",
        "focus:border-primary focus:shadow-[4px_4px_0_rgba(var(--primary),0.2)] hover:border-primary/50",
        className
      )}
      {...props}
    />
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  EDTECH: "📚 EdTech", FINTECH: "💳 FinTech",
  HEALTHTECH: "🏥 HealthTech", PRODUCTIVITY: "⚡ Productividad",
  MARKETING: "📣 Marketing", ECOMMERCE: "🛍 E-commerce",
  AI: "🤖 IA", DEVELOPER_TOOLS: "🛠 Dev Tools",
  OTHER: "📦 Otro",
};

const BM_LABELS: Record<string, string> = {
  B2B: "B2B — Ventas a empresas", B2C: "B2C — Ventas a personas",
  B2B2C: "B2B2C — Mixto", FREEMIUM: "Freemium",
  SUBSCRIPTION: "Suscripción", ONE_TIME: "Pago único",
  OTHER: "Otro",
};

export function ProjectForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => setCanSubmit(true), 500);
      return () => clearTimeout(timer);
    } else {
      setCanSubmit(false);
    }
  }, [step]);

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "", description: "", category: "PRODUCTIVITY",
      stage: "PLANNING", business_model: "SUBSCRIPTION",
      target_market: "", target_audience: "",
      main_problem: "", value_proposition: "",
      competitors: "", acquisition_strategy: "",
      pricing_notes: "",
      current_price: 0, currency: "USD",
    },
  });

  const watchStage = form.watch("stage");
  const watchBusinessModel = form.watch("business_model");
  const isPlanning = watchStage === "PLANNING" || watchStage === "IDEA";

  let priceLabel = "TICKET PROM./MENSUAL";
  if (watchBusinessModel === "FREEMIUM") priceLabel = "PRECIO PREMIUM";
  if (watchBusinessModel === "ONE_TIME") priceLabel = "PRECIO ÚNICO";

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate({ ...values, country_focus: "Peru", pricing_notes: values.pricing_notes || "", is_public_sample: false });
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateProjectFormValues)[] = [];
    if (step === 1) fieldsToValidate = ["name", "category", "description"];
    if (step === 2) fieldsToValidate = ["target_audience", "target_market", "main_problem", "value_proposition"];
    
    if (fieldsToValidate.length) {
      const valid = await form.trigger(fieldsToValidate);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Only intercept Enter if it's not a textarea (which needs Enter for newlines)
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
      if (step === 0) setStep(1);
      else if (step < 3) nextStep();
      else {
        // If step 3, we can submit
        form.handleSubmit((values) => {
          mutation.mutate({ ...values, country_focus: "Peru", pricing_notes: "", is_public_sample: false });
        })();
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step progress bar */}
      <div className="flex items-center justify-between mb-10 border-b-2 border-border/60 pb-4">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1 flex justify-center">
            <StepIndicator step={i + 1} label={s.label} active={i === step} done={i < step} />
          </div>
        ))}
      </div>

      {mutation.isError ? <div className="mb-6"><ErrorState message={getApiErrorMessage(mutation.error)} /></div> : null}

      <form onSubmit={onSubmit} onKeyDown={handleKeyDown}>
        {/* Step 0: Tipo de proyecto */}
        {step === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 border-l-4 border-primary pl-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">STEP 01/04</p>
              <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-foreground">ESTADO DE OPERACIÓN</h2>
              <p className="text-muted-foreground text-[11px] font-mono uppercase max-w-lg">
                &gt; Define la etapa actual para parametrizar el algoritmo de análisis.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { form.setValue("stage", "PLANNING"); setStep(1); }}
                className={cn(
                  "group relative flex flex-col items-start rounded-[12px] border-2 p-6 text-left transition-all duration-200 overflow-hidden",
                  watchStage === "PLANNING" || watchStage === "IDEA"
                    ? "border-primary bg-primary/5 shadow-[8px_8px_0_rgba(var(--primary),0.3)] -translate-y-1 -translate-x-1"
                    : "border-border/60 bg-card hover:border-primary/50 hover:shadow-[4px_4px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:-translate-x-0.5"
                )}
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Lightbulb className="h-24 w-24" />
                </div>
                <div className="mb-6 h-12 w-12 rounded-[8px] bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/30">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div className="inline-block border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary mb-3">
                  FASE DE DISEÑO
                </div>
                <h3 className="text-xl font-display font-black uppercase text-foreground">EN PLANEACIÓN</h3>
                <p className="mt-2 text-[12px] font-mono text-muted-foreground uppercase leading-relaxed h-16">
                  &gt; Idea en validación. Buscando product-market fit. Sin lanzamiento oficial.
                </p>
                <div className="mt-4 space-y-2 w-full border-t border-dashed border-border/60 pt-4">
                  {["Análisis cualitativo IA", "Evaluación de viabilidad", "Sin métricas reales"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[10px] text-foreground font-mono uppercase">
                      <Check className="h-3 w-3 text-primary" /> {f}
                    </div>
                  ))}
                </div>
              </button>

              <button
                type="button"
                onClick={() => { form.setValue("stage", "LAUNCHED"); setStep(1); }}
                className={cn(
                  "group relative flex flex-col items-start rounded-[12px] border-2 p-6 text-left transition-all duration-200 overflow-hidden",
                  watchStage === "LAUNCHED" || watchStage === "MVP" || watchStage === "GROWING"
                    ? "border-primary bg-primary/5 shadow-[8px_8px_0_rgba(var(--primary),0.3)] -translate-y-1 -translate-x-1"
                    : "border-border/60 bg-card hover:border-primary/50 hover:shadow-[4px_4px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:-translate-x-0.5"
                )}
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Rocket className="h-24 w-24" />
                </div>
                <div className="mb-6 h-12 w-12 rounded-[8px] bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/30">
                  <Rocket className="h-6 w-6" />
                </div>
                <div className="inline-block border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary mb-3">
                  FASE OPERATIVA
                </div>
                <h3 className="text-xl font-display font-black uppercase text-foreground">EN MARCHA</h3>
                <p className="mt-2 text-[12px] font-mono text-muted-foreground uppercase leading-relaxed h-16">
                  &gt; MVP funcional o producto maduro. Generando tracción o ingresos.
                </p>
                <div className="mt-4 space-y-2 w-full border-t border-dashed border-border/60 pt-4">
                  {["Score financiero", "Dashboards reales", "Análisis de retención"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[10px] text-foreground font-mono uppercase">
                      <Check className="h-3 w-3 text-primary" /> {f}
                    </div>
                  ))}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Identidad */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 border-l-4 border-primary pl-4 mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">STEP 02/04</p>
              <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-foreground">REGISTRO DE ENTIDAD</h2>
              <p className="text-muted-foreground text-[11px] font-mono uppercase">
                &gt; Identificadores clave del proyecto.
              </p>
            </div>

            <div className="rounded-[12px] border-2 border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3 mb-6 border-b-2 border-border/60 pb-4">
                <div className="h-8 w-8 bg-primary/20 border-2 border-primary/50 text-primary flex items-center justify-center rounded-[4px]">
                  <Package className="h-4 w-4" />
                </div>
                <p className="text-[13px] font-black uppercase tracking-widest font-mono">METADATA BÁSICA</p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label required>NOMBRE DEL SAAS</Label>
                  <BrutalistInput placeholder="EJ: SYSTEM_CORE_AI" {...form.register("name")} />
                  <FieldError message={form.formState.errors.name?.message} />
                </div>

                <div>
                  <Label required>SECTOR (CATEGORÍA)</Label>
                  <BrutalistSelect {...form.register("category")}>
                    {categories.map((item) => (
                      <option key={item} value={item}>{CATEGORY_LABELS[item] ?? formatEnum(item)}</option>
                    ))}
                  </BrutalistSelect>
                </div>

                <div>
                  <Label>SINOPSIS / ONE-LINER</Label>
                  <BrutalistTextarea
                    rows={2}
                    placeholder="EJ: PLATAFORMA QUE CONECTA X CON Y MEDIANTE Z..."
                    {...form.register("description")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Propuesta de valor */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 border-l-4 border-primary pl-4 mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">STEP 03/04</p>
              <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-foreground">
                VECTORES DE VALOR
              </h2>
              <p className="text-muted-foreground text-[11px] font-mono uppercase">
                &gt; Inputs directos para el modelo de análisis.
              </p>
            </div>

            <div className="rounded-[12px] border-2 border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3 mb-2 border-b-2 border-border/60 pb-4">
                <div className="h-8 w-8 bg-primary/20 border-2 border-primary/50 text-primary flex items-center justify-center rounded-[4px]">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-[13px] font-black uppercase tracking-widest font-mono">MERCADO OBJETIVO</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label required>
                    USUARIO FINAL
                    <Tooltip text="QUIÉN USA LA PLATAFORMA. EJ: DESARROLLADORES" />
                  </Label>
                  <BrutalistInput placeholder="EJ: DEVS FRONTEND" {...form.register("target_audience")} />
                  <FieldError message={form.formState.errors.target_audience?.message} />
                </div>
                <div>
                  <Label required>
                    MERCADO / TAM
                    <Tooltip text="DÓNDE OPERA. EJ: RETAIL LATAM" />
                  </Label>
                  <BrutalistInput placeholder="EJ: SECTOR TECH LATAM" {...form.register("target_market")} />
                  <FieldError message={form.formState.errors.target_market?.message} />
                </div>
              </div>
            </div>

            <div className="rounded-[12px] border-2 border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3 mb-2 border-b-2 border-border/60 pb-4">
                <div className="h-8 w-8 bg-primary/20 border-2 border-primary/50 text-primary flex items-center justify-center rounded-[4px]">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-black uppercase tracking-widest font-mono">NÚCLEO DE SOLUCIÓN</p>
                </div>
              </div>

              {isPlanning && (
                <div className="rounded-[8px] border-2 border-primary/50 bg-primary/10 p-4 mb-4">
                  <p className="text-[11px] font-mono uppercase text-foreground leading-relaxed">
                    &gt; <span className="font-black text-primary">NOTA DE SISTEMA:</span> PUEDES OMITIR CAMPOS SI NO TIENES DATOS, PERO REDUCIRÁ LA PRECISIÓN DEL MOTOR DE IA.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <Label required>
                    PROBLEMA DETECTADO
                    <Tooltip text="QUÉ DOLOR RESUELVES. EJ: PROCESOS LENTOS" />
                  </Label>
                  <BrutalistTextarea
                    rows={3}
                    placeholder="EJ: PÉRDIDA DE TIEMPO EN TAREAS MANUALES..."
                    {...form.register("main_problem")}
                  />
                  <FieldError message={form.formState.errors.main_problem?.message} />
                </div>

                <div>
                  <Label required>
                    PROPUESTA DE SOLUCIÓN
                    <Tooltip text="CÓMO LO RESUELVES. EJ: SOFTWARE IA AUTOMATIZADO" />
                  </Label>
                  <BrutalistTextarea
                    rows={3}
                    placeholder="EJ: SISTEMA AUTOMATIZADO CON IA PARA REDUCIR TIEMPOS..."
                    {...form.register("value_proposition")}
                  />
                  <FieldError message={form.formState.errors.value_proposition?.message} />
                </div>

                {isPlanning && (
                  <div className="space-y-6 pt-4 border-t-2 border-border/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>
                          ALTERNATIVAS ACTUALES
                          <Tooltip text="QUÉ USAN HOY TUS USUARIOS. EJ: EXCEL, SISTEMAS LEGACY, APPS RIVALES" />
                        </Label>
                        <BrutalistTextarea
                          rows={3}
                          placeholder="EJ: EXCEL, GOOGLE SHEETS, SOFTWARE LEGACY..."
                          {...form.register("competitors")}
                        />
                        <FieldError message={form.formState.errors.competitors?.message} />
                      </div>
                      <div>
                        <Label>
                          ESTRATEGIA GTM
                          <Tooltip text="CÓMO CONSEGUIRÁS TUS PRIMEROS CLIENTES. EJ: LINKEDIN OUTBOUND, REFERIDOS" />
                        </Label>
                        <BrutalistTextarea
                          rows={3}
                          placeholder="EJ: OUTBOUND SALES, ADS, COMUNIDADES..."
                          {...form.register("acquisition_strategy")}
                        />
                        <FieldError message={form.formState.errors.acquisition_strategy?.message} />
                      </div>
                    </div>
                    {/* Ventaja diferencial — campo clave para evaluar defensibilidad */}
                    <div className="relative">
                      <div className="absolute -top-2 left-4 z-10">
                        <span className="bg-primary px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-primary-foreground font-mono">CLAVE</span>
                      </div>
                      <div className="rounded-[8px] border-2 border-primary/50 bg-primary/5 p-4 pt-5">
                        <Label>
                          VENTAJA DIFERENCIAL
                          <Tooltip text="¿POR QUÉ TU SOLUCIÓN ES DIFÍCIL DE COPIAR? EJ: TECNOLOGÍA PROPIA, RED DE USUARIOS, DATOS EXCLUSIVOS, KNOW-HOW DE INDUSTRIA" />
                        </Label>
                        <BrutalistTextarea
                          rows={2}
                          placeholder="EJ: INTEGRACIÓN NATIVA CON SISTEMAS PERUANOS QUE COMPETIDORES IGNORAN..."
                          {...form.register("pricing_notes")}
                        />
                        <p className="mt-2 text-[9px] font-mono uppercase text-primary/70">&gt; ESTE DATO IMPACTA DIRECTAMENTE EN EL SCORE DE DEFENSIBILIDAD DEL PROYECTO.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Modelo de negocio */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 border-l-4 border-primary pl-4 mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">STEP 04/04</p>
              <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-foreground">PARAMETRIZACIÓN FINANCIERA</h2>
              <p className="text-muted-foreground text-[11px] font-mono uppercase">
                &gt; Vías de monetización y métricas base.
              </p>
            </div>

            <div className="rounded-[12px] border-2 border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3 mb-2 border-b-2 border-border/60 pb-4">
                <div className="h-8 w-8 bg-primary/20 border-2 border-primary/50 text-primary flex items-center justify-center rounded-[4px]">
                  <DollarSign className="h-4 w-4" />
                </div>
                <p className="text-[13px] font-black uppercase tracking-widest font-mono">ESTRUCTURA DE INGRESOS</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label>ARQUITECTURA DE NEGOCIO</Label>
                  <BrutalistSelect {...form.register("business_model")}>
                    {businessModels.map((item) => (
                      <option key={item} value={item}>{BM_LABELS[item] ?? formatEnum(item)}</option>
                    ))}
                  </BrutalistSelect>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>{priceLabel}</Label>
                    <BrutalistInput
                      type="number" step="0.01" min="0"
                      placeholder={isPlanning ? "0.00 (EST)" : "0.00"}
                      {...form.register("current_price", { valueAsNumber: true })}
                    />
                    <FieldError message={form.formState.errors.current_price?.message} />
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

                {isPlanning && (
                  <div className="rounded-[8px] border-2 border-primary/50 bg-primary/10 p-4">
                    <p className="text-[11px] font-mono uppercase text-foreground leading-relaxed">
                      &gt; SI DEJAS EL PRECIO EN 0, LA IA NO EVALUARÁ LA VIABILIDAD FINANCIERA EN ESTA ETAPA.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary preview before submit */}
            <div className="rounded-[12px] border-2 border-border/60 bg-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <TerminalSquare className="h-20 w-20" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-primary font-mono mb-4">/SYS/SUMMARY</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { k: "NÚCLEO", v: form.watch("name") || "N/A" },
                  { k: "FASE", v: isPlanning ? "DISEÑO" : "PROD" },
                  { k: "TIPO", v: form.watch("category") || "N/A" },
                  { k: "MODELO", v: form.watch("business_model") || "N/A" },
                ].map(({ k, v }) => (
                  <div key={k} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground font-mono">{k}</p>
                    <p className="text-[11px] font-mono font-bold text-foreground truncate mt-1">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-10 pb-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 rounded-[8px] border-2 border-border/60 bg-card px-6 py-3 text-[12px] font-black uppercase tracking-widest text-foreground hover:bg-muted transition-all active:translate-y-0.5 shadow-[4px_4px_0_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.1)] font-mono"
            >
              &lt; VOLVER
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={step === 0 ? () => setStep(1) : nextStep}
              className={cn(
                "flex items-center gap-2 rounded-[8px] border-2 border-primary bg-primary px-8 py-3 text-[12px] font-black uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-0.5 shadow-[4px_4px_0_rgba(var(--primary),0.3)] hover:shadow-[2px_2px_0_rgba(var(--primary),0.3)] font-mono",
              )}
            >
              AVANZAR &gt;
            </button>
          ) : (
            <button
              type="submit"
              disabled={mutation.isPending || !canSubmit}
              className={cn(
                "group relative flex items-center gap-2 rounded-[8px] border-2 border-primary bg-primary px-10 py-4 text-[13px] font-black uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-0.5 shadow-[6px_6px_0_rgba(var(--primary),0.4)] hover:shadow-[3px_3px_0_rgba(var(--primary),0.4)] disabled:opacity-50 disabled:cursor-not-allowed font-mono overflow-hidden",
              )}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {mutation.isPending ? (
                <span className="relative z-10 flex items-center gap-2">EJECUTANDO...</span>
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4" /> INICIALIZAR SAAS
                </span>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

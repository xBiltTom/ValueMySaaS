"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  ArrowRight, Lightbulb, Rocket, Sparkles, HelpCircle,
  Package, Users, Globe, Brain, DollarSign, Check
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatEnum } from "@/lib/utils";
import { createProject } from "@/features/projects/api";
import {
  businessModels, categories, createProjectSchema, CreateProjectFormValues,
} from "@/features/projects/schemas";
import { cn } from "@/lib/utils";
import { useState } from "react";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-sm font-bold text-foreground mb-2">
      {children} {required && <span className="text-red-500">*</span>}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] font-semibold text-red-500 flex items-center gap-1"><span>↑</span> {message}</p>;
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-1.5">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help inline" />
      <span className="pointer-events-none absolute left-0 top-6 z-50 hidden w-52 rounded-xl border border-border bg-white p-3 text-xs text-muted-foreground shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

function StepIndicator({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 transition-all", active ? "opacity-100" : "opacity-40")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-all",
        done ? "bg-emerald-500 border-emerald-500 text-white" : active ? "bg-primary border-primary text-white" : "bg-white border-border text-muted-foreground"
      )}>
        {done ? <Check className="h-3.5 w-3.5" /> : step}
      </div>
      <span className={cn("text-xs font-semibold hidden sm:block", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

const STEPS = [
  { label: "Tipo de proyecto" },
  { label: "Tu idea" },
  { label: "Propuesta de valor" },
  { label: "Modelo de negocio" },
];

function PremiumInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-border bg-white px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/50 outline-none transition-all",
        "focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]",
        className
      )}
      {...props}
    />
  );
}

function PremiumSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-border bg-white px-4 py-3.5 text-base text-foreground outline-none transition-all appearance-none cursor-pointer",
        "focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]",
        className
      )}
      {...props}
    />
  );
}

function PremiumTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-border bg-white px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/50 outline-none transition-all resize-none",
        "focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]",
        className
      )}
      {...props}
    />
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  EDTECH: "📚 EdTech — Educación", FINTECH: "💳 FinTech — Finanzas",
  HEALTHTECH: "🏥 HealthTech — Salud", PRODUCTIVITY: "⚡ Productividad",
  MARKETING: "📣 Marketing", ECOMMERCE: "🛍 E-commerce",
  AI: "🤖 Inteligencia Artificial", DEVELOPER_TOOLS: "🛠 Dev Tools",
  OTHER: "📦 Otro",
};

const BM_LABELS: Record<string, string> = {
  B2B: "B2B — Le vendes a empresas", B2C: "B2C — Le vendes a personas",
  B2B2C: "B2B2C — Empresas y personas", FREEMIUM: "Freemium — Gratis con plan premium",
  SUBSCRIPTION: "Suscripción mensual/anual", ONE_TIME: "Pago único",
  OTHER: "Otro modelo",
};

export function ProjectForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "", description: "", category: "PRODUCTIVITY",
      stage: "PLANNING", business_model: "SUBSCRIPTION",
      target_market: "", target_audience: "",
      main_problem: "", value_proposition: "",
      current_price: 0, currency: "USD",
    },
  });

  const watchStage = form.watch("stage");
  const watchBusinessModel = form.watch("business_model");
  const isPlanning = watchStage === "PLANNING" || watchStage === "IDEA";

  let priceLabel = "Precio mensual estimado";
  if (watchBusinessModel === "FREEMIUM") priceLabel = "Precio del plan premium";
  if (watchBusinessModel === "ONE_TIME") priceLabel = "Precio único de compra";
  if (watchBusinessModel === "B2B" || watchBusinessModel === "B2B2C") priceLabel = "Ticket promedio estimado";

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate({ ...values, country_focus: "Peru", pricing_notes: "", is_public_sample: false });
  });

  const nextStep = async () => {
    // Validate current step fields before advancing
    let fieldsToValidate: (keyof CreateProjectFormValues)[] = [];
    if (step === 1) fieldsToValidate = ["name", "category", "description"];
    if (step === 2) fieldsToValidate = ["target_audience", "target_market", "main_problem", "value_proposition"];
    
    if (fieldsToValidate.length) {
      const valid = await form.trigger(fieldsToValidate);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step progress bar */}
      <div className="flex items-center justify-between mb-10 px-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-0 flex-1">
            <StepIndicator step={i + 1} label={s.label} active={i === step} done={i < step} />
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-2 h-px bg-border hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {mutation.isError ? <div className="mb-6"><ErrorState message={getApiErrorMessage(mutation.error)} /></div> : null}

      <form onSubmit={onSubmit}>
        {/* Step 0: Tipo de proyecto */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2 pb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Paso 1 de 4</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold">¿En qué fase está tu proyecto?</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Esto define cómo analizaremos y evaluaremos tu SaaS.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { form.setValue("stage", "PLANNING"); setStep(1); }}
                className={cn(
                  "group relative flex flex-col items-start rounded-3xl border-2 p-7 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]",
                  watchStage === "PLANNING" || watchStage === "IDEA"
                    ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg shadow-amber-100"
                    : "border-border bg-white hover:border-amber-300"
                )}
              >
                <div className="mb-5 rounded-2xl bg-amber-100 p-3.5 text-amber-600">
                  <Lightbulb className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                    🎓 Para estudiantes
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold text-foreground">En Planeación</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Tengo una idea. Estoy validando el problema, el mercado o el modelo de negocio. Aún no he lanzado.
                </p>
                <div className="mt-5 space-y-2">
                  {["Análisis cualitativo con IA", "Evaluación por pesos (viabilidad)", "Sin métricas financieras reales"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-amber-800 font-medium">
                      <span className="text-amber-500">✓</span> {f}
                    </div>
                  ))}
                </div>
                <div className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => { form.setValue("stage", "LAUNCHED"); setStep(1); }}
                className={cn(
                  "group relative flex flex-col items-start rounded-3xl border-2 p-7 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]",
                  watchStage === "LAUNCHED" || watchStage === "MVP" || watchStage === "GROWING"
                    ? "border-primary bg-gradient-to-br from-indigo-50 to-violet-50 shadow-lg shadow-primary/10"
                    : "border-border bg-white hover:border-primary/40"
                )}
              >
                <div className="mb-5 rounded-2xl bg-primary/10 p-3.5 text-primary">
                  <Rocket className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                    📊 Con datos reales
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold text-foreground">Ya está en Marcha</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Tengo usuarios, ingresos o al menos un MVP funcionando. Quiero medir KPIs y salud financiera.
                </p>
                <div className="mt-5 space-y-2">
                  {["Score financiero automatizado", "Dashboard con métricas reales", "Análisis de retención y crecimiento"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-primary font-medium">
                      <span className="text-primary">✓</span> {f}
                    </div>
                  ))}
                </div>
                <div className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Identidad */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2 pb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Paso 2 de 4</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold">Tu SaaS, con nombre y categoría</h2>
              <p className="text-muted-foreground text-sm">Cuéntanos en qué área opera tu proyecto.</p>
            </div>

            <div className={cn(
              "rounded-3xl border p-6 space-y-5",
              isPlanning ? "border-amber-200 bg-amber-50/40" : "border-primary/15 bg-primary/5"
            )}>
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("rounded-xl p-2", isPlanning ? "bg-amber-100" : "bg-primary/10")}>
                  <Package className={cn("h-5 w-5", isPlanning ? "text-amber-600" : "text-primary")} />
                </div>
                <p className="text-sm font-bold text-foreground">Identidad del proyecto</p>
              </div>

              <div>
                <Label required>¿Cómo se llama tu SaaS?</Label>
                <PremiumInput placeholder="Ej: StudyFlow, ConnectPE, TaskAI..." {...form.register("name")} />
                <FieldError message={form.formState.errors.name?.message} />
              </div>

              <div>
                <Label required>¿En qué categoría cae?</Label>
                <PremiumSelect {...form.register("category")}>
                  {categories.map((item) => (
                    <option key={item} value={item}>{CATEGORY_LABELS[item] ?? formatEnum(item)}</option>
                  ))}
                </PremiumSelect>
              </div>

              <div>
                <Label>Descripción en una oración</Label>
                <PremiumTextarea
                  rows={2}
                  placeholder="Ej: Una plataforma que conecta proveedores con tiendas locales usando IA..."
                  {...form.register("description")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Propuesta de valor */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2 pb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Paso 3 de 4</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold">
                {isPlanning ? "¿Qué problema resuelves?" : "Tu mercado y propuesta"}
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {isPlanning
                  ? "Esta información alimentará directamente el análisis de IA. Entre más detallado, mejor."
                  : "Define claramente tu mercado para análisis más precisos."}
              </p>
            </div>

            <div className={cn(
              "rounded-3xl border p-6 space-y-5",
              isPlanning ? "border-amber-200 bg-amber-50/40" : "border-primary/15 bg-primary/5"
            )}>
              <div className="flex items-center gap-3 mb-1">
                <div className={cn("rounded-xl p-2", isPlanning ? "bg-amber-100" : "bg-primary/10")}>
                  <Users className={cn("h-5 w-5", isPlanning ? "text-amber-600" : "text-primary")} />
                </div>
                <p className="text-sm font-bold">Para quién es</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>
                    ¿Quién es tu usuario final?
                    <Tooltip text="Ej: 'Estudiantes universitarios que trabajan y estudian'" />
                  </Label>
                  <PremiumInput placeholder="Ej: Dueños de bodegas en Lima" {...form.register("target_audience")} />
                  <FieldError message={form.formState.errors.target_audience?.message} />
                </div>
                <div>
                  <Label required>
                    ¿En qué mercado operas?
                    <Tooltip text="Ej: 'Sector retail LATAM', 'Universidades de Perú'" />
                  </Label>
                  <PremiumInput placeholder="Ej: Comercio informal peruano" {...form.register("target_market")} />
                  <FieldError message={form.formState.errors.target_market?.message} />
                </div>
              </div>
            </div>

            <div className={cn(
              "rounded-3xl border p-6 space-y-5",
              isPlanning ? "border-violet-200 bg-violet-50/30" : "border-primary/15 bg-primary/5"
            )}>
              <div className="flex items-center gap-3 mb-1">
                <div className={cn("rounded-xl p-2", isPlanning ? "bg-violet-100" : "bg-primary/10")}>
                  <Brain className={cn("h-5 w-5", isPlanning ? "text-violet-600" : "text-primary")} />
                </div>
                <div>
                  <p className="text-sm font-bold">Tu propuesta de valor</p>
                  {isPlanning && <p className="text-xs text-violet-600 font-medium">⚡ La IA usará esto para evaluarte</p>}
                </div>
              </div>

              <div>
                <Label required>
                  ¿Qué problema resuelves?
                  <Tooltip text="Describe el dolor real que sufre tu usuario. Ej: 'No pueden encontrar proveedores confiables'" />
                </Label>
                <PremiumTextarea
                  rows={3}
                  placeholder={isPlanning
                    ? "Ej: Los dueños de tiendas pierden tiempo buscando proveedores en grupos de WhatsApp..."
                    : "Ej: Las pymes gastan hasta 4 horas semanales gestionando inventarios manualmente..."}
                  {...form.register("main_problem")}
                />
                <FieldError message={form.formState.errors.main_problem?.message} />
              </div>

              <div>
                <Label required>
                  ¿Cuál es tu solución?
                  <Tooltip text="Describe en qué se diferencia tu producto de lo que ya existe" />
                </Label>
                <PremiumTextarea
                  rows={3}
                  placeholder={isPlanning
                    ? "Ej: Una red social B2B donde proveedores publican catálogos y tiendas hacen pedidos directos..."
                    : "Ej: Sistema de inventario con alertas automáticas e integración con Mercado Libre..."}
                  {...form.register("value_proposition")}
                />
                <FieldError message={form.formState.errors.value_proposition?.message} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Modelo de negocio */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2 pb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Paso 4 de 4</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold">Modelo de ingresos</h2>
              <p className="text-muted-foreground text-sm">
                {isPlanning ? "Define cómo planeas monetizar. Puedes cambiarlo después." : "¿Cómo gana dinero tu SaaS?"}
              </p>
            </div>

            <div className={cn(
              "rounded-3xl border p-6 space-y-5",
              isPlanning ? "border-amber-200 bg-amber-50/40" : "border-primary/15 bg-primary/5"
            )}>
              <div className="flex items-center gap-3 mb-1">
                <div className={cn("rounded-xl p-2", isPlanning ? "bg-amber-100" : "bg-primary/10")}>
                  <DollarSign className={cn("h-5 w-5", isPlanning ? "text-amber-600" : "text-primary")} />
                </div>
                <p className="text-sm font-bold">¿Cómo cobras?</p>
              </div>

              <div>
                <Label>Modelo de ingresos</Label>
                <PremiumSelect {...form.register("business_model")}>
                  {businessModels.map((item) => (
                    <option key={item} value={item}>{BM_LABELS[item] ?? formatEnum(item)}</option>
                  ))}
                </PremiumSelect>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    {priceLabel}
                    <Tooltip text="Si aún no tienes precio fijo, pon tu estimación más realista" />
                  </Label>
                  <PremiumInput
                    type="number" step="0.01" min="0"
                    placeholder={isPlanning ? "0.00 (estimado)" : "0.00"}
                    {...form.register("current_price", { valueAsNumber: true })}
                  />
                  <FieldError message={form.formState.errors.current_price?.message} />
                </div>
                <div>
                  <Label>Moneda</Label>
                  <PremiumSelect {...form.register("currency")}>
                    <option value="USD">🇺🇸 USD ($)</option>
                    <option value="PEN">🇵🇪 PEN (S/)</option>
                    <option value="MXN">🇲🇽 MXN ($)</option>
                    <option value="COP">🇨🇴 COP ($)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                  </PremiumSelect>
                </div>
              </div>

              {isPlanning && (
                <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-4 flex gap-3">
                  <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">¿No sabes el precio exacto?</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      En planeación, el precio es una estimación. La IA evaluará si tu estrategia de precios es viable para el mercado que apuntas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary preview before submit */}
            <div className="rounded-3xl border border-border bg-white p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resumen de tu proyecto</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { k: "Nombre", v: form.watch("name") || "—" },
                  { k: "Fase", v: isPlanning ? "Planeación" : "En marcha" },
                  { k: "Categoría", v: CATEGORY_LABELS[form.watch("category")]?.split("—")[0]?.trim() || "—" },
                  { k: "Modelo", v: BM_LABELS[form.watch("business_model")]?.split("—")[0]?.trim() || "—" },
                ].map(({ k, v }) => (
                  <div key={k} className="rounded-xl bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-semibold text-foreground truncate">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-8 pb-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 rounded-2xl border border-border bg-white px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            >
              ← Anterior
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={step === 0 ? () => setStep(1) : nextStep}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95",
                isPlanning
                  ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200"
                  : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              )}
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={mutation.isPending}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg",
                isPlanning
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200"
                  : "bg-gradient-to-r from-primary to-violet-600 shadow-primary/25"
              )}
            >
              {mutation.isPending
                ? "Guardando..."
                : <><Sparkles className="h-5 w-5" /> {isPlanning ? "Crear proyecto y analizar" : "Crear proyecto"}</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

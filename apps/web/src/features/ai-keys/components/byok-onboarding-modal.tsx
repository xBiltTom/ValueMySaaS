"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, ExternalLink, KeyRound, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

interface ByokOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  {
    id: "GEMINI",
    name: "Google AI Studio",
    badge: "Más fácil",
    badgeClass: "bg-primary/15 text-primary border border-primary/20",
    icon: "✦",
    iconClass: "bg-blue-500/10 text-blue-500",
    description: "Capa gratuita generosa. Ideal para empezar. No requiere tarjeta de crédito.",
    steps: [
      "Ve a aistudio.google.com",
      "Inicia sesión con tu cuenta Google",
      'Clic en "Get API key" → "Create API key"',
      "Copia la key y pégala aquí",
    ],
    modelExample: "gemini/gemini-1.5-flash",
    quota: "~1,500 solicitudes / día",
  },
  {
    id: "GROQ",
    name: "Groq Cloud",
    badge: "Más rápido",
    badgeClass: "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
    icon: "⚡",
    iconClass: "bg-status-warning-bg text-status-warning-fg",
    description: "Inferencia ultrarrápida. Llama 3 y Mixtral disponibles en capa gratuita.",
    steps: [
      "Ve a console.groq.com",
      "Crea una cuenta (email o GitHub)",
      'Ve a "API Keys" → "Create API Key"',
      "Copia la key y pégala aquí",
    ],
    modelExample: "groq/llama-3.3-70b-versatile",
    quota: "~14,400 tokens / minuto",
  },
];

export function ByokOnboardingModal({ isOpen, onClose }: ByokOnboardingModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleGoToSettings = () => {
    onClose();
    router.push("/settings/ai-keys");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden rounded-2xl border-border bg-background gap-0">
        {/* Header */}
        <div className="relative overflow-hidden px-7 pt-7 pb-6 border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold tracking-tight text-foreground">
                Activa tu propia API Key
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Tus créditos gratuitos se agotaron. Configura una key propia para seguir usando el análisis IA — ambas opciones son <strong className="text-foreground font-semibold">completamente gratis</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 space-y-6">
          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold">1</div>
              <span className="text-sm font-semibold text-foreground">Elige un proveedor y obtén tu key gratuita</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  className="relative rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-base ${p.iconClass}`}>
                        {p.icon}
                      </div>
                      <span className="font-semibold text-sm text-foreground">{p.name}</span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.badgeClass}`}>
                      {p.badge}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>

                  <ol className="space-y-1.5">
                    {p.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="pt-1 border-t border-border/60">
                    <p className="text-[11px] text-muted-foreground mb-1.5">Modelo recomendado:</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(p.modelExample)}
                      className="flex items-center gap-1.5 w-full rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs font-mono text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Copy className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{p.modelExample}</span>
                      {copied === p.modelExample && (
                        <span className="text-status-success-text text-[10px] font-sans font-medium">¡Copiado!</span>
                      )}
                    </button>
                    <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" /> {p.quota}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold">2</div>
              <span className="text-sm font-semibold text-foreground">Registra la key en Configuración → IA</span>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground leading-relaxed">
              Ve a <strong className="text-foreground">Configuración → API Keys IA</strong>, selecciona el proveedor que elegiste, pega tu key y guárdala. La key se almacena cifrada y nunca sale de tu cuenta.
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold">3</div>
              <span className="text-sm font-semibold text-foreground">Al generar el análisis, selecciona tu key y el modelo</span>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground leading-relaxed">
              En el selector de análisis verás tus keys registradas. Selecciona la key y el modelo que copiaste arriba. A partir de ese momento, el análisis usa tu key sin consumir créditos del sistema.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex flex-col sm:flex-row items-center gap-3 border-t border-border pt-5">
          <Button
            onClick={handleGoToSettings}
            className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-semibold gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Ir a Configuración → IA
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl text-muted-foreground"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

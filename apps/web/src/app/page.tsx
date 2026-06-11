import Link from "next/link";
import { ArrowRight, BrainCircuit, LineChart, RefreshCcw, ShieldAlert, Sparkles, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="noise-bg min-h-screen overflow-hidden bg-background text-foreground">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 relative z-10">
        <Link href="/" className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-3 h-3 bg-accent rounded-sm shadow-[0_0_10px_var(--accent)]"></div>
          ValueMySaaS
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Ingresar
          </Link>
          <Link href="/register" className="btn-premium rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_var(--ring)] hover:opacity-90">
            Empezar <ChevronRight className="inline h-4 w-4 ml-1" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient relative mx-auto grid min-h-[85vh] max-w-7xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur px-4 py-1.5 text-xs font-semibold text-foreground uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            ITSM & Mejora Continua para SaaS
          </div>
          
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-[5rem]">
            Evalúa el valor de tu <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">micro-SaaS.</span>
          </h1>
          
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Registra métricas, genera diagnósticos, visualiza riesgos y convierte tus datos en reportes
            accionables. Decide si escalar, pivotar o pausar con confianza.
          </p>
          
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/register" className="btn-premium inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-primary-foreground shadow-[0_0_30px_var(--ring)] hover:opacity-90">
              Crear cuenta gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="inline-flex h-14 items-center justify-center rounded-lg border border-border bg-card/50 backdrop-blur px-8 text-base font-bold hover:bg-muted transition-colors">
              Ya tengo acceso
            </Link>
          </div>
        </div>

        {/* Hero Visual / Bento Box */}
        <div className="relative z-10">
          <div className="bento-card p-6">
            <div className="grid gap-4">
              <div className="rounded-xl bg-primary p-6 text-primary-foreground relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Decisión de IA Recomendada</p>
                <p className="font-display text-3xl font-bold">Mejorar antes de escalar</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {["Finanzas", "Crecimiento", "Retención", "Riesgo"].map((item, index) => (
                  <div key={item} className="rounded-xl border border-border bg-background p-5">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">{item}</p>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-accent" 
                        style={{ width: `${85 - index * 15}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="border-y border-border bg-card/30 px-6 py-24 relative">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <h2 className="font-display text-4xl font-bold">Métricas que importan</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl">Indicadores reales para entender el valor, la estabilidad y la próxima acción de tu producto digital.</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Finanzas", LineChart, "Ingresos recurrentes, churn revenue y runway."],
              ["Crecimiento", Sparkles, "Adquisición de usuarios y tasas de conversión."],
              ["Retención", RefreshCcw, "Stickiness, DAU/MAU y health score."],
              ["Producto", BrainCircuit, "Uso de features clave y feedback de usuarios."],
              ["Riesgo", ShieldAlert, "Deuda técnica, dependencia de APIs y compliance."],
            ].map(([label, Icon, desc], i) => (
              <div key={String(label)} className={`bento-card p-8 ${i === 0 || i === 3 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{String(label)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {String(desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="mx-auto max-w-7xl px-6 py-32">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] items-center">
          <div>
            <h2 className="font-display text-4xl font-bold md:text-5xl">Flujo de mejora<br/>continua</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              El núcleo es el scoring operativo: registrar tu SaaS, cargar métricas, detectar riesgos y priorizar
              decisiones. La capa IA BYOK (Bring Your Own Key) entra como complemento avanzado cuando decidas 
              conectar tu propia API.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Registra tu SaaS",
              "Captura métricas",
              "Genera el Score",
              "Revisa el Dashboard",
              "Exporta Reportes",
              "Análisis IA BYOK",
            ].map((step, index) => (
              <div key={step} className="bento-card p-6 flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-foreground">{step}</p>
                  <p className="text-xs text-muted-foreground mt-1">Paso estructurado en el pipeline.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-background to-background"></div>
        <div className="mx-auto max-w-4xl relative z-10 text-center">
          <h2 className="font-display text-5xl font-bold mb-6">¿Listo para auditar tu SaaS?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Gestión de servicios TI aplicada a SaaS emergentes. El MVP conecta valor, riesgo y decisiones.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/register" className="btn-premium inline-flex h-14 items-center justify-center rounded-lg bg-primary px-10 text-base font-bold text-primary-foreground shadow-[0_0_20px_var(--ring)]">
              Comenzar ahora
            </Link>
            <Link href="/login" className="inline-flex h-14 items-center justify-center rounded-lg border border-border bg-background px-10 text-base font-bold hover:bg-muted transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-8 text-center bg-background">
        <p className="text-sm font-semibold text-muted-foreground">© {new Date().getFullYear()} ValueMySaaS. Crafted for builders.</p>
      </footer>
    </main>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Leaf,
  LineChart,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  { label: "Finanzas", icon: LineChart, desc: "Ingresos recurrentes, churn revenue y runway financiero." },
  { label: "Crecimiento", icon: Sparkles, desc: "Adquisición de usuarios y tasas de conversión reales." },
  { label: "Retención", icon: RefreshCcw, desc: "Stickiness, DAU/MAU y health score de clientes." },
  { label: "Producto", icon: BrainCircuit, desc: "Adopción de features clave y feedback de usuarios." },
  { label: "Riesgo", icon: ShieldAlert, desc: "Deuda técnica, dependencia de APIs y compliance." },
];

const steps = [
  "Registra tu SaaS",
  "Captura métricas",
  "Genera el Score",
  "Revisa el Dashboard",
  "Exporta Reportes",
  "Análisis IA BYOK",
];

const perks = ["Sin tarjeta de crédito", "Setup en 5 minutos", "BYOK para IA avanzada"];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Sticky navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold text-foreground">ValueMySaaS</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden h-10 items-center px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
            >
              Empezar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient px-5 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Text */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Para fundadores de micro-SaaS
              </div>

              <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-[3.5rem]">
                Evalúa el valor de tu{" "}
                <span className="text-primary">micro-SaaS</span>{" "}
                con datos reales.
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Registra métricas, genera diagnósticos y toma decisiones con confianza.
                ¿Escalar, pivotar o pausar? Los datos te lo dirán.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
                >
                  Crear cuenta gratis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-border bg-card px-8 text-base font-bold text-foreground transition hover:bg-muted active:scale-95"
                >
                  Ya tengo acceso
                </Link>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {perks.map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Score preview card */}
            <div className="bento-card max-w-sm mx-auto w-full p-6 lg:max-w-none">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Decisión recomendada por IA
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
                Mejorar antes de escalar
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {["Finanzas", "Crecimiento", "Retención", "Riesgo"].map((item, i) => (
                  <div key={item} className="rounded-xl bg-muted p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{item}</p>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${88 - i * 15}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-primary/8 p-4">
                <p className="text-sm font-semibold text-primary">
                  Score de sostenibilidad: 72 / 100
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Viable con ajustes — prioriza retención y runway.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-muted/40 px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-xl">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Métricas que importan
            </h2>
            <p className="mt-4 text-muted-foreground">
              Indicadores reales para entender el valor, la estabilidad y la próxima acción de tu producto.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ label, icon: Icon, desc }) => (
              <div key={label} className="bento-card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-xl">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Flujo de mejora continua
            </h2>
            <p className="mt-4 text-muted-foreground">
              Del registro a la decisión, en pasos claros. La IA BYOK es el complemento avanzado cuando lo necesites.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step} className="bento-card flex items-start gap-4 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{step}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Paso estructurado en el pipeline.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
            ¿Listo para auditar tu SaaS?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/70">
            Empieza gratis hoy. Sin compromisos, sin tarjeta de crédito.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-white px-10 text-base font-bold text-primary transition hover:opacity-95 active:scale-95"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-xl border border-white/30 px-10 text-base font-bold text-primary-foreground transition hover:bg-white/10 active:scale-95"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ValueMySaaS — Crafted for builders.
        </p>
      </footer>
    </main>
  );
}

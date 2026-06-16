import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Terminal,
  Cpu,
  Zap,
  Globe,
  LineChart,
  GitPullRequest,
  Rocket,
  CheckCircle2
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground relative selection:bg-primary/30 selection:text-primary-foreground overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(150,150,150,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,150,150,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Sticky navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-foreground text-background transition-transform group-hover:scale-105 group-hover:rotate-3 shadow-sm">
              <Terminal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">ValueMySaaS</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden h-9 sm:h-10 items-center px-3 sm:px-4 text-xs sm:text-sm font-bold text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 sm:h-10 items-center justify-center rounded-[12px] sm:rounded-[14px] bg-foreground px-3 sm:px-5 text-xs sm:text-sm font-bold text-background shadow-sm transition hover:scale-105 active:scale-95"
            >
              Empezar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-6 md:px-8 pt-24 sm:pt-32 pb-20 sm:pb-24 md:pt-40 md:pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-md mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse" />
          <span className="text-[11px] sm:text-[13px] font-mono font-semibold text-primary tracking-tight">v2.0.0 is live for vibecoders</span>
        </div>

        <h1 className="max-w-5xl font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 leading-[1.1] sm:leading-[1.1]">
          Deja de <span className="text-muted-foreground/40 line-through decoration-destructive decoration-[3px] sm:decoration-[4px]">adivinar</span>.<br/>
          Empieza a <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-blue-500">medir</span>.
        </h1>

        <p className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground mb-10 sm:mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 px-2 sm:px-0">
          Diseñado para vibecoders y estudiantes universitarios que construyen side-projects reales. Evalúa tu código, tracción y modelo de negocio con IA antes de lanzar a producción.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <Link
            href="/register"
            className="group relative inline-flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-[20px] bg-foreground px-8 text-base font-bold text-background transition-all hover:scale-105 active:scale-95 overflow-hidden shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:shadow-[0_0_30px_rgba(var(--primary),0.3)]"
          >
            <span className="relative">Crear Cuenta</span>
            <ArrowRight className="relative h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="/login"
            className="group inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-[20px] border border-border/60 bg-card/30 backdrop-blur-md px-8 text-base font-bold text-foreground transition-all hover:bg-muted/50 hover:border-border active:scale-95"
          >
            Iniciar Sesión
          </Link>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="relative z-10 px-4 sm:px-6 md:px-8 py-16 sm:py-24 border-y border-border/20 bg-muted/5 backdrop-blur-3xl">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 sm:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 text-center md:text-left">
            <div className="max-w-2xl mx-auto md:mx-0">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                El stack de auditoría.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground font-medium">Todo lo que necesitas para saber si tu side-project tiene futuro o es otro dominio abandonado en tu cuenta de Namecheap.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-[auto] sm:auto-rows-[280px]">
            {/* Feature 1 - Large */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-border/40 bg-card/40 p-6 sm:p-8 hover:bg-card/80 transition-colors shadow-sm hover:shadow-md min-h-[220px] sm:min-h-0">
              <div className="absolute -top-10 -right-10 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                <LineChart className="h-48 w-48 sm:h-64 sm:w-64 text-primary" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 border border-primary/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                  <LineChart className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Métricas Financieras</h3>
                <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-md">Calcula MRR, burn rate y churn. Olvídate de los excels rotos; visualiza tu runway en tiempo real.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-border/40 bg-card/40 p-6 sm:p-8 hover:bg-card/80 transition-colors shadow-sm hover:shadow-md min-h-[220px] sm:min-h-0">
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 sm:mb-6 border border-accent/20 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Tracción Real</h3>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">Mide la retención y el product-market fit verdadero (no likes).</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-border/40 bg-card/40 p-6 sm:p-8 hover:bg-card/80 transition-colors shadow-sm hover:shadow-md min-h-[220px] sm:min-h-0">
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 sm:mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Code2 className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Deuda Técnica</h3>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">Audita la escalabilidad de tu código espagueti escrito a las 3 AM.</p>
              </div>
            </div>

            {/* Feature 4 - Large */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-border/40 bg-card/40 p-6 sm:p-8 hover:bg-card/80 transition-colors shadow-sm hover:shadow-md min-h-[220px] sm:min-h-0">
              <div className="absolute -top-10 -right-10 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                <BrainCircuit className="h-48 w-48 sm:h-64 sm:w-64 text-purple-500" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 sm:mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <BrainCircuit className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Roasteo con IA (BYOK)</h3>
                <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl">Conecta tu propia API Key y deja que la IA analice sin piedad tu modelo de negocio, detectando vulnerabilidades antes que tus usuarios.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Terminal */}
      <section className="relative z-10 px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32 overflow-hidden bg-background">
        <div className="mx-auto max-w-4xl relative">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">El pipeline de la verdad</h2>
            <p className="text-base sm:text-lg text-muted-foreground font-medium px-4 sm:px-0">No necesitas un MBA. Solo sigue el flujo y deja que los datos hablen.</p>
          </div>

          {/* Terminal Window */}
          <div className="rounded-[16px] sm:rounded-[24px] border border-border/50 bg-card shadow-2xl overflow-hidden group hover:border-primary/30 transition-colors duration-500 mx-1 sm:mx-0">
            <div className="h-10 sm:h-12 border-b border-border/50 bg-muted/40 flex items-center px-3 sm:px-4 gap-2">
              <div className="flex gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500/80" />
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto font-mono text-[10px] sm:text-[11px] text-muted-foreground/80 font-semibold tracking-widest uppercase flex items-center gap-1.5 sm:gap-2">
                <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                val-cli
              </div>
            </div>
            <div className="p-4 sm:p-6 md:p-10 bg-background/30 font-mono text-xs sm:text-sm md:text-base leading-relaxed overflow-x-auto whitespace-pre-wrap sm:whitespace-normal">
              <div className="text-primary mb-2 font-semibold">$ val-cli init my-startup</div>
              <div className="text-muted-foreground mb-6 opacity-80">{`> Creando proyecto... [OK]`}</div>

              <div className="text-primary mb-2 font-semibold">$ val-cli analyze --metrics</div>
              <div className="text-muted-foreground mb-6 opacity-80">{`> Ingresando MRR, Burn Rate y CAC... [OK]`}</div>

              <div className="text-primary mb-2 font-semibold">$ val-cli generate-score</div>
              <div className="text-foreground mb-3 flex items-center gap-2 font-medium">
                <span className="animate-spin text-accent inline-block">⠋</span> Procesando con IA heurística...
              </div>
              
              <div className="border border-border/40 rounded-2xl p-5 bg-card/50 my-6 text-muted-foreground shadow-sm">
                <div className="text-accent font-bold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> 
                  RESULTADO DEL SCORE: 78/100
                </div>
                <div className="mb-2">- Financieramente viable (Runway {`>`} 12m)</div>
                <div className="mb-2">- Retención necesita atención inmediata (Churn {`>`} 5%)</div>
                <div>- Arquitectura escalable [Supabase/Vercel detectado]</div>
              </div>

              <div className="text-primary font-semibold flex items-center gap-1">
                $ <span className="animate-pulse bg-primary h-4 w-2.5 inline-block ml-1"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-4 sm:px-6 md:px-8 py-20 sm:py-24 md:py-40 text-center border-t border-border/20">
        <div className="absolute inset-0 bg-primary/5 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-foreground mb-4 sm:mb-6 relative">
          Tu próximo MRR empieza aquí.
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium mb-8 sm:mb-12 max-w-xl mx-auto relative px-2 sm:px-0">
          Únete a los vibecoders que ya validan sus side-projects con datos, no con falsas esperanzas.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative w-full sm:w-auto">
          <Link
            href="/register"
            className="inline-flex h-14 sm:h-16 w-full sm:w-auto items-center justify-center gap-2 sm:gap-3 rounded-[20px] sm:rounded-[24px] bg-foreground px-8 sm:px-10 text-base sm:text-lg font-bold text-background shadow-[0_0_30px_rgba(var(--foreground),0.1)] transition-all hover:scale-105 active:scale-95"
          >
            <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
            Empezar Gratis Ahora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-10 text-center">
        <p className="text-sm font-medium text-muted-foreground/60 flex items-center justify-center gap-2">
          <Terminal className="h-4 w-4" />
          © {new Date().getFullYear()} ValueMySaaS — Crafted for builders.
        </p>
      </footer>
    </main>
  );
}

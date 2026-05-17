import Link from "next/link";
import { ArrowRight, BrainCircuit, LineChart, RefreshCcw, ShieldAlert, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="grain min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-lg font-black tracking-tight">ValueMySaaS</Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Ingresar
          </Link>
          <Link href="/register" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-[#245448]">
            Empezar
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-sm font-semibold text-primary">
            ITSM, sostenibilidad y mejora continua para SaaS
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-[#16110d] md:text-7xl">
            Evalua el valor y sostenibilidad de tu micro-SaaS
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            ValueMySaaS convierte metricas de negocio, crecimiento y operacion en diagnosticos claros
            para decidir si continuar, mejorar, pivotar o pausar tu producto digital.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_16px_45px_rgba(23,63,53,0.22)] hover:bg-[#245448]">
              Crear cuenta
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-white/75 px-5 text-sm font-semibold hover:bg-white">
              Ya tengo acceso
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-lg border border-border bg-[#fffdf8]/90 p-4 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="grid gap-3">
              <div className="rounded-md bg-primary p-5 text-primary-foreground">
                <p className="text-sm opacity-80">Decision recomendada</p>
                <p className="mt-3 text-3xl font-semibold">Mejorar antes de escalar</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Finanzas", "Crecimiento", "Retencion", "Riesgo"].map((item, index) => (
                  <div key={item} className="rounded-md border border-border bg-white p-4">
                    <p className="text-sm text-muted-foreground">{item}</p>
                    <div className="mt-4 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${72 - index * 11}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-[#fffdf8] px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-5">
          {[
            ["Finanzas", LineChart],
            ["Crecimiento", Sparkles],
            ["Retencion", RefreshCcw],
            ["Producto", BrainCircuit],
            ["Riesgo", ShieldAlert],
          ].map(([label, Icon]) => (
            <div key={String(label)} className="rounded-lg border border-border p-5">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 font-semibold">{String(label)}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Indicadores reales para entender valor, estabilidad y proxima accion.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-3">
        <div>
          <h2 className="font-display text-4xl font-semibold">Mejora continua, no solo reportes</h2>
        </div>
        <p className="text-sm leading-7 text-muted-foreground md:col-span-2">
          El nucleo es el scoring operativo: registrar SaaS, cargar metricas, detectar riesgo y priorizar
          decisiones. La IA BYOK entra como complemento avanzado para analisis contextual cuando el usuario
          quiera conectar su propia API Key.
        </p>
      </section>
    </main>
  );
}

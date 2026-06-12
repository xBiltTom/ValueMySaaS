import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-2xl bg-primary/10">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 52L28 20L38 36L46 24L58 52H8Z"
              fill="var(--primary)"
              fillOpacity="0.15"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="34" cy="47" r="3" fill="var(--primary)" />
            <path
              d="M34 40V28"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="mb-2 font-display text-6xl font-bold tracking-tight text-primary">404</p>
        <h1 className="mb-3 font-display text-2xl font-bold text-foreground">
          Página no encontrada
        </h1>
        <p className="mb-8 text-base leading-relaxed text-muted-foreground">
          La página que buscas no existe o fue movida. Vuelve al inicio para continuar.
        </p>

        <Link
          href="/"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

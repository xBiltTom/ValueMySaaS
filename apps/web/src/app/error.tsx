"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-2xl bg-status-danger-bg">
          <AlertTriangle className="h-12 w-12 text-status-danger-fg" aria-hidden="true" />
        </div>

        <h1 className="mb-3 font-display text-2xl font-bold text-foreground">
          Algo salió mal
        </h1>
        <p className="mb-8 text-base leading-relaxed text-muted-foreground">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al dashboard.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-95"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

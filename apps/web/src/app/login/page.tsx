"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Terminal, Loader2, Cpu, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { setAuthToken } from "@/lib/auth-token";
import { login } from "@/features/auth/api";
import { getAnnouncement } from "@/features/admin/api";
import { loginSchema, LoginFormValues } from "@/features/auth/schemas";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      setAuthToken(data.access_token);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      // Fetch system announcement before redirecting
      try {
        const ann = await getAnnouncement();
        if (ann.has_announcement) {
          setAnnouncement(ann.announcement);
          // Redirect after user dismisses banner
          return;
        }
      } catch {
        // Silently ignore — announcement is non-critical
      }
      router.replace("/dashboard");
    },
  });

  // If announcement is showing, render it first
  if (announcement) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-5 py-12">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
          <div className="border-2 border-primary/30 bg-primary/5 rounded-none p-8 space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-2 border-2 border-primary/30 bg-primary/10">
                <Megaphone className="h-5 w-5 text-primary" />
              </span>
              <p className="text-xs font-black uppercase tracking-widest text-primary">Anuncio del Sistema</p>
            </div>
            <p className="text-sm font-medium leading-relaxed text-foreground border-l-2 border-primary/40 pl-4">
              {announcement}
            </p>
            <Button
              className="w-full rounded-none h-10"
              onClick={() => router.replace("/dashboard")}
            >
              Entendido, ir al Dashboard
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground relative selection:bg-primary/30 selection:text-primary-foreground overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(150,150,150,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,150,150,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Volver</span>
        </Link>
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background transition-transform group-hover:scale-105 group-hover:rotate-3 shadow-sm">
            <Terminal className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">ValueMySaaS</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Form area */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="relative overflow-hidden rounded-[32px] border border-border/40 bg-card/60 backdrop-blur-2xl p-5 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.05)]">
            
            <div className="absolute -top-10 -right-10 p-8 opacity-5">
              <Cpu className="h-64 w-64 text-foreground" />
            </div>

            <div className="relative z-10">
              <div className="mb-10 text-center">
                <h1 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl mb-3">
                  System Login
                </h1>
                <p className="text-[15px] font-medium text-muted-foreground">
                  Ingresa tus credenciales para inicializar el dashboard.
                </p>
              </div>

              <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              >
                {mutation.isError ? (
                  <ErrorState message={getApiErrorMessage(mutation.error)} />
                ) : null}

                <label className="block">
                  <span className="text-[13px] uppercase tracking-wider font-bold text-muted-foreground mb-2 block">
                    User Email
                  </span>
                  <Input
                    className={cn(
                      "h-14 rounded-2xl bg-background/50 border-border/50 px-4 text-base transition-all focus:bg-background focus:ring-2 focus:ring-primary/20",
                      form.formState.errors.email && "border-destructive ring-2 ring-destructive/20"
                    )}
                    type="email"
                    placeholder="vibecoder@saas.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email ? (
                    <p className="mt-2 text-xs font-bold text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="text-[13px] uppercase tracking-wider font-bold text-muted-foreground mb-2 block">
                    Password
                  </span>
                  <Input
                    className={cn(
                      "h-14 rounded-2xl bg-background/50 border-border/50 px-4 text-base transition-all focus:bg-background focus:ring-2 focus:ring-primary/20",
                      form.formState.errors.password && "border-destructive ring-2 ring-destructive/20"
                    )}
                    type="password"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password ? (
                    <p className="mt-2 text-xs font-bold text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}
                </label>

                <Button
                  className="h-14 w-full rounded-2xl bg-foreground text-background font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(var(--foreground),0.1)] mt-4"
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Terminal className="h-5 w-5 mr-2" />
                  )}
                  {mutation.isPending ? "Validando acceso..." : "Entrar al Dashboard"}
                </Button>
              </form>

              <div className="mt-10 border-t border-border/40 pt-8 text-center">
                <p className="text-[15px] font-medium text-muted-foreground">
                  ¿Aún no tienes cuenta?{" "}
                  <Link
                    href="/register"
                    className="font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Deploy Free
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Terminal, Loader2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { register } from "@/features/auth/api";
import { registerSchema, RegisterFormValues } from "@/features/auth/schemas";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", username: "", full_name: "" },
  });

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => router.replace("/login?registered=1"),
  });

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
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="relative overflow-hidden rounded-[32px] border border-border/40 bg-card/60 backdrop-blur-2xl p-5 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.05)]">
            
            <div className="absolute -top-10 -right-10 p-8 opacity-5">
              <Cpu className="h-64 w-64 text-foreground" />
            </div>

            <div className="relative z-10">
              <div className="mb-10 text-center">
                <h1 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl mb-3">
                  Deploy Account
                </h1>
                <p className="text-[15px] font-medium text-muted-foreground">
                  Comienza a medir y auditar el valor de tu micro-SaaS hoy mismo.
                </p>
              </div>

              <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              >
                {mutation.isError ? (
                  <ErrorState message={getApiErrorMessage(mutation.error)} />
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[13px] uppercase tracking-wider font-bold text-muted-foreground mb-2 block">
                      Full Name
                    </span>
                    <Input
                      className={cn(
                        "h-14 rounded-2xl bg-background/50 border-border/50 px-4 text-base transition-all focus:bg-background focus:ring-2 focus:ring-primary/20",
                        form.formState.errors.full_name && "border-destructive ring-2 ring-destructive/20"
                      )}
                      placeholder="Linus Torvalds"
                      {...form.register("full_name")}
                    />
                    {form.formState.errors.full_name ? (
                      <p className="mt-2 text-xs font-bold text-destructive">
                        {form.formState.errors.full_name.message}
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-[13px] uppercase tracking-wider font-bold text-muted-foreground mb-2 block">
                      Username
                    </span>
                    <Input
                      className={cn(
                        "h-14 rounded-2xl bg-background/50 border-border/50 px-4 text-base transition-all focus:bg-background focus:ring-2 focus:ring-primary/20",
                        form.formState.errors.username && "border-destructive ring-2 ring-destructive/20"
                      )}
                      placeholder="linus"
                      {...form.register("username")}
                    />
                    {form.formState.errors.username ? (
                      <p className="mt-2 text-xs font-bold text-destructive">
                        {form.formState.errors.username.message}
                      </p>
                    ) : null}
                  </label>
                </div>

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
                  {mutation.isPending ? "Inicializando..." : "Completar Deploy"}
                </Button>
              </form>

              <div className="mt-10 border-t border-border/40 pt-8 text-center">
                <p className="text-[15px] font-medium text-muted-foreground">
                  ¿Ya tienes cuenta?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    System Login
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

"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Leaf, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { setAuthToken } from "@/lib/auth-token";
import { login } from "@/features/auth/api";
import { loginSchema, LoginFormValues } from "@/features/auth/schemas";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      setAuthToken(data.access_token);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.replace("/dashboard");
    },
  });

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Volver al inicio</span>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-bold text-foreground">ValueMySaaS</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Form area */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="bento-card p-7 sm:p-10 animate-page-in">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ingresar
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Accede al panel de ValueMySaaS para evaluar tu producto.
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            >
              {mutation.isError ? (
                <ErrorState message={getApiErrorMessage(mutation.error)} />
              ) : null}

              <label className="block">
                <span className="text-sm font-semibold text-foreground">Correo electrónico</span>
                <Input
                  className={cn("mt-2", form.formState.errors.email && "border-destructive ring-2 ring-destructive/20")}
                  type="email"
                  placeholder="estudiante@saas.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-foreground">Contraseña</span>
                <Input
                  className={cn("mt-2", form.formState.errors.password && "border-destructive ring-2 ring-destructive/20")}
                  type="password"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                ) : null}
              </label>

              <Button
                className="btn-premium w-full text-base"
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {mutation.isPending ? "Validando acceso..." : "Entrar al dashboard"}
              </Button>
            </form>

            <div className="mt-8 border-t border-border pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Aún no tienes cuenta?{" "}
                <Link
                  href="/register"
                  className="font-bold text-primary transition-colors hover:opacity-80"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

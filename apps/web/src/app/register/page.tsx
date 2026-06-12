"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Leaf, Loader2, UserPlus } from "lucide-react";
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
        <div className="w-full max-w-lg">
          <div className="bento-card p-7 sm:p-10 animate-page-in">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Crear cuenta
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Comienza a medir y mejorar el valor de tu micro-SaaS hoy mismo.
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            >
              {mutation.isError ? (
                <ErrorState message={getApiErrorMessage(mutation.error)} />
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-foreground">Nombre completo</span>
                  <Input
                    className={cn("mt-2", form.formState.errors.full_name && "border-destructive ring-2 ring-destructive/20")}
                    placeholder="Jane Doe"
                    {...form.register("full_name")}
                  />
                  {form.formState.errors.full_name ? (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {form.formState.errors.full_name.message}
                    </p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-foreground">Usuario</span>
                  <Input
                    className={cn("mt-2", form.formState.errors.username && "border-destructive ring-2 ring-destructive/20")}
                    placeholder="janedoe"
                    {...form.register("username")}
                  />
                  {form.formState.errors.username ? (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {form.formState.errors.username.message}
                    </p>
                  ) : null}
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-foreground">Correo electrónico</span>
                <Input
                  className={cn("mt-2", form.formState.errors.email && "border-destructive ring-2 ring-destructive/20")}
                  type="email"
                  placeholder="jane@saas.com"
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
                  <UserPlus className="h-4 w-4" />
                )}
                {mutation.isPending ? "Creando cuenta..." : "Completar registro"}
              </Button>
            </form>

            <div className="mt-8 border-t border-border pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="font-bold text-primary transition-colors hover:opacity-80"
                >
                  Ingresa aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

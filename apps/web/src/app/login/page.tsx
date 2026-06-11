"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { setAuthToken } from "@/lib/auth-token";
import { login } from "@/features/auth/api";
import { loginSchema, LoginFormValues } from "@/features/auth/schemas";

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
    <main className="noise-bg flex min-h-screen items-center justify-center px-5 py-10 bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background"></div>
      
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
        </Link>
        
        <div className="bento-card p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight">Ingresar</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Accede al panel de ValueMySaaS para evaluar tu producto.
            </p>
          </div>
          
          <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            {mutation.isError ? <ErrorState message={getApiErrorMessage(mutation.error)} /> : null}
            <label className="block">
              <span className="text-sm font-semibold tracking-wide">Correo electrónico</span>
              <Input className="input-premium mt-2 h-12" type="email" placeholder="estudiante@saas.com" {...form.register("email")} />
              <p className="mt-1 text-xs text-destructive font-medium">{form.formState.errors.email?.message}</p>
            </label>
            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wide">Contraseña</span>
              </div>
              <Input className="input-premium mt-2 h-12" type="password" placeholder="••••••••" {...form.register("password")} />
              <p className="mt-1 text-xs text-destructive font-medium">{form.formState.errors.password?.message}</p>
            </label>
            <Button className="btn-premium w-full h-12 mt-4 text-base" type="submit" disabled={mutation.isPending}>
              <LogIn className="mr-2 h-5 w-5" />
              {mutation.isPending ? "Validando acceso..." : "Entrar al dashboard"}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              ¿Aún no tienes cuenta?{" "}
              <Link href="/register" className="font-bold text-foreground hover:text-accent transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

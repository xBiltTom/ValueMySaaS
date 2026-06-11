"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { register } from "@/features/auth/api";
import { registerSchema, RegisterFormValues } from "@/features/auth/schemas";

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
    <main className="noise-bg flex min-h-screen items-center justify-center px-5 py-10 bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/10 via-background to-background"></div>
      
      <div className="w-full max-w-xl relative z-10">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
        </Link>
        
        <div className="bento-card p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight">Crear cuenta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Comienza a medir y mejorar el valor de tu micro-SaaS hoy mismo.
            </p>
          </div>
          
          <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            {mutation.isError ? <ErrorState message={getApiErrorMessage(mutation.error)} /> : null}
            
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold tracking-wide">Nombre completo</span>
                <Input className="input-premium mt-2 h-12" placeholder="Jane Doe" {...form.register("full_name")} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold tracking-wide">Usuario</span>
                <Input className="input-premium mt-2 h-12" placeholder="janedoe" {...form.register("username")} />
              </label>
            </div>
            
            <label className="block">
              <span className="text-sm font-semibold tracking-wide">Correo electrónico</span>
              <Input className="input-premium mt-2 h-12" type="email" placeholder="jane@saas.com" {...form.register("email")} />
              <p className="mt-1 text-xs text-destructive font-medium">{form.formState.errors.email?.message}</p>
            </label>
            
            <label className="block">
              <span className="text-sm font-semibold tracking-wide">Contraseña</span>
              <Input className="input-premium mt-2 h-12" type="password" placeholder="••••••••" {...form.register("password")} />
              <p className="mt-1 text-xs text-destructive font-medium">{form.formState.errors.password?.message}</p>
            </label>
            
            <Button className="btn-premium w-full h-12 mt-4 text-base" type="submit" disabled={mutation.isPending}>
              <UserPlus className="mr-2 h-5 w-5" />
              {mutation.isPending ? "Creando cuenta..." : "Completar registro"}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta? <Link href="/login" className="font-bold text-foreground hover:text-accent transition-colors">Ingresa aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

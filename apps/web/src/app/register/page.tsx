"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="grain flex min-h-screen items-center justify-center px-5 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Crear cuenta</CardTitle>
          <CardDescription>El registro se envia a /auth/register y luego vuelves al login.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            {mutation.isError ? <ErrorState message={getApiErrorMessage(mutation.error)} /> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Nombre completo</span>
                <Input className="mt-2" {...form.register("full_name")} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Usuario</span>
                <Input className="mt-2" {...form.register("username")} />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-semibold">Correo</span>
              <Input className="mt-2" type="email" {...form.register("email")} />
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.email?.message}</p>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Contrasena</span>
              <Input className="mt-2" type="password" {...form.register("password")} />
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.password?.message}</p>
            </label>
            <Button className="w-full" type="submit" disabled={mutation.isPending}>
              <UserPlus className="h-4 w-4" />
              {mutation.isPending ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Ya tienes cuenta? <Link href="/login" className="font-semibold text-primary">Ingresa</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

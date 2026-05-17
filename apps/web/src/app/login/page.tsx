"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="grain flex min-h-screen items-center justify-center px-5 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Ingresar</CardTitle>
          <CardDescription>Conecta con el backend real de ValueMySaaS.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            {mutation.isError ? <ErrorState message={getApiErrorMessage(mutation.error)} /> : null}
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
              <LogIn className="h-4 w-4" />
              {mutation.isPending ? "Validando..." : "Entrar al dashboard"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Aun no tienes cuenta?{" "}
            <Link href="/register" className="font-semibold text-primary">Registrate</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

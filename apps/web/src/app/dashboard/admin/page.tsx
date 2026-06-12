"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminPanel } from "@/features/admin/components/AdminPanel";
import { useCurrentUser } from "@/features/auth/use-auth";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || user?.role !== "ADMIN") {
    return (
      <DashboardShell>
        <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mb-4 opacity-50" />
          <p>Verificando permisos...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Seguridad</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Panel de Administración</h1>
      </div>
      <AdminPanel />
    </DashboardShell>
  );
}

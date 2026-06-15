"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Cpu } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LoadingState } from "@/components/shared/loading-state";
import { AdminPanel } from "@/features/admin/components/AdminPanel";
import { useCurrentUser } from "@/features/auth/use-auth";

export default function AdminPage() {
  const router = useRouter();
  const userQuery = useCurrentUser({ redirectToLogin: true });

  // Role guard — redirect non-admins
  useEffect(() => {
    if (userQuery.data && userQuery.data.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [userQuery.data, router]);

  const isAdmin = userQuery.data?.role === "ADMIN";

  if (userQuery.isLoading) {
    return (
      <DashboardShell>
        <LoadingState label="Verificando permisos..." />
      </DashboardShell>
    );
  }

  if (!isAdmin) {
    // Return null to prevent the admin UI from flashing before the redirect happens
    return null;
  }

  return (
    <DashboardShell>
      <div className="relative animate-in fade-in slide-in-from-bottom-6 duration-500">
        {/* Header */}
        <div className="mb-8 border-b-2 border-border/60 pb-6">
          <div className="mb-4 inline-flex items-center gap-2.5 border-2 border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-primary">
            <Shield className="h-3.5 w-3.5" />
            ACCESO RESTRINGIDO // ADMIN ONLY
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl flex items-center gap-4 uppercase">
            <Cpu className="h-10 w-10 text-primary opacity-80" />
            Panel de Administración
          </h1>
          <p className="mt-3 text-sm font-mono text-muted-foreground border-l-2 border-primary/30 pl-3 max-w-xl">
            &gt; GESTIÓN DE USUARIOS, CRÉDITOS DE IA Y CONFIGURACIÓN GLOBAL DEL SISTEMA.
          </p>
        </div>

        {/* Content */}
        <AdminPanel />
      </div>
    </DashboardShell>
  );
}

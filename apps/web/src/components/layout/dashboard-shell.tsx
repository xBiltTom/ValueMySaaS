"use client";

import { ReactNode, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/features/auth/use-auth";

export function DashboardShell({ children }: { children: ReactNode }) {
  const userQuery = useCurrentUser({ redirectToLogin: true });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (userQuery.isCheckingToken || !userQuery.hasToken || userQuery.isLoading) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <LoadingState label="Validando sesion..." />
      </main>
    );
  }

  if (userQuery.isError) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <ErrorState message={getApiErrorMessage(userQuery.error)} />
      </main>
    );
  }

  return (
    <div className="noise-bg min-h-screen bg-background hero-gradient lg:pl-72 relative overflow-hidden text-foreground">
      <AppSidebar user={userQuery.data} mobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="min-w-0 relative z-10 h-screen overflow-y-auto">
        <AppTopbar user={userQuery.data} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 pb-20">{children}</main>
      </div>
    </div>
  );
}

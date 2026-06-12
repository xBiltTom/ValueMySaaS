"use client";

import { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/features/auth/use-auth";

export function DashboardShell({ children }: { children: ReactNode }) {
  const userQuery = useCurrentUser({ redirectToLogin: true });

  if (userQuery.isCheckingToken || !userQuery.hasToken || userQuery.isLoading) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <LoadingState label="Validando sesión..." />
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
    <div className="min-h-screen bg-background text-foreground hero-gradient lg:pl-72">
      <AppSidebar user={userQuery.data} />
      <div className="min-w-0 lg:h-screen lg:overflow-y-auto">
        <AppTopbar user={userQuery.data} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-28 md:px-8 lg:py-8 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav user={userQuery.data} />
    </div>
  );
}

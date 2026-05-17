"use client";

import { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/features/auth/use-auth";

export function DashboardShell({ children }: { children: ReactNode }) {
  const userQuery = useCurrentUser({ redirectToLogin: true });

  if (userQuery.isCheckingToken || !userQuery.hasToken || userQuery.isLoading) {
    return (
      <main className="min-h-screen p-6">
        <LoadingState label="Validando sesion..." />
      </main>
    );
  }

  if (userQuery.isError) {
    return (
      <main className="min-h-screen p-6">
        <ErrorState message={getApiErrorMessage(userQuery.error)} />
      </main>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <AppTopbar user={userQuery.data} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-7">{children}</main>
      </div>
    </div>
  );
}

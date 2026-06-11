"use client";

import Link from "next/link";
import { LogOut, Menu, Plus } from "lucide-react";
import { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppTopbar({ user, onMenuClick }: { user?: User; onMenuClick?: () => void }) {
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Gestion de valor SaaS
            </p>
            <h1 className="text-lg font-semibold">ValueMySaaS</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/projects/new"
            className="hidden h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:inline-flex"
          >
            <Plus className="h-4 w-4 cursor-pointer" />
            Nuevo SaaS
          </Link>
          <ThemeToggle />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{user?.full_name || user?.username || "Usuario"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" onClick={logout} aria-label="Cerrar sesion" className="cursor-pointer">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

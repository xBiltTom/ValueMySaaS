"use client";

import Link from "next/link";
import { LogOut, Plus, Leaf } from "lucide-react";
import { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppTopbar({ user }: { user?: User }) {
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:px-7">
      <div className="flex items-center justify-between gap-3">
        {/* Brand — shown on mobile only since sidebar has it on desktop */}
        <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-bold text-foreground">ValueMySaaS</span>
        </Link>

        {/* Page context label — desktop only */}
        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gestión de valor SaaS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/projects/new"
            className="hidden h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Nuevo SaaS
          </Link>

          {/* Theme toggle — mobile only; sidebar has it on desktop */}
          <div className="lg:hidden">
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            onClick={logout}
            aria-label="Cerrar sesión"
            className="h-10 w-10 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

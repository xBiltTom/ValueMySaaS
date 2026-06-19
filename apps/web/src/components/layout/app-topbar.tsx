"use client";

import Link from "next/link";
import { LogOut, Plus, Terminal, HelpCircle } from "lucide-react";
import { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { startTour } from "@/features/tutorial/config";
import { usePathname } from "next/navigation";

export function AppTopbar({ user }: { user?: User }) {
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 dark:border-border/40 bg-background/90 dark:bg-background/80 px-4 py-3 backdrop-blur-xl md:px-7">
      <div className="flex items-center justify-between gap-3">
        {/* Brand — shown on mobile only since sidebar has it on desktop */}
        <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden group">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-foreground text-background shadow-[0_0_15px_rgba(var(--foreground),0.1)] transition-transform group-hover:scale-105 group-hover:-rotate-3">
            <Terminal className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-black tracking-tight text-foreground">ValueMySaaS</span>
        </Link>

        {/* Page context label — desktop only */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Workspace / {user?.username || "Usuario"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">

          <Link
            id="tour-deploy-btn"
            href="/projects/new"
            className="hidden h-10 items-center justify-center gap-2 rounded-[14px] bg-foreground px-5 text-[13px] font-bold text-background shadow-[0_0_15px_rgba(var(--foreground),0.15)] transition-all hover:scale-105 active:scale-95 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Deploy App
          </Link>

          {/* Theme toggle — mobile only; sidebar has it on desktop */}
          <div className="lg:hidden">
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            onClick={logout}
            aria-label="Cerrar sesión"
            className="h-10 w-10 p-0 rounded-[12px] bg-card/50 text-muted-foreground transition-all hover:bg-destructive hover:text-destructive-foreground hover:shadow-[0_0_15px_rgba(var(--destructive),0.3)] border border-border/80 dark:border-border/40 lg:hidden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderKanban, KeyRound, Terminal, LogOut, Shield, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout } from "@/features/auth/use-auth";
import { startTour } from "@/features/tutorial/config";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/settings/ai-keys", label: "AI Keys", icon: KeyRound },
];

export function AppSidebar({ user }: { user?: User | null }) {
  const pathname = usePathname();
  const logout = useLogout();

  const navItems = user?.role === "ADMIN" 
    ? [{ href: "/admin", label: "Administración", icon: Shield }]
    : [...items];

  return (
    <aside id="tour-sidebar" className="hidden h-screen w-72 border-r border-border/80 dark:border-border/40 bg-background/90 dark:bg-background/80 backdrop-blur-xl px-5 py-6 lg:fixed lg:left-0 lg:top-0 lg:flex lg:flex-col relative z-30">
      <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2 group">
        <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-foreground text-background shadow-[0_0_20px_rgba(var(--foreground),0.1)] transition-transform group-hover:scale-105 group-hover:-rotate-3">
          <Terminal className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">SYSTEM</span>
          <span className="block text-xl font-black leading-5 text-foreground tracking-tight">ValueMySaaS</span>
        </span>
      </Link>

      <nav id="tour-nav" className="flex-1 space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-[16px] px-4 py-3 text-[13px] font-bold uppercase tracking-wider transition-all",
                active
                  ? "bg-foreground text-background shadow-[0_0_20px_rgba(var(--foreground),0.15)] translate-x-1"
                  : "text-muted-foreground hover:bg-card hover:text-foreground border border-transparent hover:border-border/80 dark:hover:border-border/40",
              )}
            >
              <item.icon aria-hidden="true" className={cn("h-4 w-4 shrink-0 transition-transform", active ? "scale-110" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-border/80 dark:border-border/40 pt-6 mt-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black uppercase tracking-wider text-foreground">
            {user?.full_name || user?.username || "Usuario"}
          </p>
          <p className="truncate text-[10px] font-bold text-muted-foreground">{user?.email}</p>
        </div>
        <button
          onClick={() => startTour("global")}
          aria-label="Tour Global"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary transition-all hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] border border-primary/30"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <ThemeToggle />
        <button
          onClick={logout}
          aria-label="Cerrar sesión"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-card/50 text-muted-foreground transition-all hover:bg-destructive hover:text-destructive-foreground hover:shadow-[0_0_15px_rgba(var(--destructive),0.3)] border border-border/80 dark:border-border/40"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

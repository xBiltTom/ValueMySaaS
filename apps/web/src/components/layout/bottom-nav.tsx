"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderKanban, KeyRound, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/settings/ai-keys", label: "AI Keys", icon: KeyRound },
];

export function BottomNav({ user: _user }: { user?: User | null }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-background/90 dark:bg-background/80 backdrop-blur-xl border-t border-border/80 dark:border-border/40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-stretch px-2">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-[10px] transition-all",
                active ? "bg-foreground text-background shadow-[0_0_15px_rgba(var(--foreground),0.2)] scale-110" : ""
              )}>
                <item.icon
                  aria-hidden="true"
                  className="h-4 w-4"
                />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* FAB — Nuevo proyecto */}
        <div className="flex flex-1 items-center justify-center">
          <Link
            href="/projects/new"
            aria-label="Nuevo SaaS"
            className="group relative flex h-14 w-14 -translate-y-4 items-center justify-center rounded-[16px] bg-foreground text-background shadow-[0_10px_30px_rgba(var(--foreground),0.3)] transition-all active:scale-90 hover:scale-105 hover:-rotate-3"
          >
            <Plus aria-hidden="true" className="h-6 w-6 transition-transform group-hover:rotate-90" />
            <span className="absolute -bottom-5 text-[9px] font-black uppercase tracking-widest text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Deploy</span>
          </Link>
        </div>

        {/* Last nav item */}
        {navItems.slice(2).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-[10px] transition-all",
                active ? "bg-foreground text-background shadow-[0_0_15px_rgba(var(--foreground),0.2)] scale-110" : ""
              )}>
                <item.icon
                  aria-hidden="true"
                  className="h-4 w-4"
                />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

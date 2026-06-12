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
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-card/95 backdrop-blur-md border-t border-border pb-safe"
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-stretch">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon
                aria-hidden="true"
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* FAB — Nuevo proyecto */}
        <div className="flex flex-1 items-center justify-center">
          <Link
            href="/projects/new"
            aria-label="Nuevo SaaS"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-90"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
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
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon
                aria-hidden="true"
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

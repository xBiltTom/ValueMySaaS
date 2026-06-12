"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderKanban, KeyRound, Leaf, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout } from "@/features/auth/use-auth";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/settings/ai-keys", label: "AI Keys", icon: KeyRound },
];

export function AppSidebar({ user }: { user?: User | null }) {
  const pathname = usePathname();
  const logout = useLogout();

  const navItems = [...items];
  if (user?.role === "ADMIN") {
    navItems.push({ href: "/dashboard/admin", label: "Administración", icon: Shield });
  }

  return (
    <aside className="hidden h-screen w-72 border-r border-border bg-sidebar px-5 py-6 lg:fixed lg:left-0 lg:top-0 lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Leaf className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Value</span>
          <span className="block text-lg font-bold leading-5 text-foreground">MySaaS</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {user?.full_name || user?.username || "Usuario"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <ThemeToggle />
        <button
          onClick={logout}
          aria-label="Cerrar sesión"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

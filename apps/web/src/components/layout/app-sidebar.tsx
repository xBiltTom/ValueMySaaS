"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderKanban, KeyRound, Leaf, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/api";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/settings/ai-keys", label: "AI Keys", icon: KeyRound },
];

export function AppSidebar({
  user,
  mobileOpen = false,
  onClose,
}: {
  user?: User | null;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const navItems = [...items];
  if (user?.role === "ADMIN") {
    navItems.push({ href: "/dashboard/admin", label: "Administración", icon: Shield });
  }

  return (
    <>
      <aside className="hidden h-screen w-72 border-r border-border bg-sidebar px-4 py-5 lg:fixed lg:left-0 lg:top-0 lg:flex lg:flex-col">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.18em] text-muted-foreground">VALUE</span>
            <span className="block text-xl font-semibold leading-5">MySaaS</span>
          </span>
        </Link>
        <nav className="mt-9 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground transition",
                  active && "bg-primary text-primary-foreground shadow-sm",
                  !active && "hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/30 opacity-0 transition-opacity lg:hidden",
          mobileOpen && "opacity-100",
          !mobileOpen && "pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-sidebar px-4 py-5 shadow-xl transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-label="Menu principal"
      >
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 px-2" onClick={onClose}>
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em] text-muted-foreground">VALUE</span>
              <span className="block text-xl font-semibold leading-5">MySaaS</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
          >
            <span className="text-lg">&#10005;</span>
          </button>
        </div>
        <nav className="mt-9 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground transition",
                  active && "bg-primary text-primary-foreground shadow-sm",
                  !active && "hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

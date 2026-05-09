"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: BarChart3, label: "Dashboard" },
  { href: "/accounts", icon: Building2, label: "Accounts" },
  { href: "/stocks", icon: TrendingUp, label: "Stocks" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card px-3 py-6">
      <div className="mb-8 px-3">
        <span className="text-xl font-bold tracking-tight">Wealthy</span>
        <p className="mt-0.5 text-xs text-muted-foreground">Portfolio Tracker</p>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3">
        <p className="text-xs text-muted-foreground">All values in NZD</p>
      </div>
    </aside>
  );
}

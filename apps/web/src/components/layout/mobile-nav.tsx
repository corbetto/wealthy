"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/", icon: BarChart3, label: "Dashboard" },
  { href: "/accounts", icon: Building2, label: "Accounts" },
  { href: "/stocks", icon: TrendingUp, label: "Stocks" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
      <div className="flex flex-col items-center justify-center px-3">
        <ThemeToggle />
      </div>
    </nav>
  );
}

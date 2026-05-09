"use client";

import { ArrowDownRight, ArrowUpRight, Building2, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioSummary } from "@/lib/hooks/use-portfolio";
import { formatCurrency, formatPercent, gainClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function SummaryCards() {
  const { data: summary, isLoading } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="mt-2 h-4 w-20" />
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const dayPositive = summary.day_change_nzd >= 0;
  const plPositive = summary.total_profit_loss >= 0;
  const pricesStale = !summary.prices_available && summary.stock_value_nzd > 0;

  // Stock return % uses cost basis when live prices available, otherwise not shown.
  const stockReturnPct =
    summary.total_cost_basis_nzd > 0
      ? (summary.unrealized_gain / summary.total_cost_basis_nzd) * 100
      : 0;

  const cards = [
    {
      label: "Total Portfolio",
      value: formatCurrency(summary.total_value_nzd),
      sub: (
        <span className={cn("flex items-center gap-1 text-sm", gainClass(summary.day_change_nzd))}>
          {dayPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {formatCurrency(summary.day_change_nzd)} ({formatPercent(summary.day_change_pct)}) today
        </span>
      ),
      icon: Wallet,
      highlight: true,
    },
    {
      label: "Profit / Loss",
      value: formatCurrency(summary.total_profit_loss),
      sub: (
        <div className="space-y-0.5">
          <span className={cn("flex items-center gap-1 text-sm font-medium", gainClass(summary.total_profit_loss))}>
            {plPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {formatPercent(summary.profit_loss_pct)} total return
          </span>
          <span className="block text-xs text-muted-foreground">
            {formatCurrency(summary.unrealized_gain)} unrealized · {formatCurrency(summary.realized_gain)} realized
          </span>
        </div>
      ),
      icon: TrendingUp,
    },
    {
      label: "Cash Balance",
      value: formatCurrency(summary.cash_value_nzd),
      sub: <span className="text-sm text-muted-foreground">Across all accounts</span>,
      icon: Building2,
    },
    {
      label: "Stock Portfolio",
      value: formatCurrency(summary.stock_value_nzd),
      sub: pricesStale ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          Prices unavailable — showing cost basis
        </span>
      ) : (
        <span className={cn("flex items-center gap-1 text-sm", gainClass(stockReturnPct))}>
          {stockReturnPct >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {formatPercent(stockReturnPct)} return
        </span>
      ),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, sub, icon: Icon, highlight }) => (
        <Card
          key={label}
          className={cn(
            "relative overflow-hidden transition-shadow hover:shadow-md",
            highlight && "ring-1 ring-primary/20"
          )}
        >
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="rounded-lg bg-muted p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="mt-1">{sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

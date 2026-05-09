"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useHoldings } from "@/lib/hooks/use-transactions";
import { formatCurrency, formatPercent, gainClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TickerIcon } from "./ticker-icon";

export function HoldingsTable() {
  const { data: holdings, isLoading } = useHoldings();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Current Holdings</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6 pt-0">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !holdings?.length ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No open positions
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Ticker</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Shares</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value (NZD)</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holdings.map((h) => {
                  const positive = h.unrealized_gain >= 0;
                  const dayPositive = h.day_change >= 0;
                  return (
                    <tr key={h.ticker} className="transition-colors hover:bg-accent/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <TickerIcon ticker={h.ticker} size="sm" />
                          <div>
                            <p className="font-semibold">{h.ticker}</p>
                            <Badge variant="secondary" className="text-xs mt-0.5">
                              {h.exchange}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums">
                        {h.quantity.toLocaleString("en-NZ", { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(h.avg_cost, h.currency)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="tabular-nums">{formatCurrency(h.current_price, h.currency)}</p>
                        <p className={cn("text-xs flex items-center justify-end gap-0.5 mt-0.5", gainClass(h.day_change))}>
                          {dayPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {formatPercent(h.day_change_pct)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums font-medium">
                        {formatCurrency(h.market_value_nzd)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={cn("font-medium tabular-nums", gainClass(h.unrealized_gain))}>
                          {formatCurrency(h.unrealized_gain)}
                        </p>
                        <p className={cn("text-xs", gainClass(h.unrealized_gain_pct))}>
                          {formatPercent(h.unrealized_gain_pct)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

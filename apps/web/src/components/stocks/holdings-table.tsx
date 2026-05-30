"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useHoldings } from "@/lib/hooks/use-transactions";
import { formatCurrency, formatPercent, gainClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TickerIcon } from "./ticker-icon";

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatEarningsDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

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
              <tbody>
                {holdings.map((h) => {
                  const positive = h.unrealized_gain >= 0;
                  const dayPositive = h.day_change >= 0;
                  const hasFundamentals = h.market_cap || h.pe || h.earnings_date;
                  return (
                    <>
                      <tr key={h.ticker} className={cn("transition-colors hover:bg-accent/30", !hasFundamentals && "border-b border-border")}>
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
                      {hasFundamentals && (
                        <tr key={`${h.ticker}-fundamentals`} className="border-b border-border">
                          <td colSpan={6} className="px-6 pb-3 pt-0">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {h.market_cap ? (
                                <span><span className="text-foreground/50">Mkt Cap</span> {formatMarketCap(h.market_cap)}</span>
                              ) : null}
                              {h.pe ? (
                                <span><span className="text-foreground/50">P/E</span> {h.pe.toFixed(1)}×</span>
                              ) : null}
                              {h.earnings_date ? (
                                <span><span className="text-foreground/50">Earnings</span> {formatEarningsDate(h.earnings_date)}</span>
                              ) : null}
                              <span><span className="text-foreground/50">Currency</span> {h.currency}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

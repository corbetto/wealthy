"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useHoldings } from "@/lib/hooks/use-transactions";
import { formatCurrency, formatPercent, gainClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TopHoldings() {
  const { data: holdings, isLoading } = useHoldings();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Holdings</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6 pt-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="ml-auto h-4 w-20" />
                  <Skeleton className="ml-auto h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : !holdings?.length ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No stock holdings yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {holdings.slice(0, 6).map((h) => (
              <div
                key={h.ticker}
                className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                    {h.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{h.ticker}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.quantity.toLocaleString()} shares · {h.exchange}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(h.market_value_nzd)}</p>
                  <p className={cn("text-xs", gainClass(h.unrealized_gain_pct))}>
                    {formatPercent(h.unrealized_gain_pct)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

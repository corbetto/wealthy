"use client";

import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDeleteTransaction, useTransactions } from "@/lib/hooks/use-transactions";
import { TransactionForm } from "./transaction-form";
import { TickerIcon } from "./ticker-icon";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export function TransactionList() {
  const { data: transactions, isLoading } = useTransactions();
  const deleteMutation = useDeleteTransaction();
  const [editing, setEditing] = useState<Transaction | null>(null);

  const sorted = [...(transactions ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6 pt-0">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !sorted.length ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ticker</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fees</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-accent/30">
                      <td className="px-6 py-3.5 text-muted-foreground whitespace-nowrap">
                        {format(new Date(t.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <TickerIcon ticker={t.ticker} size="sm" />
                          <span className="font-semibold">{t.ticker}</span>
                          <Badge variant="secondary" className="text-xs">{t.exchange}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={t.type === "buy" ? "profit" : "loss"}>
                          {t.type === "buy" ? "Buy" : "Sell"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {t.quantity.toLocaleString("en-NZ", { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {formatCurrency(t.price, t.currency)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(t.fees, t.currency)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-medium">
                        {formatCurrency(t.quantity * t.price + (t.type === "buy" ? t.fees : -t.fees), t.currency)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditing(t)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm(`Delete this ${t.type} of ${t.ticker}?`)) {
                                deleteMutation.mutate(t.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <TransactionForm
          open={!!editing}
          onClose={() => setEditing(null)}
          transaction={editing}
        />
      )}
    </>
  );
}

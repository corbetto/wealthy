"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TickerSearch } from "./ticker-search";
import { useCreateTransaction, useUpdateTransaction } from "@/lib/hooks/use-transactions";
import type { Exchange, Transaction, TransactionType } from "@/lib/types";

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

export function TransactionForm({ open, onClose, transaction }: TransactionFormProps) {
  const isEditing = !!transaction;
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState({
    ticker: transaction?.ticker ?? "",
    exchange: (transaction?.exchange ?? "US") as Exchange,
    currency: transaction?.currency ?? "USD",
    type: (transaction?.type ?? "buy") as TransactionType,
    quantity: transaction?.quantity?.toString() ?? "",
    price: transaction?.price?.toString() ?? "",
    fees: transaction?.fees?.toString() ?? "0",
    date: transaction?.date
      ? format(new Date(transaction.date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    notes: transaction?.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTickerSelect(ticker: string, exchange: Exchange, currency: string) {
    setForm((prev) => ({ ...prev, ticker, exchange, currency }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ticker: form.ticker.toUpperCase().trim(),
      exchange: form.exchange,
      type: form.type,
      quantity: parseFloat(form.quantity),
      price: parseFloat(form.price),
      fees: parseFloat(form.fees) || 0,
      currency: form.currency,
      date: new Date(form.date).toISOString(),
      notes: form.notes,
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: transaction.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Ticker search — auto-fills exchange + currency */}
          <div className="space-y-1.5">
            <Label>Ticker Symbol</Label>
            <TickerSearch value={form.ticker} onChange={handleTickerSelect} />
            {form.ticker && (
              <div className="flex items-center gap-2 pt-0.5">
                <Badge variant="secondary">{form.exchange}</Badge>
                <Badge variant="secondary">{form.currency}</Badge>
                <span className="text-xs text-muted-foreground">auto-detected from ticker</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Transaction Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price ({form.currency})</Label>
              <Input
                id="price"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fees">Fees</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.fees}
                onChange={(e) => set("fees", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any notes..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

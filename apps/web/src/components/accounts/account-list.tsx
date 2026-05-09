"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, Edit2, RefreshCcw, Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAccounts, useAccountHistory, useDeleteAccount, useUpdateAccount } from "@/lib/hooks/use-accounts";
import { AccountForm } from "./account-form";
import { formatCurrency, cn } from "@/lib/utils";
import type { Account } from "@/lib/types";

// ── Quick inline balance update ───────────────────────────────────────────────
function QuickBalanceUpdate({ account }: { account: Account }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(account.balance.toString());
  const updateMutation = useUpdateAccount();
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setValue(account.balance.toString());
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function cancel() {
    setEditing(false);
    setValue(account.balance.toString());
  }

  async function confirm() {
    const newBalance = parseFloat(value);
    if (isNaN(newBalance) || newBalance === account.balance) { cancel(); return; }
    await updateMutation.mutateAsync({ id: account.id, data: { ...account, balance: newBalance } });
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") cancel();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 w-28 text-right tabular-nums text-sm"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-profit hover:text-profit"
          onClick={confirm} disabled={updateMutation.isPending}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="text-right">
        <p className="text-lg font-bold tabular-nums">{formatCurrency(account.balance, account.currency)}</p>
        <p className="text-xs text-muted-foreground">Updated {format(new Date(account.updated_at), "MMM d")}</p>
      </div>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
        title="Update balance" onClick={startEditing}>
        <RefreshCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ── Per-account history panel ─────────────────────────────────────────────────
interface TooltipProps { active?: boolean; payload?: Array<{ value: number }>; label?: string }
function BalanceTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card p-2.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label ? format(parseISO(label), "MMM d, yyyy") : ""}</p>
      <p className="font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function AccountHistoryPanel({ account }: { account: Account }) {
  const { data: history, isLoading } = useAccountHistory(account.id);

  const chartData = (history ?? []).map((e) => ({ date: e.date, balance: e.balance }));
  const isGrowing = chartData.length < 2 || chartData[chartData.length - 1].balance >= chartData[0].balance;
  const color = isGrowing ? "#22c55e" : "#ef4444";

  return (
    <div className="border-t border-border bg-muted/30 px-5 py-4 space-y-4">
      {isLoading ? (
        <Skeleton className="h-36 w-full" />
      ) : chartData.length < 2 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Update the balance a few times to see history here.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${account.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(v) => format(parseISO(v), "MMM yy")}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<BalanceTooltip />} />
            <Area type="monotone" dataKey="balance" stroke={color} strokeWidth={2}
              fill={`url(#grad-${account.id})`} dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* History table */}
      {(history ?? []).length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Balance history</p>
          <div className="divide-y divide-border rounded-lg border overflow-hidden">
            {[...(history ?? [])].reverse().map((e, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-sm bg-card">
                <span className="text-muted-foreground">{format(parseISO(e.date), "MMM d, yyyy")}</span>
                <div className="flex items-center gap-3">
                  {e.note && <span className="text-xs text-muted-foreground">{e.note}</span>}
                  <span className="font-medium tabular-nums">{formatCurrency(e.balance, account.currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main list ─────────────────────────────────────────────────────────────────
export function AccountList() {
  const { data: accounts, isLoading } = useAccounts();
  const deleteMutation = useDeleteAccount();
  const [editing, setEditing] = useState<Account | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-20" /></div>
                <Skeleton className="h-7 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!accounts?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="rounded-full bg-muted p-4">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-medium">No accounts yet</p>
            <p className="text-sm text-muted-foreground">Add your first bank account to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {accounts.map((account) => {
          const isExpanded = expanded === account.id;
          return (
            <Card key={account.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: institution badge + name */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold">
                      {account.institution.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{account.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{account.institution}</span>
                        <Badge variant="secondary" className="text-xs">{account.currency}</Badge>
                      </div>
                      {account.notes && (
                        <p className="mt-1 text-xs text-muted-foreground truncate">{account.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: balance + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <QuickBalanceUpdate account={account} />
                    <div className="flex gap-0.5 border-l border-border pl-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        title="View history"
                        onClick={() => setExpanded(isExpanded ? null : account.id)}>
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        title="Edit account" onClick={() => setEditing(account)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => { if (confirm(`Delete "${account.name}"?`)) deleteMutation.mutate(account.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Expandable history panel */}
              {isExpanded && <AccountHistoryPanel account={account} />}
            </Card>
          );
        })}
      </div>

      {editing && <AccountForm open={!!editing} onClose={() => setEditing(null)} account={editing} />}
    </>
  );
}

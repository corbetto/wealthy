"use client";

import { useRef, useState } from "react";
import { Check, Edit2, RefreshCcw, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAccounts, useDeleteAccount, useUpdateAccount } from "@/lib/hooks/use-accounts";
import { AccountForm } from "./account-form";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/lib/types";

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
    if (isNaN(newBalance) || newBalance === account.balance) {
      cancel();
      return;
    }
    await updateMutation.mutateAsync({
      id: account.id,
      data: { ...account, balance: newBalance },
    });
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") cancel();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {account.currency === "NZD" ? "$" : account.currency === "USD" ? "US$" : "A$"}
          </span>
          <Input
            ref={inputRef}
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 w-32 pl-8 text-right tabular-nums text-sm"
            autoFocus
          />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-profit hover:text-profit"
          onClick={confirm}
          disabled={updateMutation.isPending}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={cancel}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <p className="text-lg font-bold tabular-nums">
          {formatCurrency(account.balance, account.currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          Updated {format(new Date(account.updated_at), "MMM d")}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        title="Update balance"
        onClick={startEditing}
      >
        <RefreshCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function AccountList() {
  const { data: accounts, isLoading } = useAccounts();
  const deleteMutation = useDeleteAccount();
  const [editing, setEditing] = useState<Account | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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
        {accounts.map((account) => (
          <Card key={account.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold">
                    {account.institution.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{account.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{account.institution}</span>
                      <Badge variant="secondary" className="text-xs">
                        {account.currency}
                      </Badge>
                    </div>
                    {account.notes && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">{account.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Quick balance update — inline */}
                  <QuickBalanceUpdate account={account} />

                  {/* Edit / Delete */}
                  <div className="flex gap-0.5 border-l border-border pl-2 ml-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Edit account"
                      onClick={() => setEditing(account)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm(`Delete "${account.name}"?`)) {
                          deleteMutation.mutate(account.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <AccountForm
          open={!!editing}
          onClose={() => setEditing(null)}
          account={editing}
        />
      )}
    </>
  );
}

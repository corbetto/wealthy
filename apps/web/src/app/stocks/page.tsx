"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoldingsTable } from "@/components/stocks/holdings-table";
import { TransactionList } from "@/components/stocks/transaction-list";
import { TransactionForm } from "@/components/stocks/transaction-form";

export default function StocksPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stocks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your stock portfolio</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <HoldingsTable />
      <TransactionList />

      <TransactionForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

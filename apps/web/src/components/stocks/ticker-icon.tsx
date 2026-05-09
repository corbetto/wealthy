"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TickerIconProps {
  ticker: string;
  size?: "sm" | "md";
  className?: string;
}

function cleanSymbol(ticker: string): string {
  return ticker.replace(/\.(NZ|AX)$/i, "");
}

export function TickerIcon({ ticker, size = "md", className }: TickerIconProps) {
  const [failed, setFailed] = useState(false);
  const symbol = cleanSymbol(ticker);
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  if (!failed) {
    return (
      <img
        src={`https://assets.parqet.com/logos/symbol/${symbol}`}
        alt={ticker}
        onError={() => setFailed(true)}
        className={cn(dim, "rounded-lg object-contain bg-white p-0.5", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        dim,
        "flex items-center justify-center rounded-lg bg-muted text-xs font-bold",
        className
      )}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

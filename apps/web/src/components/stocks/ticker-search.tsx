"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { marketApi } from "@/lib/api";
import type { Exchange, TickerResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TickerSearchProps {
  value: string;
  onChange: (ticker: string, exchange: Exchange, currency: string) => void;
}

function detectExchange(symbol: string): { exchange: Exchange; currency: string } {
  const upper = symbol.toUpperCase();
  if (upper.endsWith(".NZ")) return { exchange: "NZ", currency: "NZD" };
  if (upper.endsWith(".AX")) return { exchange: "AU", currency: "AUD" };
  return { exchange: "US", currency: "USD" };
}

export function TickerSearch({ value, onChange }: TickerSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<TickerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. form reset).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.length < 1) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await marketApi.search(val);
        setResults(res.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function select(result: TickerResult) {
    const { exchange, currency } = detectExchange(result.symbol);
    setQuery(result.symbol);
    setResults([]);
    setOpen(false);
    onChange(result.symbol, exchange, currency);
  }

  // Allow typing a raw ticker without selecting a suggestion.
  function handleBlur() {
    // Small delay so click on a suggestion fires first.
    setTimeout(() => {
      setOpen(false);
      if (query && query !== value) {
        const { exchange, currency } = detectExchange(query);
        onChange(query.toUpperCase(), exchange, currency);
      }
    }, 150);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          placeholder="e.g. AAPL, AIR.NZ"
          value={query}
          onChange={handleInput}
          onFocus={() => query.length > 0 && setOpen(true)}
          onBlur={handleBlur}
          className="uppercase pr-8"
          autoComplete="off"
          required
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
          {results.map((r) => (
            <button
              key={r.symbol}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur firing before click.
                select(r);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2.5 text-sm text-left",
                "hover:bg-accent transition-colors"
              )}
            >
              <span>
                <span className="font-semibold">{r.symbol}</span>
                <span className="ml-2 text-muted-foreground truncate max-w-[200px] inline-block align-bottom">
                  {r.name}
                </span>
              </span>
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

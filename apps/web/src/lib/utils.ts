import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency = "NZD",
  compact = false
): string {
  const opts: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  if (compact && Math.abs(value) >= 1_000_000) {
    return (
      new Intl.NumberFormat("en-NZ", {
        ...opts,
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    );
  }
  return new Intl.NumberFormat("en-NZ", opts).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-NZ").format(value);
}

export function isPositive(value: number): boolean {
  return value >= 0;
}

export function gainClass(value: number): string {
  return value >= 0 ? "text-profit" : "text-loss";
}

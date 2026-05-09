"use client";

import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "../api";
import type { HistoryRange } from "../types";

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: async () => {
      const res = await portfolioApi.summary();
      return res.data;
    },
    refetchInterval: 5 * 60 * 1000, // 5 min
    staleTime: 2 * 60 * 1000,
  });
}

export function usePortfolioHistory(range: HistoryRange) {
  return useQuery({
    queryKey: ["portfolio", "history", range],
    queryFn: async () => {
      const res = await portfolioApi.history(range);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "../api";
import type { Account } from "../types";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await accountsApi.list();
      return res.data;
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Account, "id" | "created_at" | "updated_at">) =>
      accountsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Account> }) =>
      accountsApi.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["accounts", id, "history"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useAccountHistory(id: string) {
  return useQuery({
    queryKey: ["accounts", id, "history"],
    queryFn: async () => {
      const res = await accountsApi.history(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

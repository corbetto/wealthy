import type {
  Account,
  ApiResponse,
  FXRate,
  Holding,
  HistoryRange,
  MarketPrice,
  PortfolioSnapshot,
  PortfolioSummary,
  Transaction,
} from "./types";

const BASE = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

// Accounts
export const accountsApi = {
  list: () => request<ApiResponse<Account[]>>("/accounts"),
  create: (data: Omit<Account, "id" | "created_at" | "updated_at">) =>
    request<ApiResponse<Account>>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Account>) =>
    request<ApiResponse<Account>>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/accounts/${id}`, { method: "DELETE" }),
};

// Transactions
export const transactionsApi = {
  list: () => request<ApiResponse<Transaction[]>>("/transactions"),
  create: (data: Omit<Transaction, "id" | "created_at">) =>
    request<ApiResponse<Transaction>>("/transactions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Transaction>) =>
    request<ApiResponse<Transaction>>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/transactions/${id}`, { method: "DELETE" }),
};

// Holdings
export const holdingsApi = {
  list: () => request<ApiResponse<Holding[]>>("/holdings"),
};

// Portfolio
export const portfolioApi = {
  summary: () => request<ApiResponse<PortfolioSummary>>("/portfolio/summary"),
  history: (range: HistoryRange) =>
    request<ApiResponse<PortfolioSnapshot[]>>(`/portfolio/history?range=${range}`),
};

// Market
export const marketApi = {
  prices: (tickers: string[]) =>
    request<ApiResponse<MarketPrice[]>>(`/market/prices?tickers=${tickers.join(",")}`),
  fxRates: () => request<ApiResponse<FXRate[]>>("/market/fx-rates"),
};

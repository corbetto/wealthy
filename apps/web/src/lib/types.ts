export interface Account {
  id: string;
  name: string;
  institution: string;
  currency: string;
  balance: number;
  notes?: string;
  updated_at: string;
  created_at: string;
}

export type TransactionType = "buy" | "sell";
export type Exchange = "US" | "NZ" | "AU";

export interface Transaction {
  id: string;
  ticker: string;
  exchange: Exchange;
  type: TransactionType;
  quantity: number;
  price: number;
  fees: number;
  currency: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface Holding {
  ticker: string;
  exchange: Exchange;
  currency: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  market_value_nzd: number;
  cost_basis: number;
  cost_basis_nzd: number;
  unrealized_gain: number;
  unrealized_gain_pct: number;
  realized_gain: number;
  day_change: number;
  day_change_pct: number;
}

export interface PortfolioSummary {
  total_value_nzd: number;
  cash_value_nzd: number;
  stock_value_nzd: number;
  total_cost_basis_nzd: number;
  total_profit_loss: number;
  unrealized_gain: number;
  realized_gain: number;
  day_change_nzd: number;
  day_change_pct: number;
  updated_at: string;
}

export interface PortfolioSnapshot {
  date: string;
  total_value_nzd: number;
  cash_value_nzd: number;
  stock_value_nzd: number;
  profit_loss: number;
  unrealized_gain: number;
  realized_gain: number;
}

export interface MarketPrice {
  ticker: string;
  price: number;
  previous_close: number;
  currency: string;
  fetched_at: string;
}

export interface FXRate {
  from: string;
  to: string;
  rate: number;
  fetched_at: string;
}

export type HistoryRange = "1W" | "1M" | "3M" | "1Y" | "ALL";

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

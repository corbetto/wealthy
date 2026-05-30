package models

import "time"

// Account represents a bank or cash account.
type Account struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Institution string    `json:"institution"`
	Currency    string    `json:"currency"` // NZD, USD, AUD
	Balance     float64   `json:"balance"`
	Notes       string    `json:"notes,omitempty"`
	BalanceNote string    `json:"balance_note,omitempty"` // transient: note recorded in balance history on update
	UpdatedAt   time.Time `json:"updated_at"`
	CreatedAt   time.Time `json:"created_at"`
}

// TransactionType is buy or sell.
type TransactionType string

const (
	TransactionBuy  TransactionType = "buy"
	TransactionSell TransactionType = "sell"
)

// Exchange identifies the stock exchange.
type Exchange string

const (
	ExchangeUS Exchange = "US"
	ExchangeNZ Exchange = "NZ"
	ExchangeAU Exchange = "AU"
)

// Transaction represents a single stock buy or sell event.
type Transaction struct {
	ID        string          `json:"id"`
	Ticker    string          `json:"ticker"`
	Exchange  Exchange        `json:"exchange"`
	Type      TransactionType `json:"type"`
	Quantity  float64         `json:"quantity"`
	Price     float64         `json:"price"`    // price per share in the stock's native currency
	Fees      float64         `json:"fees"`     // in native currency
	Currency  string          `json:"currency"` // native currency of the stock
	Date      time.Time       `json:"date"`
	Notes     string          `json:"notes,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

// Holding is the calculated position for a ticker.
type Holding struct {
	Ticker         string   `json:"ticker"`
	Exchange       Exchange `json:"exchange"`
	Currency       string   `json:"currency"`
	Quantity       float64  `json:"quantity"`
	AvgCost        float64  `json:"avg_cost"`         // average cost per share in native currency
	CurrentPrice   float64  `json:"current_price"`    // latest market price in native currency
	MarketValue    float64  `json:"market_value"`     // quantity * current_price in native currency
	MarketValueNZD float64  `json:"market_value_nzd"` // converted to NZD
	CostBasis      float64  `json:"cost_basis"`       // total cost in native currency
	CostBasisNZD   float64  `json:"cost_basis_nzd"`
	UnrealizedGain    float64    `json:"unrealized_gain"`     // in NZD
	UnrealizedGainPct float64    `json:"unrealized_gain_pct"` // percentage
	RealizedGain      float64    `json:"realized_gain"`       // in NZD, from completed sells
	DayChange         float64    `json:"day_change"`          // in NZD
	DayChangePct      float64    `json:"day_change_pct"`
	PriceStale        bool       `json:"price_stale"` // true when no live price available, cost basis used instead
	MarketCap         float64    `json:"market_cap"`
	PE                float64    `json:"pe"`
	EarningsDate      *time.Time `json:"earnings_date,omitempty"`
}

// PortfolioSummary is the high-level view of total wealth.
type PortfolioSummary struct {
	TotalValueNZD     float64   `json:"total_value_nzd"`
	CashValueNZD      float64   `json:"cash_value_nzd"`
	StockValueNZD     float64   `json:"stock_value_nzd"`
	TotalCostBasisNZD float64   `json:"total_cost_basis_nzd"`
	TotalProfitLoss   float64   `json:"total_profit_loss"`   // unrealized + realized, NZD
	ProfitLossPct     float64   `json:"profit_loss_pct"`     // total_profit_loss / total_cost_basis * 100
	UnrealizedGain    float64   `json:"unrealized_gain"`     // NZD
	RealizedGain      float64   `json:"realized_gain"`       // NZD
	DayChangeNZD      float64   `json:"day_change_nzd"`
	DayChangePct      float64   `json:"day_change_pct"`
	PricesAvailable   bool      `json:"prices_available"` // false when all holdings use stale/fallback prices
	UpdatedAt         time.Time `json:"updated_at"`
}

// PortfolioSnapshot is a point-in-time record stored for historical graphing.
type PortfolioSnapshot struct {
	Date           time.Time `json:"date"`
	TotalValueNZD  float64   `json:"total_value_nzd"`
	CashValueNZD   float64   `json:"cash_value_nzd"`
	StockValueNZD  float64   `json:"stock_value_nzd"`
	ProfitLoss     float64   `json:"profit_loss"`
	UnrealizedGain float64   `json:"unrealized_gain"`
	RealizedGain   float64   `json:"realized_gain"`
}

// MarketPrice holds the latest price data for a ticker.
type MarketPrice struct {
	Ticker        string     `json:"ticker"`
	Price         float64    `json:"price"`
	PreviousClose float64    `json:"previous_close"`
	Currency      string     `json:"currency"`
	MarketCap     float64    `json:"market_cap"`
	TrailingPE    float64    `json:"trailing_pe"`
	EarningsDate  *time.Time `json:"earnings_date,omitempty"`
	FetchedAt     time.Time  `json:"fetched_at"`
}

// FXRate holds a currency pair exchange rate relative to NZD.
type FXRate struct {
	From      string    `json:"from"` // e.g. USD
	To        string    `json:"to"`   // NZD
	Rate      float64   `json:"rate"` // 1 From = Rate NZD
	FetchedAt time.Time `json:"fetched_at"`
}

// BalanceEntry is a point-in-time balance record for an account.
type BalanceEntry struct {
	AccountID string    `json:"account_id"`
	Balance   float64   `json:"balance"`
	Date      time.Time `json:"date"`
	Note      string    `json:"note,omitempty"`
}

// Store is the top-level JSON persistence structure.
type Store struct {
	Accounts       []Account           `json:"accounts"`
	Transactions   []Transaction       `json:"transactions"`
	Snapshots      []PortfolioSnapshot `json:"snapshots"`
	Prices         []MarketPrice       `json:"prices"`
	FXRates        []FXRate            `json:"fx_rates"`
	BalanceHistory []BalanceEntry      `json:"balance_history"`
}

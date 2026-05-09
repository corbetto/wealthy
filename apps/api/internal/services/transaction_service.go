package services

import (
	"fmt"
	"sort"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/repository"
)

// TransactionService manages stock transactions and computes holdings.
type TransactionService struct {
	txnRepo    *repository.TransactionRepo
	marketSvc  *MarketService
}

func NewTransactionService(txnRepo *repository.TransactionRepo, marketSvc *MarketService) *TransactionService {
	return &TransactionService{txnRepo: txnRepo, marketSvc: marketSvc}
}

func (s *TransactionService) List() []models.Transaction {
	return s.txnRepo.List()
}

func (s *TransactionService) Create(t models.Transaction) (models.Transaction, error) {
	if t.Ticker == "" {
		return models.Transaction{}, fmt.Errorf("ticker is required")
	}
	if t.Quantity <= 0 {
		return models.Transaction{}, fmt.Errorf("quantity must be positive")
	}
	if t.Price < 0 {
		return models.Transaction{}, fmt.Errorf("price must be non-negative")
	}
	return s.txnRepo.Create(t)
}

func (s *TransactionService) Update(id string, t models.Transaction) (models.Transaction, error) {
	return s.txnRepo.Update(id, t)
}

func (s *TransactionService) Delete(id string) error {
	return s.txnRepo.Delete(id)
}

// ComputeHoldings aggregates transactions into current holdings with live prices.
func (s *TransactionService) ComputeHoldings() ([]models.Holding, error) {
	txns := s.txnRepo.List()
	sort.Slice(txns, func(i, j int) bool { return txns[i].Date.Before(txns[j].Date) })

	type position struct {
		exchange     models.Exchange
		currency     string
		quantity     float64
		totalCost    float64 // sum of (qty * price + fees) for buys
		realizedGain float64 // accumulated from sells
	}
	positions := make(map[string]*position)

	for _, t := range txns {
		key := t.Ticker
		pos, ok := positions[key]
		if !ok {
			pos = &position{exchange: t.Exchange, currency: t.Currency}
			positions[key] = pos
		}
		if t.Type == models.TransactionBuy {
			cost := t.Quantity*t.Price + t.Fees
			pos.totalCost += cost
			pos.quantity += t.Quantity
		} else {
			// Sell: calculate realized gain using avg cost basis.
			avgCost := 0.0
			if pos.quantity > 0 {
				avgCost = pos.totalCost / pos.quantity
			}
			proceeds := t.Quantity*t.Price - t.Fees
			costOfSold := avgCost * t.Quantity
			pos.realizedGain += proceeds - costOfSold
			pos.totalCost -= costOfSold
			pos.quantity -= t.Quantity
			if pos.quantity < 0 {
				pos.quantity = 0
			}
		}
	}

	// Gather unique currencies and tickers.
	currencies := []string{}
	currencySet := map[string]bool{}
	tickers := []string{}
	for ticker, pos := range positions {
		if pos.quantity <= 0 {
			continue
		}
		tickers = append(tickers, ticker)
		if !currencySet[pos.currency] {
			currencySet[pos.currency] = true
			currencies = append(currencies, pos.currency)
		}
	}

	prices, err := s.marketSvc.GetPrices(tickers)
	if err != nil {
		return nil, err
	}
	fxRates, err := s.marketSvc.GetFXRates(currencies)
	if err != nil {
		return nil, err
	}

	priceMap := make(map[string]models.MarketPrice, len(prices))
	for _, p := range prices {
		priceMap[p.Ticker] = p
	}

	holdings := make([]models.Holding, 0, len(positions))
	for ticker, pos := range positions {
		if pos.quantity <= 0 {
			continue
		}
		p := priceMap[ticker]
		avgCost := 0.0
		if pos.quantity > 0 {
			avgCost = pos.totalCost / pos.quantity
		}

		// If no live price available, fall back to avg cost so portfolio value
		// reflects at least the cost basis rather than showing $0.
		priceStale := p.Price == 0
		livePrice := p.Price
		if priceStale {
			livePrice = avgCost
		}

		marketValue := livePrice * pos.quantity
		marketValueNZD := ToNZD(marketValue, pos.currency, fxRates)
		costBasisNZD := ToNZD(pos.totalCost, pos.currency, fxRates)
		unrealizedGain := marketValueNZD - costBasisNZD
		unrealizedPct := 0.0
		if costBasisNZD != 0 {
			unrealizedPct = unrealizedGain / costBasisNZD * 100
		}
		dayChangePer := livePrice - p.PreviousClose
		dayChangeNZD := ToNZD(dayChangePer*pos.quantity, pos.currency, fxRates)
		dayChangePct := 0.0
		if p.PreviousClose > 0 {
			dayChangePct = dayChangePer / p.PreviousClose * 100
		}

		holdings = append(holdings, models.Holding{
			Ticker:            ticker,
			Exchange:          pos.exchange,
			Currency:          pos.currency,
			Quantity:          pos.quantity,
			AvgCost:           avgCost,
			CurrentPrice:      livePrice,
			MarketValue:       marketValue,
			MarketValueNZD:    marketValueNZD,
			CostBasis:         pos.totalCost,
			CostBasisNZD:      costBasisNZD,
			UnrealizedGain:    unrealizedGain,
			UnrealizedGainPct: unrealizedPct,
			RealizedGain:      ToNZD(pos.realizedGain, pos.currency, fxRates),
			DayChange:         dayChangeNZD,
			DayChangePct:      dayChangePct,
			PriceStale:        priceStale,
		})
	}

	sort.Slice(holdings, func(i, j int) bool {
		return holdings[i].MarketValueNZD > holdings[j].MarketValueNZD
	})
	return holdings, nil
}

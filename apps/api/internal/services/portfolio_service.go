package services

import (
	"log"
	"sort"
	"time"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/repository"
)

// PortfolioService computes portfolio summaries and manages snapshots.
type PortfolioService struct {
	portfolioRepo  *repository.PortfolioRepo
	accountSvc     *AccountService
	transactionSvc *TransactionService
}

func NewPortfolioService(
	portfolioRepo *repository.PortfolioRepo,
	accountSvc *AccountService,
	transactionSvc *TransactionService,
) *PortfolioService {
	return &PortfolioService{
		portfolioRepo:  portfolioRepo,
		accountSvc:     accountSvc,
		transactionSvc: transactionSvc,
	}
}

// Summary computes the current portfolio summary.
func (s *PortfolioService) Summary() (models.PortfolioSummary, error) {
	cashNZD, err := s.accountSvc.TotalCashNZD()
	if err != nil {
		return models.PortfolioSummary{}, err
	}

	holdings, err := s.transactionSvc.ComputeHoldings()
	if err != nil {
		return models.PortfolioSummary{}, err
	}

	var stockValueNZD, unrealizedGain, realizedGain, costBasisNZD, dayChange float64
	staleCount := 0
	for _, h := range holdings {
		stockValueNZD += h.MarketValueNZD
		unrealizedGain += h.UnrealizedGain
		realizedGain += h.RealizedGain
		costBasisNZD += h.CostBasisNZD
		dayChange += h.DayChange
		if h.PriceStale {
			staleCount++
		}
	}

	totalValue := cashNZD + stockValueNZD
	dayChangePct := 0.0
	prevValue := totalValue - dayChange
	if prevValue != 0 {
		dayChangePct = dayChange / prevValue * 100
	}
	totalPL := unrealizedGain + realizedGain
	plPct := 0.0
	if costBasisNZD != 0 {
		plPct = totalPL / costBasisNZD * 100
	}

	return models.PortfolioSummary{
		TotalValueNZD:     totalValue,
		CashValueNZD:      cashNZD,
		StockValueNZD:     stockValueNZD,
		TotalCostBasisNZD: costBasisNZD,
		TotalProfitLoss:   totalPL,
		ProfitLossPct:     plPct,
		UnrealizedGain:    unrealizedGain,
		RealizedGain:      realizedGain,
		DayChangeNZD:      dayChange,
		DayChangePct:      dayChangePct,
		PricesAvailable:   len(holdings) == 0 || staleCount < len(holdings),
		UpdatedAt:         time.Now().UTC(),
	}, nil
}

// TakeSnapshot calculates and stores a portfolio snapshot for the current day.
func (s *PortfolioService) TakeSnapshot() {
	summary, err := s.Summary()
	if err != nil {
		log.Printf("snapshot error: %v", err)
		return
	}
	snap := models.PortfolioSnapshot{
		Date:           time.Now().UTC().Truncate(24 * time.Hour),
		TotalValueNZD:  summary.TotalValueNZD,
		CashValueNZD:   summary.CashValueNZD,
		StockValueNZD:  summary.StockValueNZD,
		ProfitLoss:     summary.TotalProfitLoss,
		UnrealizedGain: summary.UnrealizedGain,
		RealizedGain:   summary.RealizedGain,
	}
	if err := s.portfolioRepo.AddSnapshot(snap); err != nil {
		log.Printf("snapshot save error: %v", err)
	}
}

// History returns snapshots filtered to a date range.
func (s *PortfolioService) History(rangeKey string) []models.PortfolioSnapshot {
	snaps := s.portfolioRepo.ListSnapshots()
	cutoff := cutoffDate(rangeKey)

	filtered := snaps[:0]
	for _, sn := range snaps {
		if sn.Date.After(cutoff) || sn.Date.Equal(cutoff) {
			filtered = append(filtered, sn)
		}
	}
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].Date.Before(filtered[j].Date)
	})
	return filtered
}

func cutoffDate(rangeKey string) time.Time {
	now := time.Now().UTC()
	switch rangeKey {
	case "1W":
		return now.AddDate(0, 0, -7)
	case "1M":
		return now.AddDate(0, -1, 0)
	case "3M":
		return now.AddDate(0, -3, 0)
	case "1Y":
		return now.AddDate(-1, 0, 0)
	default: // ALL
		return time.Time{}
	}
}

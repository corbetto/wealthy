package repository

import (
	"time"

	"github.com/corbetto/wealthy/api/internal/models"
)

type PortfolioRepo struct{ store *FileStore }

func NewPortfolioRepo(store *FileStore) *PortfolioRepo { return &PortfolioRepo{store} }

func (r *PortfolioRepo) ListSnapshots() []models.PortfolioSnapshot {
	return r.store.Read().Snapshots
}

func (r *PortfolioRepo) AddSnapshot(snap models.PortfolioSnapshot) error {
	return r.store.Write(func(s *models.Store) {
		// Replace any existing snapshot for the same calendar day.
		day := snap.Date.Truncate(24 * time.Hour)
		snaps := s.Snapshots[:0]
		for _, existing := range s.Snapshots {
			if !existing.Date.Truncate(24 * time.Hour).Equal(day) {
				snaps = append(snaps, existing)
			}
		}
		s.Snapshots = append(snaps, snap)
	})
}

func (r *PortfolioRepo) SavePrices(prices []models.MarketPrice) error {
	return r.store.Write(func(s *models.Store) {
		// Merge by ticker.
		idx := make(map[string]int, len(s.Prices))
		for i, p := range s.Prices {
			idx[p.Ticker] = i
		}
		for _, p := range prices {
			if i, ok := idx[p.Ticker]; ok {
				s.Prices[i] = p
			} else {
				s.Prices = append(s.Prices, p)
			}
		}
	})
}

func (r *PortfolioRepo) GetPrices() []models.MarketPrice {
	return r.store.Read().Prices
}

func (r *PortfolioRepo) SaveFXRates(rates []models.FXRate) error {
	return r.store.Write(func(s *models.Store) {
		idx := make(map[string]int)
		for i, r := range s.FXRates {
			idx[r.From] = i
		}
		for _, rate := range rates {
			if i, ok := idx[rate.From]; ok {
				s.FXRates[i] = rate
			} else {
				s.FXRates = append(s.FXRates, rate)
			}
		}
	})
}

func (r *PortfolioRepo) GetFXRates() []models.FXRate {
	return r.store.Read().FXRates
}

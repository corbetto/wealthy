package services

import (
	"log"
	"time"

	"github.com/corbetto/wealthy/api/internal/market"
	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/repository"
)

const priceTTL = 15 * time.Minute
const fxTTL = 60 * time.Minute

// MarketService refreshes and caches market prices and FX rates.
type MarketService struct {
	repo     *repository.PortfolioRepo
	provider market.Provider
}

func NewMarketService(repo *repository.PortfolioRepo, provider market.Provider) *MarketService {
	return &MarketService{repo: repo, provider: provider}
}

// GetPrices returns cached prices, refreshing stale ones from the provider.
func (s *MarketService) GetPrices(tickers []string) ([]models.MarketPrice, error) {
	cached := s.repo.GetPrices()
	priceMap := make(map[string]models.MarketPrice, len(cached))
	for _, p := range cached {
		priceMap[p.Ticker] = p
	}

	stale := make([]string, 0)
	for _, ticker := range tickers {
		p, ok := priceMap[ticker]
		if !ok || time.Since(p.FetchedAt) > priceTTL {
			stale = append(stale, ticker)
		}
	}

	if len(stale) > 0 {
		fresh, err := s.provider.FetchPrices(stale)
		if err != nil {
			log.Printf("market price fetch error: %v", err)
		} else {
			if err := s.repo.SavePrices(fresh); err != nil {
				log.Printf("price save error: %v", err)
			}
			for _, p := range fresh {
				priceMap[p.Ticker] = p
			}
		}
	}

	result := make([]models.MarketPrice, 0, len(tickers))
	for _, ticker := range tickers {
		if p, ok := priceMap[ticker]; ok {
			result = append(result, p)
		}
	}
	return result, nil
}

// GetFXRates returns cached FX rates for given currencies → NZD.
func (s *MarketService) GetFXRates(currencies []string) ([]models.FXRate, error) {
	cached := s.repo.GetFXRates()
	rateMap := make(map[string]models.FXRate, len(cached))
	for _, r := range cached {
		rateMap[r.From] = r
	}

	stale := make([]string, 0)
	for _, c := range currencies {
		if c == "NZD" {
			continue
		}
		r, ok := rateMap[c]
		if !ok || time.Since(r.FetchedAt) > fxTTL {
			stale = append(stale, c)
		}
	}

	if len(stale) > 0 {
		fresh, err := s.provider.FetchFXRates(stale)
		if err != nil {
			log.Printf("fx rate fetch error: %v", err)
		} else {
			if err := s.repo.SaveFXRates(fresh); err != nil {
				log.Printf("fx save error: %v", err)
			}
			for _, r := range fresh {
				rateMap[r.From] = r
			}
		}
	}

	result := make([]models.FXRate, 0)
	for from, r := range rateMap {
		if from != "NZD" {
			result = append(result, r)
		}
	}
	// Add NZD → NZD = 1 implicitly (callers can use ToNZD helper).
	return result, nil
}

// ToNZD converts an amount from a currency to NZD using cached rates.
func ToNZD(amount float64, currency string, rates []models.FXRate) float64 {
	if currency == "NZD" {
		return amount
	}
	for _, r := range rates {
		if r.From == currency {
			return amount * r.Rate
		}
	}
	return amount // fallback: assume 1:1
}

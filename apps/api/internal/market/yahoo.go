// Package market provides market data fetching with a clean provider interface.
package market

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/corbetto/wealthy/api/internal/models"
)

// Provider fetches market prices and FX rates.
type Provider interface {
	FetchPrices(tickers []string) ([]models.MarketPrice, error)
	FetchFXRates(currencies []string) ([]models.FXRate, error)
}

// YahooProvider fetches data from Yahoo Finance's unofficial v8 API.
type YahooProvider struct {
	client *http.Client
}

func NewYahooProvider() *YahooProvider {
	return &YahooProvider{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

type yahooQuoteResponse struct {
	QuoteResponse struct {
		Result []struct {
			Symbol             string  `json:"symbol"`
			RegularMarketPrice float64 `json:"regularMarketPrice"`
			PreviousClose      float64 `json:"regularMarketPreviousClose"`
			Currency           string  `json:"currency"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"quoteResponse"`
}

func (y *YahooProvider) FetchPrices(tickers []string) ([]models.MarketPrice, error) {
	if len(tickers) == 0 {
		return nil, nil
	}
	symbols := strings.Join(tickers, ",")
	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v7/finance/quote?symbols=%s&fields=regularMarketPrice,regularMarketPreviousClose,currency",
		symbols,
	)
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")

	resp, err := y.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("yahoo fetch: %w", err)
	}
	defer resp.Body.Close()

	var data yahooQuoteResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("yahoo decode: %w", err)
	}

	now := time.Now().UTC()
	prices := make([]models.MarketPrice, 0, len(data.QuoteResponse.Result))
	for _, r := range data.QuoteResponse.Result {
		prices = append(prices, models.MarketPrice{
			Ticker:        r.Symbol,
			Price:         r.RegularMarketPrice,
			PreviousClose: r.PreviousClose,
			Currency:      r.Currency,
			FetchedAt:     now,
		})
	}
	return prices, nil
}

func (y *YahooProvider) FetchFXRates(currencies []string) ([]models.FXRate, error) {
	// Fetch XXXNZD=X pairs from Yahoo Finance.
	tickers := make([]string, 0, len(currencies))
	for _, c := range currencies {
		if c == "NZD" {
			continue
		}
		tickers = append(tickers, c+"NZD=X")
	}
	if len(tickers) == 0 {
		return nil, nil
	}

	rawPrices, err := y.FetchPrices(tickers)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	rates := make([]models.FXRate, 0, len(rawPrices))
	for _, p := range rawPrices {
		// Symbol is like "USDNZD=X"
		from := strings.TrimSuffix(p.Ticker, "NZD=X")
		rates = append(rates, models.FXRate{
			From:      from,
			To:        "NZD",
			Rate:      p.Price,
			FetchedAt: now,
		})
	}
	return rates, nil
}

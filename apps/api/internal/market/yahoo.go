// Package market provides market data fetching with a clean provider interface.
package market

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
	"strings"
	"sync"
	"time"

	"github.com/corbetto/wealthy/api/internal/models"
)

// TickerResult is a search suggestion from Yahoo Finance.
type TickerResult struct {
	Symbol   string `json:"symbol"`
	Name     string `json:"name"`
	Exchange string `json:"exchange"`
	Type     string `json:"type"`
}

// Provider fetches market prices and FX rates.
type Provider interface {
	FetchPrices(tickers []string) ([]models.MarketPrice, error)
	FetchFXRates(currencies []string) ([]models.FXRate, error)
	SearchTickers(query string) ([]TickerResult, error)
}

// YahooProvider fetches data from Yahoo Finance using cookie+crumb auth.
type YahooProvider struct {
	client    *http.Client
	mu        sync.Mutex
	crumb     string
	crumbAge  time.Time
}

const crumbTTL = 20 * time.Hour

func NewYahooProvider() *YahooProvider {
	jar, _ := cookiejar.New(nil)
	p := &YahooProvider{
		client: &http.Client{
			Jar:     jar,
			Timeout: 15 * time.Second,
		},
	}
	// Seed crumb in background so first real request doesn't block startup.
	go func() {
		if err := p.refreshCrumb(); err != nil {
			log.Printf("yahoo: initial crumb fetch failed: %v", err)
		}
	}()
	return p
}

// refreshCrumb obtains a new session cookie + crumb from Yahoo Finance.
func (y *YahooProvider) refreshCrumb() error {
	// Step 1: hit fc.yahoo.com to seed session cookies.
	req, _ := http.NewRequest(http.MethodGet, "https://fc.yahoo.com", nil)
	y.setHeaders(req)
	resp, err := y.client.Do(req)
	if err != nil {
		return fmt.Errorf("cookie seed: %w", err)
	}
	resp.Body.Close()

	// Step 2: get crumb string.
	req2, _ := http.NewRequest(http.MethodGet, "https://query1.finance.yahoo.com/v1/test/getcrumb", nil)
	y.setHeaders(req2)
	resp2, err := y.client.Do(req2)
	if err != nil {
		return fmt.Errorf("crumb fetch: %w", err)
	}
	defer resp2.Body.Close()
	b, err := io.ReadAll(resp2.Body)
	if err != nil {
		return err
	}
	crumb := strings.TrimSpace(string(b))
	if crumb == "" || strings.Contains(crumb, "<html") {
		return fmt.Errorf("invalid crumb response")
	}

	y.mu.Lock()
	y.crumb = crumb
	y.crumbAge = time.Now()
	y.mu.Unlock()
	log.Printf("yahoo: crumb refreshed")
	return nil
}

func (y *YahooProvider) getCrumb() (string, error) {
	y.mu.Lock()
	crumb := y.crumb
	age := y.crumbAge
	y.mu.Unlock()

	if crumb == "" || time.Since(age) > crumbTTL {
		if err := y.refreshCrumb(); err != nil {
			return crumb, err // return stale crumb if refresh fails
		}
		y.mu.Lock()
		crumb = y.crumb
		y.mu.Unlock()
	}
	return crumb, nil
}

func (y *YahooProvider) setHeaders(req *http.Request) {
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
}

type yahooQuoteResponse struct {
	QuoteResponse struct {
		Result []struct {
			Symbol                  string  `json:"symbol"`
			RegularMarketPrice      float64 `json:"regularMarketPrice"`
			PreviousClose           float64 `json:"regularMarketPreviousClose"`
			Currency                string  `json:"currency"`
			MarketCap               float64 `json:"marketCap"`
			TrailingPE              float64 `json:"trailingPE"`
			EarningsTimestamp       int64   `json:"earningsTimestamp"`
			EarningsTimestampStart  int64   `json:"earningsTimestampStart"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"quoteResponse"`
}

func (y *YahooProvider) FetchPrices(tickers []string) ([]models.MarketPrice, error) {
	if len(tickers) == 0 {
		return nil, nil
	}
	crumb, err := y.getCrumb()
	if err != nil {
		log.Printf("yahoo: crumb unavailable: %v", err)
	}

	symbols := strings.Join(tickers, ",")
	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v7/finance/quote?symbols=%s&crumb=%s",
		symbols, crumb,
	)
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	y.setHeaders(req)

	resp, err := y.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("yahoo fetch: %w", err)
	}
	defer resp.Body.Close()

	// Retry once with fresh crumb on auth error.
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		resp.Body.Close()
		if rerr := y.refreshCrumb(); rerr != nil {
			return nil, fmt.Errorf("yahoo re-auth failed: %w", rerr)
		}
		y.mu.Lock()
		crumb = y.crumb
		y.mu.Unlock()

		url = fmt.Sprintf(
			"https://query1.finance.yahoo.com/v7/finance/quote?symbols=%s&crumb=%s",
			symbols, crumb,
		)
		req2, _ := http.NewRequest(http.MethodGet, url, nil)
		y.setHeaders(req2)
		resp, err = y.client.Do(req2)
		if err != nil {
			return nil, fmt.Errorf("yahoo retry: %w", err)
		}
		defer resp.Body.Close()
	}

	var data yahooQuoteResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("yahoo decode: %w", err)
	}

	now := time.Now().UTC()
	prices := make([]models.MarketPrice, 0, len(data.QuoteResponse.Result))
	for _, r := range data.QuoteResponse.Result {
		if r.RegularMarketPrice == 0 {
			continue
		}
		mp := models.MarketPrice{
			Ticker:        r.Symbol,
			Price:         r.RegularMarketPrice,
			PreviousClose: r.PreviousClose,
			Currency:      r.Currency,
			MarketCap:     r.MarketCap,
			TrailingPE:    r.TrailingPE,
			FetchedAt:     now,
		}
		// Prefer the start of the earnings estimate window; fall back to the
		// exact timestamp. Only set if the date is in the future.
		ts := r.EarningsTimestampStart
		if ts == 0 {
			ts = r.EarningsTimestamp
		}
		if ts > 0 {
			t := time.Unix(ts, 0).UTC()
			mp.EarningsDate = &t
		}
		prices = append(prices, mp)
	}
	return prices, nil
}

func (y *YahooProvider) FetchFXRates(currencies []string) ([]models.FXRate, error) {
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

type yahooSearchResponse struct {
	Quotes []struct {
		Symbol    string `json:"symbol"`
		Shortname string `json:"shortname"`
		Longname  string `json:"longname"`
		ExchDisp  string `json:"exchDisp"`
		TypeDisp  string `json:"typeDisp"`
		QuoteType string `json:"quoteType"`
	} `json:"quotes"`
}

func (y *YahooProvider) SearchTickers(query string) ([]TickerResult, error) {
	if query == "" {
		return nil, nil
	}
	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v1/finance/search?q=%s&quotesCount=8&newsCount=0&listsCount=0",
		query,
	)
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	y.setHeaders(req)

	resp, err := y.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("yahoo search: %w", err)
	}
	defer resp.Body.Close()

	var data yahooSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("yahoo search decode: %w", err)
	}

	results := make([]TickerResult, 0, len(data.Quotes))
	for _, q := range data.Quotes {
		if q.QuoteType != "EQUITY" && q.QuoteType != "ETF" && q.QuoteType != "MUTUALFUND" {
			continue
		}
		name := q.Shortname
		if name == "" {
			name = q.Longname
		}
		results = append(results, TickerResult{
			Symbol:   q.Symbol,
			Name:     name,
			Exchange: q.ExchDisp,
			Type:     q.TypeDisp,
		})
	}
	return results, nil
}

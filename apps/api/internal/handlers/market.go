package handlers

import (
	"net/http"
	"strings"

	"github.com/corbetto/wealthy/api/internal/market"
	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/services"
	"github.com/gin-gonic/gin"
)

type MarketHandler struct {
	svc      *services.MarketService
	provider market.Provider
}

func NewMarketHandler(svc *services.MarketService, provider market.Provider) *MarketHandler {
	return &MarketHandler{svc: svc, provider: provider}
}

func (h *MarketHandler) RegisterRoutes(r gin.IRouter) {
	r.GET("/market/prices", h.prices)
	r.GET("/market/fx-rates", h.fxRates)
	r.GET("/market/search", h.search)
}

func (h *MarketHandler) prices(c *gin.Context) {
	raw := c.Query("tickers")
	if raw == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tickers query param required"})
		return
	}
	tickers := strings.Split(raw, ",")
	prices, err := h.svc.GetPrices(tickers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if prices == nil {
		prices = []models.MarketPrice{}
	}
	c.JSON(http.StatusOK, gin.H{"data": prices})
}

func (h *MarketHandler) search(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "q query param required"})
		return
	}
	results, err := h.provider.SearchTickers(q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if results == nil {
		results = []market.TickerResult{}
	}
	c.JSON(http.StatusOK, gin.H{"data": results})
}

func (h *MarketHandler) fxRates(c *gin.Context) {
	rates, err := h.svc.GetFXRates([]string{"USD", "AUD"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if rates == nil {
		rates = []models.FXRate{}
	}
	c.JSON(http.StatusOK, gin.H{"data": rates})
}

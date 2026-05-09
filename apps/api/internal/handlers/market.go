package handlers

import (
	"net/http"
	"strings"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/services"
	"github.com/gin-gonic/gin"
)

type MarketHandler struct{ svc *services.MarketService }

func NewMarketHandler(svc *services.MarketService) *MarketHandler { return &MarketHandler{svc} }

func (h *MarketHandler) RegisterRoutes(r gin.IRouter) {
	r.GET("/market/prices", h.prices)
	r.GET("/market/fx-rates", h.fxRates)
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

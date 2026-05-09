package handlers

import (
	"net/http"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/services"
	"github.com/gin-gonic/gin"
)

type PortfolioHandler struct{ svc *services.PortfolioService }

func NewPortfolioHandler(svc *services.PortfolioService) *PortfolioHandler {
	return &PortfolioHandler{svc}
}

func (h *PortfolioHandler) RegisterRoutes(r gin.IRouter) {
	r.GET("/portfolio/summary", h.summary)
	r.GET("/portfolio/history", h.history)
}

func (h *PortfolioHandler) summary(c *gin.Context) {
	summary, err := h.svc.Summary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": summary})
}

func (h *PortfolioHandler) history(c *gin.Context) {
	rangeKey := c.DefaultQuery("range", "ALL")
	snaps := h.svc.History(rangeKey)
	if snaps == nil {
		snaps = []models.PortfolioSnapshot{}
	}
	c.JSON(http.StatusOK, gin.H{"data": snaps})
}

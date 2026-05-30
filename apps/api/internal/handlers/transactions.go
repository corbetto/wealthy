package handlers

import (
	"net/http"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/services"
	"github.com/gin-gonic/gin"
)

type TransactionHandler struct{ svc *services.TransactionService }

func NewTransactionHandler(svc *services.TransactionService) *TransactionHandler {
	return &TransactionHandler{svc}
}

func (h *TransactionHandler) RegisterRoutes(r gin.IRouter) {
	r.GET("/transactions", h.list)
	r.POST("/transactions", h.create)
	r.PUT("/transactions/:id", h.update)
	r.DELETE("/transactions/:id", h.delete)
	r.GET("/holdings", h.holdings)
}

func (h *TransactionHandler) list(c *gin.Context) {
	txns := h.svc.List()
	if txns == nil {
		txns = []models.Transaction{}
	}
	c.JSON(http.StatusOK, gin.H{"data": txns})
}

func (h *TransactionHandler) create(c *gin.Context) {
	var t models.Transaction
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	created, err := h.svc.Create(t)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func (h *TransactionHandler) update(c *gin.Context) {
	id := c.Param("id")
	var t models.Transaction
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := h.svc.Update(id, t)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func (h *TransactionHandler) delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *TransactionHandler) holdings(c *gin.Context) {
	all, err := h.svc.ComputeHoldings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	open := make([]models.Holding, 0, len(all))
	for _, holding := range all {
		if holding.Quantity > 0 {
			open = append(open, holding)
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": open})
}

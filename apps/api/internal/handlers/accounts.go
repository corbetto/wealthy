package handlers

import (
	"net/http"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/services"
	"github.com/gin-gonic/gin"
)

type AccountHandler struct{ svc *services.AccountService }

func NewAccountHandler(svc *services.AccountService) *AccountHandler {
	return &AccountHandler{svc}
}

func (h *AccountHandler) RegisterRoutes(r gin.IRouter) {
	r.GET("/accounts", h.list)
	r.POST("/accounts", h.create)
	r.PUT("/accounts/:id", h.update)
	r.DELETE("/accounts/:id", h.delete)
	r.GET("/accounts/:id/history", h.history)
}

func (h *AccountHandler) list(c *gin.Context) {
	accounts := h.svc.List()
	if accounts == nil {
		accounts = []models.Account{}
	}
	c.JSON(http.StatusOK, gin.H{"data": accounts})
}

func (h *AccountHandler) create(c *gin.Context) {
	var a models.Account
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	created, err := h.svc.Create(a)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func (h *AccountHandler) update(c *gin.Context) {
	id := c.Param("id")
	var a models.Account
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := h.svc.Update(id, a)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func (h *AccountHandler) delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *AccountHandler) history(c *gin.Context) {
	id := c.Param("id")
	entries := h.svc.GetBalanceHistory(id)
	if entries == nil {
		entries = []models.BalanceEntry{}
	}
	c.JSON(http.StatusOK, gin.H{"data": entries})
}

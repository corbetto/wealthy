package main

import (
	"log"
	"os"
	"time"

	"github.com/corbetto/wealthy/api/internal/handlers"
	"github.com/corbetto/wealthy/api/internal/market"
	"github.com/corbetto/wealthy/api/internal/repository"
	"github.com/corbetto/wealthy/api/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/robfig/cron/v3"
)

func main() {
	dataPath := getenv("DATA_PATH", "./data/wealthy.json")
	port := getenv("PORT", "8080")

	store, err := repository.NewFileStore(dataPath)
	if err != nil {
		log.Fatalf("failed to open store: %v", err)
	}

	accountRepo := repository.NewAccountRepo(store)
	txnRepo := repository.NewTransactionRepo(store)
	portfolioRepo := repository.NewPortfolioRepo(store)

	provider := market.NewYahooProvider()
	marketSvc := services.NewMarketService(portfolioRepo, provider)
	accountSvc := services.NewAccountService(accountRepo, marketSvc)
	txnSvc := services.NewTransactionService(txnRepo, marketSvc)
	portfolioSvc := services.NewPortfolioService(portfolioRepo, accountSvc, txnSvc)

	// Take a snapshot on startup, then daily at midnight UTC.
	go portfolioSvc.TakeSnapshot()
	c := cron.New()
	_, _ = c.AddFunc("0 0 * * *", portfolioSvc.TakeSnapshot)
	c.Start()

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	v1 := r.Group("/api/v1")
	handlers.NewAccountHandler(accountSvc).RegisterRoutes(v1)
	handlers.NewTransactionHandler(txnSvc).RegisterRoutes(v1)
	handlers.NewPortfolioHandler(portfolioSvc).RegisterRoutes(v1)
	handlers.NewMarketHandler(marketSvc).RegisterRoutes(v1)

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

	log.Printf("Wealthy API listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

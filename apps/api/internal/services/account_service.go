package services

import (
	"fmt"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/repository"
)

// AccountService manages bank accounts and calculates total cash value.
type AccountService struct {
	repo      *repository.AccountRepo
	marketSvc *MarketService
}

func NewAccountService(repo *repository.AccountRepo, marketSvc *MarketService) *AccountService {
	return &AccountService{repo: repo, marketSvc: marketSvc}
}

func (s *AccountService) List() []models.Account {
	return s.repo.List()
}

func (s *AccountService) Get(id string) (models.Account, error) {
	return s.repo.Get(id)
}

func (s *AccountService) Create(a models.Account) (models.Account, error) {
	if a.Name == "" {
		return models.Account{}, fmt.Errorf("account name is required")
	}
	if a.Currency == "" {
		a.Currency = "NZD"
	}
	return s.repo.Create(a)
}

func (s *AccountService) Update(id string, a models.Account) (models.Account, error) {
	if a.Name == "" {
		return models.Account{}, fmt.Errorf("account name is required")
	}
	return s.repo.Update(id, a)
}

func (s *AccountService) Delete(id string) error {
	return s.repo.Delete(id)
}

// TotalCashNZD returns the sum of all account balances converted to NZD.
func (s *AccountService) TotalCashNZD() (float64, error) {
	accounts := s.repo.List()
	currencies := uniqueCurrencies(accounts)
	fxRates, err := s.marketSvc.GetFXRates(currencies)
	if err != nil {
		return 0, err
	}
	total := 0.0
	for _, a := range accounts {
		total += ToNZD(a.Balance, a.Currency, fxRates)
	}
	return total, nil
}

func uniqueCurrencies(accounts []models.Account) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, a := range accounts {
		if !seen[a.Currency] {
			seen[a.Currency] = true
			out = append(out, a.Currency)
		}
	}
	return out
}

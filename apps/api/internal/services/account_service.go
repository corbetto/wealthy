package services

import (
	"fmt"
	"time"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/corbetto/wealthy/api/internal/repository"
)

// AccountService manages bank accounts and calculates total cash value.
type AccountService struct {
	repo        *repository.AccountRepo
	historyRepo *repository.BalanceHistoryRepo
	marketSvc   *MarketService
}

func NewAccountService(
	repo *repository.AccountRepo,
	historyRepo *repository.BalanceHistoryRepo,
	marketSvc *MarketService,
) *AccountService {
	return &AccountService{repo: repo, historyRepo: historyRepo, marketSvc: marketSvc}
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
	created, err := s.repo.Create(a)
	if err != nil {
		return created, err
	}
	// Record initial balance as history entry.
	_ = s.historyRepo.Add(models.BalanceEntry{
		AccountID: created.ID,
		Balance:   created.Balance,
		Date:      created.CreatedAt,
		Note:      "Initial balance",
	})
	return created, nil
}

func (s *AccountService) Update(id string, a models.Account) (models.Account, error) {
	if a.Name == "" {
		return models.Account{}, fmt.Errorf("account name is required")
	}
	existing, err := s.repo.Get(id)
	if err != nil {
		return models.Account{}, err
	}
	updated, err := s.repo.Update(id, a)
	if err != nil {
		return updated, err
	}
	// Record history only when the balance actually changed.
	if updated.Balance != existing.Balance {
		_ = s.historyRepo.Add(models.BalanceEntry{
			AccountID: id,
			Balance:   updated.Balance,
			Date:      time.Now().UTC(),
		})
	}
	return updated, nil
}

func (s *AccountService) Delete(id string) error {
	if err := s.repo.Delete(id); err != nil {
		return err
	}
	_ = s.historyRepo.DeleteForAccount(id)
	return nil
}

func (s *AccountService) GetBalanceHistory(id string) []models.BalanceEntry {
	return s.historyRepo.ListForAccount(id)
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

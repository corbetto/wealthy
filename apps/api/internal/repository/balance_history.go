package repository

import (
	"sort"

	"github.com/corbetto/wealthy/api/internal/models"
)

type BalanceHistoryRepo struct{ store *FileStore }

func NewBalanceHistoryRepo(store *FileStore) *BalanceHistoryRepo {
	return &BalanceHistoryRepo{store}
}

func (r *BalanceHistoryRepo) ListForAccount(accountID string) []models.BalanceEntry {
	all := r.store.Read().BalanceHistory
	out := make([]models.BalanceEntry, 0)
	for _, e := range all {
		if e.AccountID == accountID {
			out = append(out, e)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Date.Before(out[j].Date) })
	return out
}

func (r *BalanceHistoryRepo) Add(entry models.BalanceEntry) error {
	return r.store.Write(func(s *models.Store) {
		s.BalanceHistory = append(s.BalanceHistory, entry)
	})
}

func (r *BalanceHistoryRepo) DeleteForAccount(accountID string) error {
	return r.store.Write(func(s *models.Store) {
		entries := s.BalanceHistory[:0]
		for _, e := range s.BalanceHistory {
			if e.AccountID != accountID {
				entries = append(entries, e)
			}
		}
		s.BalanceHistory = entries
	})
}

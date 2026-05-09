package repository

import (
	"fmt"
	"time"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/google/uuid"
)

type AccountRepo struct{ store *FileStore }

func NewAccountRepo(store *FileStore) *AccountRepo { return &AccountRepo{store} }

func (r *AccountRepo) List() []models.Account {
	return r.store.Read().Accounts
}

func (r *AccountRepo) Get(id string) (models.Account, error) {
	for _, a := range r.store.Read().Accounts {
		if a.ID == id {
			return a, nil
		}
	}
	return models.Account{}, fmt.Errorf("account %s not found", id)
}

func (r *AccountRepo) Create(a models.Account) (models.Account, error) {
	a.ID = uuid.New().String()
	now := time.Now().UTC()
	a.CreatedAt = now
	a.UpdatedAt = now
	return a, r.store.Write(func(s *models.Store) {
		s.Accounts = append(s.Accounts, a)
	})
}

func (r *AccountRepo) Update(id string, patch models.Account) (models.Account, error) {
	var updated models.Account
	err := r.store.Write(func(s *models.Store) {
		for i, a := range s.Accounts {
			if a.ID == id {
				patch.ID = id
				patch.CreatedAt = a.CreatedAt
				patch.UpdatedAt = time.Now().UTC()
				s.Accounts[i] = patch
				updated = patch
				return
			}
		}
	})
	if updated.ID == "" {
		return models.Account{}, fmt.Errorf("account %s not found", id)
	}
	return updated, err
}

func (r *AccountRepo) Delete(id string) error {
	found := false
	return r.store.Write(func(s *models.Store) {
		accounts := s.Accounts[:0]
		for _, a := range s.Accounts {
			if a.ID != id {
				accounts = append(accounts, a)
			} else {
				found = true
			}
		}
		if found {
			s.Accounts = accounts
		}
	})
}

package repository

import (
	"fmt"
	"time"

	"github.com/corbetto/wealthy/api/internal/models"
	"github.com/google/uuid"
)

type TransactionRepo struct{ store *FileStore }

func NewTransactionRepo(store *FileStore) *TransactionRepo { return &TransactionRepo{store} }

func (r *TransactionRepo) List() []models.Transaction {
	return r.store.Read().Transactions
}

func (r *TransactionRepo) Get(id string) (models.Transaction, error) {
	for _, t := range r.store.Read().Transactions {
		if t.ID == id {
			return t, nil
		}
	}
	return models.Transaction{}, fmt.Errorf("transaction %s not found", id)
}

func (r *TransactionRepo) Create(t models.Transaction) (models.Transaction, error) {
	t.ID = uuid.New().String()
	t.CreatedAt = time.Now().UTC()
	return t, r.store.Write(func(s *models.Store) {
		s.Transactions = append(s.Transactions, t)
	})
}

func (r *TransactionRepo) Update(id string, patch models.Transaction) (models.Transaction, error) {
	var updated models.Transaction
	err := r.store.Write(func(s *models.Store) {
		for i, t := range s.Transactions {
			if t.ID == id {
				patch.ID = id
				patch.CreatedAt = t.CreatedAt
				s.Transactions[i] = patch
				updated = patch
				return
			}
		}
	})
	if updated.ID == "" {
		return models.Transaction{}, fmt.Errorf("transaction %s not found", id)
	}
	return updated, err
}

func (r *TransactionRepo) Delete(id string) error {
	return r.store.Write(func(s *models.Store) {
		txns := s.Transactions[:0]
		for _, t := range s.Transactions {
			if t.ID != id {
				txns = append(txns, t)
			}
		}
		s.Transactions = txns
	})
}

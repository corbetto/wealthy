// Package repository handles JSON file persistence with thread-safe access.
package repository

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/corbetto/wealthy/api/internal/models"
)

// FileStore is a thread-safe JSON file store.
type FileStore struct {
	mu   sync.RWMutex
	path string
	data models.Store
}

// NewFileStore opens or creates the JSON store at path.
func NewFileStore(path string) (*FileStore, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return nil, err
	}

	fs := &FileStore{path: path}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		fs.data = models.Store{}
		return fs, fs.flush()
	}

	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(b, &fs.data); err != nil {
		return nil, err
	}
	return fs, nil
}

// Read returns a copy of the current store data.
func (fs *FileStore) Read() models.Store {
	fs.mu.RLock()
	defer fs.mu.RUnlock()
	// Return a deep copy via JSON round-trip to avoid data races on slices.
	b, _ := json.Marshal(fs.data)
	var copy models.Store
	_ = json.Unmarshal(b, &copy)
	return copy
}

// Write applies a mutation function and persists the result atomically.
func (fs *FileStore) Write(fn func(s *models.Store)) error {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	fn(&fs.data)
	return fs.flush()
}

// flush writes the store to disk using a temp-file swap for safety.
func (fs *FileStore) flush() error {
	b, err := json.MarshalIndent(fs.data, "", "  ")
	if err != nil {
		return err
	}
	tmp := fs.path + ".tmp"
	if err := os.WriteFile(tmp, b, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, fs.path)
}

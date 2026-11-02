package models

import "time"

// Tracks only uploads created after this ledger was introduced. Historical and
// claimed receipts are never eligible for orphan cleanup.
type ReceiptUpload struct {
	Reference  string `gorm:"primaryKey;size:100"`
	ClientHash string `gorm:"size:64;index"`
	Size       int64
	Status     string    `gorm:"size:20;index"`
	CreatedAt  time.Time `gorm:"index"`
	ExpiresAt  time.Time `gorm:"index"`
	ClaimedAt  *time.Time
}

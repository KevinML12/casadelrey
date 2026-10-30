package models

import (
	"gorm.io/gorm"
	"time"
)

// EmailMessage holds encrypted content, never exposed through HTTP.
type EmailMessage struct {
	gorm.Model
	EventKey      string     `json:"-" gorm:"size:200;uniqueIndex;not null"`
	SendKey       string     `json:"-" gorm:"size:36;not null"`
	Kind          string     `json:"kind" gorm:"size:50"`
	Recipient     string     `json:"-" gorm:"size:254"`
	Subject       string     `json:"subject" gorm:"size:255"`
	Payload       string     `json:"-" gorm:"type:text"`
	Status        string     `json:"status" gorm:"size:20;index"`
	Attempts      int        `json:"attempts"`
	NextAttemptAt time.Time  `json:"next_attempt_at" gorm:"index"`
	ExpiresAt     time.Time  `json:"expires_at" gorm:"index"`
	RetryUntil    *time.Time `json:"-"`
	LeaseUntil    *time.Time `json:"-"`
	LeaseToken    string     `json:"-" gorm:"size:36"`
	LastError     string     `json:"last_error" gorm:"size:100"`
	ProviderID    string     `json:"provider_id" gorm:"size:255"`
	AcceptedAt    *time.Time `json:"accepted_at"`
}

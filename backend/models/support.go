package models

import (
	"gorm.io/gorm"
	"time"
)

// Support records are private. No public feed or delete endpoint exposes them.
type SupportTicket struct {
	gorm.Model
	OwnerID       uint   `json:"owner_id" gorm:"not null;index"`
	OwnerName     string `json:"owner_name" gorm:"size:100;not null"`
	Subject       string `json:"subject" gorm:"size:160;not null"`
	Module        string `json:"module" gorm:"size:40;not null"`
	Status        string `json:"status" gorm:"size:30;not null;index"`
	Revision      uint   `json:"revision" gorm:"not null;default:0"`
	SubmissionKey string `json:"-" gorm:"size:64;uniqueIndex;not null"`
	RequestHash   string `json:"-" gorm:"size:64;not null"`
}

type SupportMessage struct {
	gorm.Model
	TicketID       uint    `json:"ticket_id" gorm:"not null;index"`
	AuthorID       uint    `json:"author_id" gorm:"not null;index"`
	AuthorName     string  `json:"author_name" gorm:"size:100;not null"`
	Kind           string  `json:"kind" gorm:"size:20;not null"`
	Body           string  `json:"body" gorm:"type:text;not null"`
	PreviousStatus string  `json:"previous_status,omitempty" gorm:"size:30"`
	Status         string  `json:"status,omitempty" gorm:"size:30"`
	SubmissionKey  *string `json:"-" gorm:"size:64;uniqueIndex"`
	RequestHash    string  `json:"-" gorm:"size:64"`
}

type SupportAttachment struct {
	gorm.Model
	TicketID        uint      `json:"ticket_id" gorm:"not null;index"`
	AuthorID        uint      `json:"author_id" gorm:"not null;index"`
	AuthorName      string    `json:"author_name" gorm:"size:100;not null"`
	Name            string    `json:"name" gorm:"size:120;not null"`
	ContentType     string    `json:"content_type" gorm:"size:40;not null"`
	Size            int64     `json:"size" gorm:"not null"`
	Status          string    `json:"-" gorm:"size:20;not null;index"`
	ObjectReference string    `json:"-" gorm:"size:100;uniqueIndex;not null"`
	SubmissionKey   string    `json:"-" gorm:"size:64;uniqueIndex;not null"`
	ContentHash     string    `json:"-" gorm:"size:64;not null"`
	LeaseUntil      time.Time `json:"-"`
}

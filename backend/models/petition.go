package models

import (
	"time"

	"gorm.io/gorm"
)

type Petition struct {
	gorm.Model
	Name       string    `json:"name" gorm:"type:varchar(100);not null"`
	Email      string    `json:"email" gorm:"type:varchar(100);index"`
	Phone      string    `json:"phone" gorm:"type:varchar(20)"`
	Category   string    `json:"category" gorm:"type:varchar(50)"`
	Subject    string    `json:"subject" gorm:"type:varchar(255);not null"`
	Message    string    `json:"message" gorm:"type:text;not null"`
	IsAnswered bool      `json:"is_answered" gorm:"default:false"`
	AnsweredAt time.Time `json:"answered_at"`
	UserID     *uint     `json:"user_id" gorm:"index"`
}

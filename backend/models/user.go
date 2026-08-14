package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name     string `json:"name" gorm:"not null"`
	Email    string `json:"email" gorm:"unique;not null"`
	Password string `json:"-" gorm:"not null"`
	Role     string `json:"role" gorm:"default:member"` // admin|leader|volunteer|member
	Address  string `json:"address"`
	Phone    string `json:"phone" gorm:"type:varchar(30)"`
	// Célula — normalizada
	CellID   *uint  `json:"cell_id" gorm:"index"` // FK → Cell (nuevo)
	CellCode string `json:"cell_code"`            // deprecar tras migración
	CellType string `json:"cell_type"`            // deprecar tras migración
	// Auth
	ResetToken              *string    `json:"-" gorm:"index"`
	ResetTokenExpiry        *time.Time `json:"-"`
	EmailVerified           bool       `json:"email_verified" gorm:"default:false"`
	VerificationToken       *string    `json:"-" gorm:"index"`
	VerificationTokenExpiry *time.Time `json:"-"`
	RefreshToken            *string    `json:"-" gorm:"index"`
	RefreshTokenExpiry      *time.Time `json:"-"`
}

type UserGoal struct {
	gorm.Model
	UserID      uint       `json:"user_id" gorm:"not null;index"`
	Title       string     `json:"title" gorm:"type:varchar(255);not null"`
	Description string     `json:"description" gorm:"type:text"`
	TargetDate  string     `json:"target_date" gorm:"type:varchar(20)"`
	Completed   bool       `json:"completed" gorm:"default:false"`
	CompletedAt *time.Time `json:"completed_at"`
}

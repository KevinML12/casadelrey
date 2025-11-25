package auth

import (
	"time"

	"gorm.io/gorm"
)

// User modelo de usuario
type User struct {
	gorm.Model
	Name             string     `json:"name" gorm:"not null"`
	Email            string     `json:"email" gorm:"unique;not null"`
	Password         string     `json:"-" gorm:"not null"` // "-" omite el campo en JSON
	Role             string     `json:"role" gorm:"default:member"`
	ResetToken       *string    `json:"-" gorm:"index"` // Token para reseteo de contraseña
	ResetTokenExpiry *time.Time `json:"-"`              // Expiración del token de reseteo
}

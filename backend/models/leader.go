package models

import (
	"gorm.io/gorm"
)

type Leader struct {
	gorm.Model
	UserID   *uint  `json:"user_id" gorm:"index"`
	Name     string `json:"name" gorm:"type:varchar(100);not null"`
	PhotoURL string `json:"photo_url" gorm:"type:varchar(500)"`
	Phone    string `json:"phone" gorm:"type:varchar(30)"` // WhatsApp, formato 502XXXXXXXX
	Email    string `json:"email" gorm:"type:varchar(100)"`
	Area     string `json:"area" gorm:"type:varchar(120)"`
	Address  string `json:"address" gorm:"type:varchar(255)"`
	IsActive bool   `json:"is_active" gorm:"default:true"`
}

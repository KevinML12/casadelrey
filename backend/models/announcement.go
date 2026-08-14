package models

import (
	"time"

	"gorm.io/gorm"
)

type Announcement struct {
	gorm.Model
	Title       string     `json:"title" gorm:"type:varchar(255);not null"`
	Content     string     `json:"content" gorm:"type:text;not null"`
	RoleTarget  string     `json:"role_target" gorm:"type:varchar(20);default:all"` // all|member|leader|volunteer|admin
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	PublishedAt *time.Time `json:"published_at"`
	ExpiresAt   *time.Time `json:"expires_at"` // auto-desaparece
	CreatedByID uint       `json:"created_by_id" gorm:"index"`
	Author      User       `json:"author" gorm:"foreignKey:CreatedByID"`
}

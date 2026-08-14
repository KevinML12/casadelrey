package models

import (
	"gorm.io/gorm"
)

type ActivityLog struct {
	gorm.Model
	UserID     uint   `json:"user_id" gorm:"index"`
	UserName   string `json:"user_name" gorm:"type:varchar(100)"`
	Action     string `json:"action" gorm:"type:varchar(50);not null"`
	Resource   string `json:"resource" gorm:"type:varchar(50);not null"`
	ResourceID uint   `json:"resource_id"`
	Details    string `json:"details" gorm:"type:text"`
	IPAddress  string `json:"ip_address" gorm:"type:varchar(45)"`
}

package models

import (
	"gorm.io/gorm"
)

type GalleryPhoto struct {
	gorm.Model
	Title        string `json:"title" gorm:"type:varchar(255)"`
	Description  string `json:"description" gorm:"type:text"`
	URL          string `json:"url" gorm:"type:varchar(500);not null"`
	ThumbnailURL string `json:"thumbnail_url" gorm:"type:varchar(500)"`
	EventID      *uint  `json:"event_id" gorm:"index"`
	UploadedByID uint   `json:"uploaded_by_id" gorm:"index"`
	IsActive     bool   `json:"is_active" gorm:"default:true"`
	SortOrder    int    `json:"sort_order" gorm:"default:0"`
}

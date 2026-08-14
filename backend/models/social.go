package models

import (
	"gorm.io/gorm"
)

type Post struct {
	gorm.Model
	Title          string `json:"title" gorm:"not null"`
	Slug           string `json:"slug" gorm:"unique;not null"`
	Content        string `json:"content" gorm:"type:text"`
	CoverImage     string `json:"cover_image"`
	Excerpt        string `json:"excerpt" gorm:"type:text"`
	RedirectURL    string `json:"redirect_url" gorm:"type:varchar(500)"`
	SocialPlatform string `json:"social_platform" gorm:"type:varchar(20)"` // instagram|facebook|youtube|tiktok
	AuthorID       uint   `json:"author_id" gorm:"not null"`
	Status         string `json:"status" gorm:"default:draft"` // draft|published
	ViewCount      int64  `json:"view_count" gorm:"default:0"`
	Author         User   `json:"author" gorm:"foreignKey:AuthorID"`
}

type SocialPost struct {
	gorm.Model
	Platform     string `json:"platform" gorm:"type:varchar(20);not null"` // facebook|instagram|youtube|tiktok
	PostURL      string `json:"post_url" gorm:"type:varchar(500);not null"`
	Caption      string `json:"caption" gorm:"type:varchar(500)"`
	ImageURL     string `json:"image_url" gorm:"type:varchar(500)"`                     // foto subida a R2
	FeaturedSize string `json:"featured_size" gorm:"type:varchar(20);default:'medium'"` // small|medium|large
	IsActive     bool   `json:"is_active" gorm:"default:true"`
	SortOrder    int    `json:"sort_order" gorm:"default:0"`
}

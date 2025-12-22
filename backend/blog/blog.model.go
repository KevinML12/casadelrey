package blog

import (
	"casadelrey/backend/auth"

	"gorm.io/gorm"
)

// Post modelo de post de blog
type Post struct {
	gorm.Model
	Title    string    `json:"title" gorm:"not null"`
	Slug     string    `json:"slug" gorm:"unique;not null"`
	Content  string    `json:"content" gorm:"type:text;not null"`
	AuthorID uint      `json:"author_id" gorm:"not null"`
	Status   string    `json:"status" gorm:"default:draft"` // 'draft' o 'published'
	Author   auth.User `json:"author" gorm:"foreignKey:AuthorID"`
}

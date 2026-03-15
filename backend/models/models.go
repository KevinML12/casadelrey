package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents the user model
type User struct {
	gorm.Model
	Name     string `json:"name" gorm:"not null"`
	Email    string `json:"email" gorm:"unique;not null"`
	Password string `json:"-" gorm:"not null"`
	Role     string `json:"role" gorm:"default:member"`
}

// Post represents the blog post model
type Post struct {
	gorm.Model
	Title    string `json:"title" gorm:"not null"`
	Slug     string `json:"slug" gorm:"unique;not null"`
	Content  string `json:"content" gorm:"type:text;not null"`
	AuthorID uint   `json:"author_id" gorm:"not null"`
	Status   string `json:"status" gorm:"default:draft"`
	Author   User   `json:"author" gorm:"foreignKey:AuthorID"`
}

// Petition represents a Prayer Petition.
type Petition struct {
	gorm.Model
	Name       string    `json:"name" gorm:"type:varchar(100);not null"`
	Email      string    `json:"email" gorm:"type:varchar(100);index"`
	Phone      string    `json:"phone" gorm:"type:varchar(20)"`
	Subject    string    `json:"subject" gorm:"type:varchar(255);not null"`
	Message    string    `json:"message" gorm:"type:text;not null"`
	IsAnswered bool      `json:"is_answered" gorm:"default:false"`
	AnsweredAt time.Time `json:"answered_at"`
}

// Donation represents a registered donation.
type Donation struct {
	gorm.Model
	Name            string  `json:"name" gorm:"type:varchar(100);not null"`
	Email           string  `json:"email" gorm:"type:varchar(100);index"`
	Amount          float64 `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency        string  `json:"currency" gorm:"type:varchar(3);default:'USD'"`
	PaymentMethod   string  `json:"payment_method" gorm:"type:varchar(50)"`
	TransactionID   string  `json:"transaction_id" gorm:"type:varchar(255);index"`
	IsSuccessful    bool    `json:"is_successful" gorm:"default:true"`
	DonationPurpose string  `json:"donation_purpose" gorm:"type:varchar(255)"`
}
package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents the user model
type User struct {
	gorm.Model
	Name             string     `json:"name" gorm:"not null"`
	Email            string     `json:"email" gorm:"unique;not null"`
	Password         string     `json:"-" gorm:"not null"`
	Role             string     `json:"role" gorm:"default:member"`
	ResetToken       *string    `json:"-" gorm:"index"`
	ResetTokenExpiry *time.Time `json:"-"`
}

// Post represents the blog post model
type Post struct {
	gorm.Model
	Title      string `json:"title" gorm:"not null"`
	Slug       string `json:"slug" gorm:"unique;not null"`
	Content    string `json:"content" gorm:"type:text;not null"`
	CoverImage string `json:"cover_image"`
	Excerpt    string `json:"excerpt" gorm:"type:text"`
	AuthorID   uint   `json:"author_id" gorm:"not null"`
	Status     string `json:"status" gorm:"default:draft"`
	Author     User   `json:"author" gorm:"foreignKey:AuthorID"`
}

// Petition represents a Prayer Petition.
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
}

// Donation represents a registered donation.
type Donation struct {
	gorm.Model
	Name            string  `json:"name" gorm:"type:varchar(100);not null"`
	Email           string  `json:"email" gorm:"type:varchar(100);index"`
	Amount          float64 `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency        string  `json:"currency" gorm:"type:varchar(3);default:'GTQ'"`
	PaymentMethod   string  `json:"payment_method" gorm:"type:varchar(50)"`
	TransactionID   string  `json:"transaction_id" gorm:"type:varchar(255);index"`
	IsSuccessful    bool    `json:"is_successful" gorm:"default:true"`
	DonationPurpose string  `json:"donation_purpose" gorm:"type:varchar(255)"`
}

// PayPalOrder almacena los datos de una orden PayPal pendiente hasta que se capture.
type PayPalOrder struct {
	OrderID   string    `json:"order_id" gorm:"primaryKey;type:varchar(255)"`
	Name      string    `json:"name" gorm:"type:varchar(100);not null"`
	Email     string    `json:"email" gorm:"type:varchar(100)"`
	Amount    float64   `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency  string    `json:"currency" gorm:"type:varchar(3);default:'GTQ'"`
	Purpose   string    `json:"purpose" gorm:"type:varchar(255)"`
	CreatedAt time.Time `json:"created_at"`
}

func (PayPalOrder) TableName() string { return "paypal_orders" }

type Event struct {
	gorm.Model
	Title       string `json:"title" gorm:"type:varchar(255);not null"`
	Date        string `json:"date" gorm:"type:varchar(20)"`
	Location    string `json:"location" gorm:"type:varchar(255)"`
	Description string `json:"description" gorm:"type:text"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`
}

// CellReport representa un reporte de reunión de célula.
type CellReport struct {
	gorm.Model
	LeaderName   string `json:"leader_name" gorm:"type:varchar(100);not null"`
	CellName     string `json:"cell_name" gorm:"type:varchar(100);not null"`
	MeetingDate  string `json:"meeting_date" gorm:"type:varchar(20);not null"`
	Attendance   int    `json:"attendance" gorm:"default:0"`
	NewVisitors  int    `json:"new_visitors" gorm:"default:0"`
	Notes        string `json:"notes" gorm:"type:text"`
}
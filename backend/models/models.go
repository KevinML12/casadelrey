package models

import (
	"casa-del-rey/backend/auth"

	"gorm.io/gorm"
)

// Petition - Modelo de la Petición
type Petition struct {
	gorm.Model        // Campos automáticos: ID, CreatedAt, UpdatedAt, DeletedAt
	Name       string `json:"name" validate:"required"`
	Email      string `json:"email" validate:"required,email"`
	Phone      string `json:"phone"` // Opcional
	Message    string `json:"message" validate:"required"`
	IsPrayer   bool   `json:"is_prayer"` // Indica si es una petición de oración o contacto
}

// Donation - Modelo de Donación
type Donation struct {
	gorm.Model
	Name          string  `json:"name"`
	Email         string  `json:"email" validate:"required,email"`
	Amount        float64 `json:"amount" validate:"required,gt=0"`
	PaymentMethod string  `json:"payment_method"`
	Message       string  `json:"message"`
	Status        string  `json:"status"`         // Pending, Completed, Failed
	TransactionID string  `json:"transaction_id"` // ID de la transacción de la pasarela
}

// Post - Modelo de Post de Blog
type Post struct {
	gorm.Model
	Title    string    `json:"title" gorm:"not null"`
	Slug     string    `json:"slug" gorm:"unique;not null"`
	Content  string    `json:"content" gorm:"type:text;not null"`
	AuthorID uint      `json:"author_id" gorm:"not null"`
	Status   string    `json:"status" gorm:"default:draft"` // 'draft' o 'published'
	Author   auth.User `json:"author" gorm:"foreignKey:AuthorID"`
}

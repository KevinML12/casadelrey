package models

import (
	"time"

	"gorm.io/gorm"
)

type Donation struct {
	gorm.Model
	Name             string  `json:"name" gorm:"type:varchar(100);not null"`
	Email            string  `json:"email" gorm:"type:varchar(100);index"`
	UserID           *uint   `json:"user_id" gorm:"index"` // si el donante es miembro
	Amount           float64 `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency         string  `json:"currency" gorm:"type:varchar(3);default:'GTQ'"`
	PaymentMethod    string  `json:"payment_method" gorm:"type:varchar(50)"` // transferencia|presencial
	PaymentReference string  `json:"payment_reference" gorm:"type:varchar(255)"`
	ReceiptURL       string  `json:"receipt_url" gorm:"type:varchar(500)"`
	ReceiptID        *uint   `json:"receipt_id" gorm:"index"` // FK → PaymentReceipt
	IsSuccessful     bool    `json:"is_successful" gorm:"default:true"`
	DonationPurpose  string  `json:"donation_purpose" gorm:"type:varchar(255)"`
}

// PaymentReceipt verifica comprobantes bancarios para cobros de eventos y donaciones.
type PaymentReceipt struct {
	gorm.Model
	PayerName       string     `json:"payer_name" gorm:"type:varchar(100);not null"`
	PayerEmail      string     `json:"payer_email" gorm:"type:varchar(100)"`
	PayerPhone      string     `json:"payer_phone" gorm:"type:varchar(30)"`
	Amount          float64    `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency        string     `json:"currency" gorm:"type:varchar(3);default:'GTQ'"`
	BankName        string     `json:"bank_name" gorm:"type:varchar(100)"` // Banrural|BAC|G&T|Industrial
	ReferenceNumber string     `json:"reference_number" gorm:"type:varchar(255)"`
	ReceiptImageURL string     `json:"receipt_image_url" gorm:"type:varchar(500)"` // Cloudflare R2
	Purpose         string     `json:"purpose" gorm:"type:varchar(50)"`            // evento|donacion
	EventID         *uint      `json:"event_id" gorm:"index"`
	DonationID      *uint      `json:"donation_id" gorm:"index"`
	Status          string     `json:"status" gorm:"type:varchar(20);default:pendiente"` // pendiente|verificado|rechazado
	VerifiedByID    *uint      `json:"verified_by_id" gorm:"index"`
	VerifiedAt      *time.Time `json:"verified_at"`
	RejectionReason string     `json:"rejection_reason" gorm:"type:varchar(255)"`
}

type DonationPurpose struct {
	gorm.Model
	Value       string `json:"value" gorm:"type:varchar(50);uniqueIndex;not null"` // general, celulas...
	Icon        string `json:"icon" gorm:"type:varchar(30)"`                       // nombre del icono del set (Glass.jsx)
	Title       string `json:"title" gorm:"type:varchar(100);not null"`
	Description string `json:"description" gorm:"type:text"`
	SortOrder   int    `json:"sort_order" gorm:"default:0"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`
}

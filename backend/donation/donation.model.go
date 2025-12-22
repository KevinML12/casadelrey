package donation

import "gorm.io/gorm"

// Donation represents a registered donation.
type Donation struct {
	gorm.Model
	Name            string  `json:"name" gorm:"type:varchar(100);not null"`
	Email           string  `json:"email" gorm:"type:varchar(100);index"`
	Amount          float64 `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency        string  `json:"currency" gorm:"type:varchar(3);default:'USD'"`
	PaymentMethod   string  `json:"payment_method" gorm:"type:varchar(50)"` // Ej: 'PayPal', 'Stripe Card'
	TransactionID   string  `json:"transaction_id" gorm:"type:varchar(255);index"`
	IsSuccessful    bool    `json:"is_successful" gorm:"default:true"`
	DonationPurpose string  `json:"donation_purpose" gorm:"type:varchar(255)"`
}
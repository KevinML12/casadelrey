package donation

import "gorm.io/gorm"

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

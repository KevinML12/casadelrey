package petition

import "gorm.io/gorm"

// Petition - Modelo de la Petición
type Petition struct {
	gorm.Model        // Campos automáticos: ID, CreatedAt, UpdatedAt, DeletedAt
	Name       string `json:"name" validate:"required"`
	Email      string `json:"email" validate:"required,email"`
	Phone      string `json:"phone"` // Opcional
	Message    string `json:"message" validate:"required"`
	IsPrayer   bool   `json:"is_prayer"`                    // Indica si es una petición de oración o contacto
	IsRead     bool   `json:"is_read" gorm:"default:false"` // Indica si fue leída por el admin
}

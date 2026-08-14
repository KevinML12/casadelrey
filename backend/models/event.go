package models

import (
	"gorm.io/gorm"
)

type Event struct {
	gorm.Model
	Title           string  `json:"title" gorm:"type:varchar(255);not null"`
	Date            string  `json:"date" gorm:"type:varchar(20)"`
	Time            string  `json:"time" gorm:"type:varchar(10)"` // "10:00"
	Location        string  `json:"location" gorm:"type:varchar(255)"`
	Description     string  `json:"description" gorm:"type:text"`
	CoverImage      string  `json:"cover_image" gorm:"type:varchar(500)"`
	IsActive        bool    `json:"is_active" gorm:"default:true"`
	RequiresPayment bool    `json:"requires_payment" gorm:"default:false"`
	PriceGTQ        float64 `json:"price_gtq" gorm:"type:decimal(10,2);default:0"`
	PaymentDeadline string  `json:"payment_deadline" gorm:"type:varchar(20)"`
	Capacity        int     `json:"capacity" gorm:"default:0"` // 0 = sin limite de cupo
}

type EventRegistration struct {
	gorm.Model
	EventID       uint   `json:"event_id" gorm:"not null;index"`
	Event         Event  `json:"event" gorm:"foreignKey:EventID"`
	UserID        *uint  `json:"user_id" gorm:"index"`
	Name          string `json:"name" gorm:"type:varchar(100);not null"`
	Email         string `json:"email" gorm:"type:varchar(100);not null"`
	Phone         string `json:"phone" gorm:"type:varchar(30)"`
	AttendeeCount int    `json:"attendee_count" gorm:"default:1"`
	Notes         string `json:"notes" gorm:"type:text"`
	PaymentStatus string `json:"payment_status" gorm:"type:varchar(20);default:no_requerido"` // no_requerido|pendiente|verificado|rechazado
	ReceiptID     *uint  `json:"receipt_id" gorm:"index"`                                     // FK → PaymentReceipt
}

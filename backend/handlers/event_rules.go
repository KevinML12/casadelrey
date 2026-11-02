package handlers

import (
	"casadelrey/backend/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"strings"
	"time"
)

var guatemala = time.FixedZone("Guatemala", -6*60*60)

func eventClosed(event models.Event) bool {
	if !event.IsActive {
		return true
	}
	if event.Date == "" {
		return false
	} // compatibility for older undated records
	d, err := time.ParseInLocation("2006-01-02", event.Date, guatemala)
	if err != nil {
		return true
	}
	return d.Format("2006-01-02") < time.Now().In(guatemala).Format("2006-01-02")
}

func validateEvent(event *models.Event) error {
	event.Title = strings.TrimSpace(event.Title)
	if event.Title == "" || len(event.Title) > 255 {
		return echo.NewHTTPError(400, "Escribe un título de hasta 255 caracteres.")
	}
	if _, err := time.Parse("2006-01-02", event.Date); err != nil {
		return echo.NewHTTPError(400, "Indica una fecha válida para el evento.")
	}
	if event.Time != "" {
		if _, err := time.Parse("15:04", event.Time); err != nil {
			return echo.NewHTTPError(400, "Indica una hora válida.")
		}
	}
	if event.Capacity < 0 || event.Capacity > 100000 {
		return echo.NewHTTPError(400, "El cupo debe estar entre 0 y 100000; 0 significa sin límite.")
	}
	if event.RequiresPayment && !validMoney(event.PriceGTQ) {
		return echo.NewHTTPError(400, "Indica un precio positivo en quetzales, con hasta dos decimales.")
	}
	if !event.RequiresPayment {
		event.PriceGTQ = 0
		event.PaymentDeadline = ""
	}
	if event.PaymentDeadline != "" {
		if _, err := time.Parse("2006-01-02", event.PaymentDeadline); err != nil || event.PaymentDeadline > event.Date {
			return echo.NewHTTPError(400, "El plazo de pago debe ser una fecha válida anterior o igual al evento.")
		}
	}
	if event.ReservationHours == 0 {
		event.ReservationHours = 24
	}
	if event.ReservationHours < 1 || event.ReservationHours > 168 {
		return echo.NewHTTPError(400, "La reserva de cupo admite entre 1 y 168 horas.")
	}
	return nil
}

func occupiedSeats(tx *gorm.DB, eventID, except uint) (int64, error) {
	now := time.Now()
	q := tx.Model(&models.EventRegistration{}).Where("event_id = ? AND id <> ?", eventID, except).
		Where("payment_status IN ? OR (payment_status = ? AND (reservation_expires_at > ? OR (reservation_expires_at IS NULL AND created_at > ?)))", []string{"no_requerido", "verificado"}, "pendiente", now, now.Add(-24*time.Hour))
	var count int64
	err := q.Select("COALESCE(SUM(attendee_count),0)").Scan(&count).Error
	return count, err
}

func reservationExpiry(event models.Event) *time.Time {
	hours := event.ReservationHours
	if hours < 1 {
		hours = 24
	}
	expires := time.Now().Add(time.Duration(hours) * time.Hour)
	return &expires
}

// All payment transitions lock the event before its receipt, matching RSVP.
func lockReceipt(tx *gorm.DB, id interface{}, receipt *models.PaymentReceipt) error {
	var peek models.PaymentReceipt
	if err := tx.Select("id", "event_id").First(&peek, id).Error; err != nil {
		return err
	}
	if peek.EventID != nil {
		var event models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, *peek.EventID).Error; err != nil {
			return err
		}
	}
	return tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(receipt, id).Error
}

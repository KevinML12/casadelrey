package handlers

import (
	"casadelrey/backend/email"
	"casadelrey/backend/models"
	"fmt"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"math"
	"net/http"
	"strings"
	"time"
)

func validMoney(amount float64) bool {
	return !math.IsNaN(amount) && !math.IsInf(amount, 0) && amount > 0 && amount <= 10000000 && math.Abs(amount*100-math.Round(amount*100)) < 0.00001
}
func normalizeEmail(value string) string { return strings.ToLower(strings.TrimSpace(value)) }

// An opaque file capability can only back one receipt, even across different
// events/donations and soft deletions. PostgreSQL serializes on the reference.
func reserveReceipt(tx *gorm.DB, reference string, except uint) error {
	if tx.Dialector.Name() == "postgres" {
		if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", reference).Error; err != nil {
			return err
		}
	}
	var count int64
	if err := tx.Unscoped().Model(&models.PaymentReceipt{}).Where("receipt_image_url = ? AND id <> ?", reference, except).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return echo.NewHTTPError(http.StatusConflict, "Este archivo ya está asociado a otro comprobante. Revisa tu envío anterior.")
	}
	return nil
}
func queueReceiptNotice(tx *gorm.DB, r models.PaymentReceipt, state, action string) error {
	label := "Donación"
	if r.EventID != nil {
		var ev models.Event
		if err := tx.First(&ev, *r.EventID).Error; err != nil {
			return err
		}
		label = ev.Title
	}
	return email.Enqueue(tx, email.Message{Key: fmt.Sprintf("receipt:%d:%d:%s", r.ID, r.Revision, state), Kind: "payment_" + state, To: r.PayerEmail, Subject: "Tu pago — Casa del Rey", HTML: email.GetPaymentUpdateTemplate(r.PayerName, label, state, r.Amount, r.RejectionReason, action)})
}
func paymentDeadlinePassed(event models.Event) bool {
	if event.PaymentDeadline == "" {
		return false
	}
	loc := time.FixedZone("Guatemala", -6*60*60)
	today := time.Now().In(loc).Format("2006-01-02")
	return event.PaymentDeadline < today
}

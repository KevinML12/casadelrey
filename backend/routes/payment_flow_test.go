package routes_test

import (
	"casadelrey/backend/models"
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/stretchr/testify/require"
	"regexp"
	"testing"
	"time"
)

func correctionToken(t *testing.T, row models.EmailMessage) string {
	t.Helper()
	key := sha256.Sum256([]byte("casadelrey/email-outbox/v1/regression-secret-only"))
	block, err := aes.NewCipher(key[:])
	require.NoError(t, err)
	gcm, err := cipher.NewGCM(block)
	require.NoError(t, err)
	data, err := base64.StdEncoding.DecodeString(row.Payload)
	require.NoError(t, err)
	data, err = gcm.Open(nil, data[:gcm.NonceSize()], data[gcm.NonceSize():], nil)
	require.NoError(t, err)
	var payload struct {
		HTML string `json:"html"`
	}
	require.NoError(t, json.Unmarshal(data, &payload))
	match := regexp.MustCompile(`#token=([a-zA-Z0-9_=-]+)`).FindStringSubmatch(payload.HTML)
	require.Len(t, match, 2)
	return match[1]
}
func TestPaymentFlowDonationRejectCorrectApproveAndRevert(t *testing.T) {
	f := newSecurityFixture(t)
	require.NoError(t, f.db.Create(&models.DonationPurpose{Value: "controlled", Title: "Controlled purpose", IsActive: true}).Error)
	data := map[string]interface{}{"payer_name": "Controlled donor", "payer_email": "controlled@example.invalid", "amount": 100, "purpose": "donacion", "donation_purpose": "controlled", "receipt_image_url": "receipt-private:31234567-89ab-4cde-8012-3456789abcde.png"}
	headers := map[string]string{"Idempotency-Key": "controlled-receipt-attempt-001"}
	assertStatus(t, f.req(t, "POST", "/api/v1/receipts", "", data, headers), 201)
	assertStatus(t, f.req(t, "POST", "/api/v1/receipts", "", data, headers), 200)
	var receipt models.PaymentReceipt
	require.NoError(t, f.db.First(&receipt).Error)
	require.NotNil(t, receipt.DonationID)
	verify := fmt.Sprintf("/api/v1/admin/receipts/%d/verify", receipt.ID)
	assertStatus(t, f.req(t, "PUT", verify, "admin", map[string]interface{}{"status": "rechazado"}), 400)
	reject := map[string]interface{}{"status": "rechazado", "rejection_reason": "La referencia no se distingue."}
	assertStatus(t, f.req(t, "PUT", verify, "admin", reject), 200)
	assertStatus(t, f.req(t, "PUT", verify, "admin", reject), 200)
	var count int64
	require.NoError(t, f.db.Model(&models.EmailMessage{}).Count(&count).Error)
	require.EqualValues(t, 2, count)
	var row models.EmailMessage
	require.NoError(t, f.db.Where("kind = ?", "payment_rechazado").First(&row).Error)
	token := correctionToken(t, row)
	path := fmt.Sprintf("/api/v1/receipts/%d/replacement", receipt.ID)
	assertStatus(t, f.req(t, "POST", path, "", map[string]string{"token": "incorrect"}), 403)
	assertStatus(t, f.req(t, "POST", path, "", map[string]string{"token": token}), 200)
	resubmit := fmt.Sprintf("/api/v1/receipts/%d/resubmit", receipt.ID)
	correction := map[string]string{"token": token, "receipt_image_url": "receipt-private:41234567-89ab-4cde-8012-3456789abcde.png", "reference_number": "controlled-ref"}
	assertStatus(t, f.req(t, "PUT", resubmit, "", correction), 200)
	assertStatus(t, f.req(t, "PUT", resubmit, "", correction), 200)
	var donation models.Donation
	require.NoError(t, f.db.First(&donation, *receipt.DonationID).Error)
	require.False(t, donation.IsSuccessful)
	approve := map[string]interface{}{"status": "verificado"}
	assertStatus(t, f.req(t, "PUT", verify, "admin", approve), 200)
	assertStatus(t, f.req(t, "PUT", verify, "admin", approve), 200)
	require.NoError(t, f.db.First(&donation, donation.ID).Error)
	require.True(t, donation.IsSuccessful)
	assertStatus(t, f.req(t, "PUT", verify, "admin", reject), 409)
	assertStatus(t, f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/receipts/%d/revert", receipt.ID), "admin", nil), 200)
	require.NoError(t, f.db.First(&donation, donation.ID).Error)
	require.False(t, donation.IsSuccessful)
	require.NoError(t, f.db.Model(&models.EmailMessage{}).Count(&count).Error)
	require.EqualValues(t, 5, count)
	// Neither anonymous visitors nor leaders can inspect the mail queue.
	assertStatus(t, f.req(t, "GET", "/api/v1/admin/email/messages", "", nil), 401)
	assertStatus(t, f.req(t, "GET", "/api/v1/admin/email/messages", "leader", nil), 403)
	result := f.req(t, "GET", "/api/v1/admin/email/messages", "admin", nil)
	assertStatus(t, result, 200)
	require.NotContains(t, result.Body.String(), token)
	require.NotContains(t, result.Body.String(), row.Payload)
	require.NotContains(t, result.Body.String(), "controlled@example.invalid")
}
func TestPaymentFlowPreviouslyLoadedEventFormKeepsStableReceipt(t *testing.T) {
	f := newSecurityFixture(t)
	ev := models.Event{Title: "Controlled event", IsActive: true, RequiresPayment: true, PriceGTQ: 50}
	require.NoError(t, f.db.Create(&ev).Error)
	data := map[string]interface{}{"payer_name": "Controlled visitor", "payer_email": "controlled@example.invalid", "amount": 50, "purpose": "evento", "event_id": ev.ID, "receipt_image_url": "receipt-private:81234567-89ab-4cde-8012-3456789abcde.png"}
	assertStatus(t, f.req(t, "POST", "/api/v1/receipts", "", data), 201)
	assertStatus(t, f.req(t, "POST", "/api/v1/receipts", "", data), 200)
	var count int64
	require.NoError(t, f.db.Model(&models.PaymentReceipt{}).Count(&count).Error)
	require.EqualValues(t, 1, count)
}
func TestPaymentFlowAtomicPaidRegistrationAndMailFailureRollback(t *testing.T) {
	f := newSecurityFixture(t)
	ev := models.Event{Title: "Controlled event", IsActive: true, RequiresPayment: true, PriceGTQ: 50, Capacity: 2}
	require.NoError(t, f.db.Create(&ev).Error)
	data := map[string]interface{}{"name": "Controlled visitor", "email": "controlled@example.invalid", "attendee_count": 2, "receipt": map[string]interface{}{"amount": 100, "receipt_image_url": "receipt-private:51234567-89ab-4cde-8012-3456789abcde.png"}}
	headers := map[string]string{"Idempotency-Key": "controlled-paid-rsvp-001"}
	path := fmt.Sprintf("/api/v1/events/%d/rsvp", ev.ID)
	require.NoError(t, f.db.Exec(`CREATE TRIGGER fail_mail BEFORE INSERT ON email_messages BEGIN SELECT RAISE(FAIL, 'simulated outbox failure'); END`).Error)
	assertStatus(t, f.req(t, "POST", path, "", data, headers), 500)
	for _, model := range []interface{}{&models.EventRegistration{}, &models.PaymentReceipt{}, &models.EmailMessage{}} {
		var n int64
		require.NoError(t, f.db.Model(model).Count(&n).Error)
		require.Zero(t, n)
	}
	require.NoError(t, f.db.Exec(`DROP TRIGGER fail_mail`).Error)
	assertStatus(t, f.req(t, "POST", path, "", data, headers), 201)
	assertStatus(t, f.req(t, "POST", path, "", data, headers), 200)
	var reg models.EventRegistration
	require.NoError(t, f.db.First(&reg).Error)
	require.NotNil(t, reg.ReceiptID)
	require.Equal(t, "pendiente", reg.PaymentStatus)
	assertStatus(t, f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/receipts/%d/verify", *reg.ReceiptID), "admin", map[string]string{"status": "verificado"}), 200)
	require.NoError(t, f.db.First(&reg, reg.ID).Error)
	require.Equal(t, "verificado", reg.PaymentStatus)
	var n int64
	require.NoError(t, f.db.Model(&models.EventRegistration{}).Count(&n).Error)
	require.EqualValues(t, 1, n)
}
func TestPaymentFlowRejectsForgedAssociationAndExpiredCorrection(t *testing.T) {
	f := newSecurityFixture(t)
	data := map[string]interface{}{"payer_name": "Controlled", "payer_email": "controlled@example.invalid", "amount": 100, "purpose": "donacion", "donation_id": 123, "receipt_image_url": "receipt-private:61234567-89ab-4cde-8012-3456789abcde.png"}
	assertStatus(t, f.req(t, "POST", "/api/v1/receipts", "", data, map[string]string{"Idempotency-Key": "controlled-association-001"}), 400)
	expiry := time.Now().Add(-time.Second)
	r := models.PaymentReceipt{PayerName: "Controlled", PayerEmail: "controlled@example.invalid", Amount: 100, Purpose: "donacion", Status: "rechazado", ReplacementTokenExpiry: &expiry, ReplacementTokenHash: "expired"}
	require.NoError(t, f.db.Create(&r).Error)
	assertStatus(t, f.req(t, "POST", fmt.Sprintf("/api/v1/receipts/%d/replacement", r.ID), "", map[string]string{"token": "expired"}), 403)
}

func TestPaymentFlowCashIntentionIsVisibleAndConfirmedExactlyOnce(t *testing.T) {
	f := newSecurityFixture(t)
	donation := models.Donation{Name: "Controlled donor", Email: "controlled@example.invalid", Amount: 50, Currency: "GTQ", PaymentMethod: "presencial", IsSuccessful: false}
	require.NoError(t, f.db.Create(&donation).Error)
	list := f.req(t, "GET", "/api/v1/admin/donations", "admin", nil)
	assertStatus(t, list, 200)
	require.Contains(t, list.Body.String(), "Controlled donor")
	require.Contains(t, list.Body.String(), `"is_successful":false`)
	path := fmt.Sprintf("/api/v1/admin/donations/%d/cash", donation.ID)
	assertStatus(t, f.req(t, "PUT", path, "member", map[string]bool{"received": true}), 403)
	assertStatus(t, f.req(t, "PUT", path, "admin", map[string]bool{"received": true}), 200)
	assertStatus(t, f.req(t, "PUT", path, "admin", map[string]bool{"received": true}), 200)
	require.NoError(t, f.db.First(&donation, donation.ID).Error)
	require.True(t, donation.IsSuccessful)
	require.NotNil(t, donation.ConfirmedAt)
	require.NotNil(t, donation.ConfirmedByID)
	var n int64
	require.NoError(t, f.db.Model(&models.EmailMessage{}).Count(&n).Error)
	require.EqualValues(t, 1, n)
	assertStatus(t, f.req(t, "PUT", path, "admin", map[string]bool{"received": false}), 200)
	id := donation.ID
	donation = models.Donation{}
	require.NoError(t, f.db.First(&donation, id).Error)
	require.False(t, donation.IsSuccessful)
	require.Nil(t, donation.ConfirmedAt)
	require.NoError(t, f.db.Model(&models.EmailMessage{}).Count(&n).Error)
	require.EqualValues(t, 2, n)
	transfer := models.Donation{Name: "Controlled transfer", Amount: 100, Currency: "GTQ", PaymentMethod: "transferencia"}
	require.NoError(t, f.db.Create(&transfer).Error)
	assertStatus(t, f.req(t, "PUT", fmt.Sprintf("/api/v1/admin/donations/%d/cash", transfer.ID), "admin", map[string]bool{"received": true}), 400)
}

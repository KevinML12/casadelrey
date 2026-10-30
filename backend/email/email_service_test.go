package email

import (
	"casadelrey/backend/config"
	"casadelrey/backend/models"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func fixture(t *testing.T) *Service {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	require.NoError(t, err)
	sqlDB, err := db.DB()
	require.NoError(t, err)
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { sqlDB.Close() })
	require.NoError(t, db.AutoMigrate(&models.EmailMessage{}, &models.SitePhoto{}))
	cfg := &config.Config{JWTSecret: "test-only-secret-for-encryption", BrevoKey: "not-a-real-key", MailFromEmail: "sender@example.invalid", MailFromName: "Casa del Rey", ClientURL: "https://casadelreyhue.vercel.app"}
	old := config.AppConfig
	config.AppConfig = cfg
	t.Cleanup(func() { config.AppConfig = old })
	return NewService(db, cfg)
}
func queue(t *testing.T, s *Service, key string) models.EmailMessage {
	t.Helper()
	require.NoError(t, Enqueue(s.DB, Message{Key: key, Kind: "payment_verified", To: "controlled@example.invalid", Subject: "Tu pago", HTML: "<h1>Estado</h1><p>Secret action token: test-credential</p>"}))
	var row models.EmailMessage
	require.NoError(t, s.DB.Where("event_key = ?", key).First(&row).Error)
	return row
}
func TestOutboxSurvivesDisabledProviderAndDeduplicates(t *testing.T) {
	s := fixture(t)
	s.Config.BrevoKey = ""
	r := queue(t, s, "payment:1")
	queue(t, s, "payment:1")
	var count int64
	require.NoError(t, s.DB.Model(&models.EmailMessage{}).Count(&count).Error)
	require.EqualValues(t, 1, count)
	require.NotContains(t, r.Payload, "test-credential")
	require.NoError(t, s.Tick(context.Background()))
	require.NoError(t, s.DB.First(&r, r.ID).Error)
	require.Equal(t, "pending", r.Status)
	b, _ := json.Marshal(r)
	require.NotContains(t, string(b), "controlled@example.invalid")
	require.NotContains(t, string(b), "Payload")
}
func TestOutboxAcceptedOnceClearsEncryptedContent(t *testing.T) {
	s := fixture(t)
	r := queue(t, s, "payment:2")
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		calls++
		require.Equal(t, "not-a-real-key", req.Header.Get("api-key"))
		var got sendRequest
		require.NoError(t, json.NewDecoder(req.Body).Decode(&got))
		require.Equal(t, r.SendKey, got.Headers["idempotencyKey"])
		require.Contains(t, got.Text, "test-credential")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(201)
		fmt.Fprint(w, `{"messageId":"controlled-provider-id"}`)
	}))
	defer server.Close()
	s.endpoint = server.URL
	require.NoError(t, s.Tick(context.Background()))
	require.NoError(t, s.Tick(context.Background()))
	require.Equal(t, 1, calls)
	require.NoError(t, s.DB.First(&r, r.ID).Error)
	require.Equal(t, "accepted", r.Status)
	require.Equal(t, "", r.Payload)
	require.NotNil(t, r.AcceptedAt)
}
func TestOutboxRetryAndUnknownDeliveryAreDistinct(t *testing.T) {
	s := fixture(t)
	r := queue(t, s, "payment:3")
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		calls++
		w.Header().Set("Retry-After", "120")
		w.WriteHeader(429)
	}))
	defer server.Close()
	s.endpoint = server.URL
	require.NoError(t, s.Tick(context.Background()))
	require.NoError(t, s.DB.First(&r, r.ID).Error)
	require.Equal(t, "pending", r.Status)
	require.True(t, r.NextAttemptAt.After(time.Now().Add(100*time.Second)))
	require.NoError(t, s.Tick(context.Background()))
	require.Equal(t, 1, calls)
	past := time.Now().Add(-time.Minute)
	require.NoError(t, s.DB.Model(&r).Updates(map[string]interface{}{"status": "processing", "lease_until": past, "lease_token": "lost-worker"}).Error)
	require.NoError(t, s.Tick(context.Background()))
	require.NoError(t, s.DB.First(&r, r.ID).Error)
	require.Equal(t, "uncertain", r.Status)
	require.Equal(t, 1, calls)
}
func TestOutboxExpiresActionLinksAndHonorsLocalFreeLimit(t *testing.T) {
	s := fixture(t)
	r := queue(t, s, "expired")
	require.NoError(t, s.DB.Model(&r).Update("expires_at", time.Now().Add(-time.Second)).Error)
	require.NoError(t, s.Tick(context.Background()))
	require.NoError(t, s.DB.First(&r, r.ID).Error)
	require.Equal(t, "expired", r.Status)
	require.Empty(t, r.Payload)
	now := time.Now()
	rows := make([]models.EmailMessage, 250)
	for i := range rows {
		rows[i] = models.EmailMessage{EventKey: fmt.Sprintf("accepted:%d", i), SendKey: fmt.Sprint(i), Status: "accepted", AcceptedAt: &now, ExpiresAt: now.Add(time.Hour), NextAttemptAt: now}
	}
	require.NoError(t, s.DB.CreateInBatches(rows, 50).Error)
	pending := queue(t, s, "quota")
	s.endpoint = "http://127.0.0.1:1"
	require.NoError(t, s.Tick(context.Background()))
	require.NoError(t, s.DB.First(&pending, pending.ID).Error)
	require.Equal(t, "pending", pending.Status)
	require.Zero(t, pending.Attempts)
}
func TestTransactionalQueueRollback(t *testing.T) {
	s := fixture(t)
	require.Error(t, s.DB.Transaction(func(tx *gorm.DB) error {
		require.NoError(t, Enqueue(tx, Message{Key: "rollback", To: "controlled@example.invalid", Subject: "Test", HTML: "Test"}))
		return fmt.Errorf("business failure")
	}))
	var n int64
	require.NoError(t, s.DB.Model(&models.EmailMessage{}).Count(&n).Error)
	require.Zero(t, n)
}
func TestTemplatesEscapeInputAndUseManagedBackground(t *testing.T) {
	s := fixture(t)
	background := "https://cdn.example.invalid/group.webp"
	require.NoError(t, s.DB.Create(&models.SitePhoto{Key: "email_fondo", ImageURL: background}).Error)
	body := GetPaymentUpdateTemplate(`<img src=x onerror=alert(1)>`, `<script>event</script>`, "rechazado", 100, `<iframe>reason</iframe>`, "https://example.invalid/comprobante#token=controlled")
	require.NotContains(t, body, "<iframe>")
	require.NotContains(t, body, "<script>")
	require.Contains(t, body, "&lt;img")
	require.NoError(t, Enqueue(s.DB, Message{Key: "template", To: "controlled@example.invalid", HTML: body}))
	var r models.EmailMessage
	require.NoError(t, s.DB.Where("event_key = ?", "template").First(&r).Error)
	data, err := base64.StdEncoding.DecodeString(r.Payload)
	require.NoError(t, err)
	data, err = cryptPayload(data, s.Config.JWTSecret, true)
	require.NoError(t, err)
	require.Contains(t, string(data), background)
	require.NotContains(t, string(data), "__CDR_EMAIL_BG__")
}
func TestPreviewTemplates(t *testing.T) {
	dir := os.Getenv("CDR_EMAIL_PREVIEW_DIR")
	if dir == "" {
		t.Skip("preview export disabled")
	}
	s := fixture(t)
	require.NoError(t, os.MkdirAll(dir, 0700))
	themes := map[string]string{"verified": GetPaymentUpdateTemplate("Ana Pérez", "Encuentro de la comunidad", "verificado", 250, "", ""), "rejected": GetPaymentUpdateTemplate("Ana Pérez", "Donación", "rechazado", 100, "La referencia no se distingue en la imagen.", s.Config.ClientURL+"/comprobante?receipt=1#token=preview-only"), "registration": GetEventRegistrationTemplate("Ana Pérez", "Encuentro de la comunidad", "2026-11-08", "18:00", "Casa del Rey", "pendiente", 2), "verification": GetVerificationEmailTemplate("Ana Pérez", "preview-only"), "reset": GetPasswordResetTemplate("preview-only"), "cancellation": GetCancellationTemplate(strings.Repeat("a", 43) + "=")}
	for name, body := range themes {
		body = strings.ReplaceAll(body, "__CDR_EMAIL_BG__", os.Getenv("CDR_EMAIL_PREVIEW_PHOTO"))
		require.NoError(t, os.WriteFile(filepath.Join(dir, name+".html"), []byte(body), 0600))
	}
}

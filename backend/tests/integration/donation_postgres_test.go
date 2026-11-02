package integration_test

import (
	"bytes"
	"casadelrey/backend/config"
	"casadelrey/backend/email"
	"casadelrey/backend/storage"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"casadelrey/backend/handlers"
	"casadelrey/backend/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type controlledReceiptStore struct{ storage.Store }

func (controlledReceiptStore) OpenReceipt(context.Context, string) (io.ReadCloser, string, error) {
	return io.NopCloser(strings.NewReader("controlled private receipt")), "image/png", nil
}
func (controlledReceiptStore) UploadReceipt(context.Context, string, io.Reader, int64, string) (string, error) {
	return "", fmt.Errorf("unused")
}

func TestDonationConcurrentPostgres(t *testing.T) {
	dsn := os.Getenv("CDR_TEST_POSTGRES_DSN")
	if dsn == "" {
		t.Skip("set CDR_TEST_POSTGRES_DSN for a disposable local PostgreSQL server")
	}
	cfg, err := pgx.ParseConfig(dsn)
	require.NoError(t, err)
	require.Contains(t, []string{"127.0.0.1", "localhost", "::1"}, cfg.Host, "this test must never use a remote/production database")
	schema := "cdr_qa_" + uuid.NewString()[:8]
	basePool := stdlib.OpenDB(*cfg)
	defer basePool.Close()
	_, err = basePool.Exec(`CREATE SCHEMA "` + schema + `"`)
	require.NoError(t, err)
	defer func() { _, _ = basePool.Exec(`DROP SCHEMA "` + schema + `" CASCADE`) }()
	cfg.RuntimeParams["search_path"] = schema
	pool := stdlib.OpenDB(*cfg)
	defer pool.Close()
	pool.SetMaxOpenConns(12)
	db, err := gorm.Open(postgres.New(postgres.Config{Conn: pool}), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.Donation{}, &models.PaymentReceipt{}, &models.ReceiptUpload{}, &models.EmailMessage{}, &models.SitePhoto{}))
	e := echo.New()
	previous := config.AppConfig
	config.AppConfig = &config.Config{JWTSecret: "controlled-postgres-test-secret", ClientURL: "https://example.invalid"}
	t.Cleanup(func() { config.AppConfig = previous })
	e.POST("/donations/register", handlers.NewDonationHandler(db, controlledReceiptStore{}).RegisterDonation)
	body := []byte(`{"name":"Synthetic donor","email":"controlled@example.invalid","amount":100,"currency":"GTQ","payment_method":"transferencia","receipt":{"receipt_image_url":"receipt-private:01234567-89ab-4cde-8012-3456789abcde.png"}}`)
	responses := make([]*httptest.ResponseRecorder, 12)
	var wg sync.WaitGroup
	start := make(chan struct{})
	for i := range responses {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			<-start
			req := httptest.NewRequest("POST", "/donations/register", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Idempotency-Key", "postgres-concurrent-fixture")
			responses[i] = httptest.NewRecorder()
			e.ServeHTTP(responses[i], req)
		}(i)
	}
	close(start)
	wg.Wait()
	created := 0
	for _, response := range responses {
		if response.Code == 201 {
			created++
		} else {
			require.Equal(t, 200, response.Code, response.Body.String())
		}
		require.JSONEq(t, responses[0].Body.String(), response.Body.String())
	}
	require.Equal(t, 1, created)
	for _, table := range []string{"donations", "payment_receipts", "email_messages"} {
		var count int64
		require.NoError(t, db.Table(table).Count(&count).Error)
		require.EqualValues(t, 1, count, fmt.Sprintf("%s must not duplicate", table))
	}
	// Another submission key cannot reuse the same private file for a second payment.
	reused := httptest.NewRequest("POST", "/donations/register", bytes.NewReader(body))
	reused.Header.Set("Content-Type", "application/json")
	reused.Header.Set("Idempotency-Key", "different-postgres-submission")
	reusedResponse := httptest.NewRecorder()
	e.ServeHTTP(reusedResponse, reused)
	require.Equal(t, http.StatusConflict, reusedResponse.Code, reusedResponse.Body.String())

	// Two overlapping instances may process the queue during a deployment.
	// A PostgreSQL lease must allow only one provider request for this record.
	var calls atomic.Int32
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		w.WriteHeader(201)
		fmt.Fprint(w, `{"messageId":"controlled-concurrent-provider"}`)
	}))
	defer provider.Close()
	config.AppConfig.BrevoKey = "controlled-key"
	config.AppConfig.MailFromEmail = "sender@example.invalid"
	service := email.NewService(db, config.AppConfig)
	service.Client = &http.Client{Transport: controlledMailTransport{target: provider.URL}}
	errors := make(chan error, 12)
	for range 12 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			errors <- service.Tick(context.Background())
		}()
	}
	wg.Wait()
	close(errors)
	for err := range errors {
		require.NoError(t, err)
	}
	require.EqualValues(t, 1, calls.Load())
	var accepted int64
	require.NoError(t, db.Model(&models.EmailMessage{}).Where("status = ?", "accepted").Count(&accepted).Error)
	require.EqualValues(t, 1, accepted)

	t.Run("simultaneous administrator demotions preserve one administrator", func(t *testing.T) {
		require.NoError(t, db.AutoMigrate(&models.User{}, &models.ActivityLog{}))
		users := []models.User{{Name: "One", Email: "one@example.invalid", Password: "unused", Role: "admin"}, {Name: "Two", Email: "two@example.invalid", Password: "unused", Role: "admin"}}
		require.NoError(t, db.Create(&users).Error)
		app := echo.New()
		app.PUT("/roles/:id", handlers.NewAdminHandler(db).UpdateUserRole)
		results := make(chan int, 2)
		start := make(chan struct{})
		for _, user := range users {
			wg.Add(1)
			go func(id uint) {
				defer wg.Done()
				<-start
				req := httptest.NewRequest("PUT", fmt.Sprintf("/roles/%d", id), strings.NewReader(`{"role":"member"}`))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Idempotency-Key", "controlled-seat-race")
				rec := httptest.NewRecorder()
				app.ServeHTTP(rec, req)
				results <- rec.Code
			}(user.ID)
		}
		close(start)
		wg.Wait()
		close(results)
		statuses := map[int]int{}
		for result := range results {
			statuses[result]++
		}
		require.Equal(t, map[int]int{200: 1, 409: 1}, statuses)
		var admins int64
		require.NoError(t, db.Model(&models.User{}).Where("role = ?", "admin").Count(&admins).Error)
		require.EqualValues(t, 1, admins)
	})
	t.Run("late payment approval competes safely with a new reservation", func(t *testing.T) {
		require.NoError(t, db.AutoMigrate(&models.Event{}, &models.EventRegistration{}, &models.ActivityLog{}))
		event := models.Event{Title: "Controlled race", Date: "2099-12-01", IsActive: true, RequiresPayment: true, PriceGTQ: 50, Capacity: 1}
		require.NoError(t, db.Create(&event).Error)
		receipt := models.PaymentReceipt{PayerName: "Earlier", PayerEmail: "earlier@example.invalid", Amount: 50, Currency: "GTQ", Purpose: "evento", EventID: &event.ID, Status: "pendiente"}
		require.NoError(t, db.Create(&receipt).Error)
		expires := time.Now().Add(-time.Minute)
		require.NoError(t, db.Create(&models.EventRegistration{EventID: event.ID, Name: "Earlier", Email: receipt.PayerEmail, AttendeeCount: 1, PaymentStatus: "pendiente", ReceiptID: &receipt.ID, ReservationExpiresAt: &expires}).Error)
		app := echo.New()
		app.PUT("/receipts/:id/verify", handlers.NewPaymentReceiptHandler(db, controlledReceiptStore{}).Verify)
		app.POST("/events/:id/rsvp", handlers.NewRSVPHandler(db, controlledReceiptStore{}).RegisterRSVP)
		bodies := []struct{ method, path, body string }{{"PUT", fmt.Sprintf("/receipts/%d/verify", receipt.ID), `{"status":"verificado"}`}, {"POST", fmt.Sprintf("/events/%d/rsvp", event.ID), `{"name":"New attendee","email":"new@example.invalid","attendee_count":1,"receipt":{"amount":50,"receipt_image_url":"receipt-private:31234567-89ab-4cde-8012-3456789abcde.png"}}`}}
		results := make(chan int, 2)
		start := make(chan struct{})
		for _, body := range bodies {
			wg.Add(1)
			go func(method, path, body string) {
				defer wg.Done()
				<-start
				req := httptest.NewRequest(method, path, strings.NewReader(body))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Idempotency-Key", "controlled-seat-race")
				rec := httptest.NewRecorder()
				app.ServeHTTP(rec, req)
				results <- rec.Code
			}(body.method, body.path, body.body)
		}
		close(start)
		wg.Wait()
		close(results)
		success, conflict := 0, 0
		for status := range results {
			if status == 200 || status == 201 {
				success++
			} else {
				require.Equal(t, 409, status)
				conflict++
			}
		}
		require.Equal(t, 1, success)
		require.Equal(t, 1, conflict)
	})
}

// Route the production client's request to a local fake without exposing a
// mutable provider endpoint in application configuration.
type controlledMailTransport struct{ target string }

func (t controlledMailTransport) RoundTrip(r *http.Request) (*http.Response, error) {
	copy := r.Clone(r.Context())
	url, err := http.NewRequest(r.Method, t.target, nil)
	if err != nil {
		return nil, err
	}
	copy.URL = url.URL
	return http.DefaultTransport.RoundTrip(copy)
}

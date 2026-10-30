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
	require.NoError(t, db.AutoMigrate(&models.Donation{}, &models.PaymentReceipt{}, &models.EmailMessage{}, &models.SitePhoto{}))
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

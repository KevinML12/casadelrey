package integration_test

import (
	"bytes"
	"fmt"
	"net/http/httptest"
	"os"
	"sync"
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
	require.NoError(t, db.AutoMigrate(&models.Donation{}, &models.PaymentReceipt{}))
	e := echo.New()
	e.POST("/donations/register", handlers.NewDonationHandler(db).RegisterDonation)
	body := []byte(`{"name":"Synthetic donor","amount":100,"currency":"GTQ","payment_method":"transferencia","receipt":{"receipt_image_url":"receipt-private:01234567-89ab-4cde-8012-3456789abcde.png"}}`)
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
	for _, table := range []string{"donations", "payment_receipts"} {
		var count int64
		require.NoError(t, db.Table(table).Count(&count).Error)
		require.EqualValues(t, 1, count, fmt.Sprintf("%s must not duplicate", table))
	}
}

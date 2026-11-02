package integration_test

import (
	"bytes"
	"casadelrey/backend/handlers"
	"casadelrey/backend/models"
	"casadelrey/backend/storage"
	"context"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"image"
	"image/png"
	"io"
	"mime/multipart"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
)

type supportPGStore struct {
	storage.Store
	calls atomic.Int32
}

func (s *supportPGStore) UploadSupport(_ context.Context, name string, _ io.Reader, _ int64, _ string) (string, error) {
	s.calls.Add(1)
	return storage.SupportReference(name), nil
}
func (s *supportPGStore) OpenSupport(context.Context, string) (io.ReadCloser, string, error) {
	return nil, "", fmt.Errorf("unused")
}
func TestSupportConcurrentPostgres(t *testing.T) {
	dsn := os.Getenv("CDR_TEST_POSTGRES_DSN")
	if dsn == "" {
		t.Skip("disposable local PostgreSQL only")
	}
	cfg, err := pgx.ParseConfig(dsn)
	require.NoError(t, err)
	require.Contains(t, []string{"localhost", "127.0.0.1", "::1"}, cfg.Host)
	schema := "support_" + uuid.NewString()[:8]
	base := stdlib.OpenDB(*cfg)
	defer base.Close()
	_, err = base.Exec(`CREATE SCHEMA "` + schema + `"`)
	require.NoError(t, err)
	defer func() { _, _ = base.Exec(`DROP SCHEMA "` + schema + `" CASCADE`) }()
	cfg.RuntimeParams["search_path"] = schema
	pool := stdlib.OpenDB(*cfg)
	defer pool.Close()
	pool.SetMaxOpenConns(12)
	db, err := gorm.Open(postgres.New(postgres.Config{Conn: pool}), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.SupportTicket{}, &models.SupportMessage{}, &models.SupportAttachment{}))
	store := &supportPGStore{}
	handler := handlers.NewSupportHandler(db, store)
	app := echo.New()
	app.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("user_id", uint(42))
			c.Set("user_name", "Controlled staff")
			c.Set("user_role", "admin")
			return next(c)
		}
	})
	app.POST("/tickets", handler.Create)
	app.POST("/tickets/:id/messages", handler.Reply)
	app.POST("/tickets/:id/attachments", handler.Upload)
	run := func(path, body, contentType, key string) []*httptest.ResponseRecorder {
		responses := make([]*httptest.ResponseRecorder, 12)
		var wg sync.WaitGroup
		start := make(chan struct{})
		for index := range responses {
			wg.Add(1)
			go func(index int) {
				defer wg.Done()
				<-start
				req := httptest.NewRequest("POST", path, strings.NewReader(body))
				req.Header.Set("Content-Type", contentType)
				req.Header.Set("Idempotency-Key", key)
				rec := httptest.NewRecorder()
				app.ServeHTTP(rec, req)
				responses[index] = rec
			}(index)
		}
		close(start)
		wg.Wait()
		return responses
	}
	creates := run("/tickets", `{"subject":"Controlled report failure","module":"celulas","body":"The report cannot be saved after completing the required fields."}`, "application/json", "controlled-concurrent-case")
	created := 0
	for _, response := range creates {
		if response.Code == 201 {
			created++
		} else {
			require.Equal(t, 200, response.Code, response.Body.String())
		}
	}
	require.Equal(t, 1, created)
	var ticket models.SupportTicket
	require.NoError(t, json.Unmarshal(creates[0].Body.Bytes(), &ticket))
	var count int64
	require.NoError(t, db.Model(&models.SupportTicket{}).Count(&count).Error)
	require.EqualValues(t, 1, count)
	replies := run(fmt.Sprintf("/tickets/%d/messages", ticket.ID), `{"body":"A controlled response without duplicates."}`, "application/json", "controlled-concurrent-reply")
	created = 0
	for _, response := range replies {
		if response.Code == 201 {
			created++
		} else {
			require.Equal(t, 200, response.Code, response.Body.String())
		}
	}
	require.Equal(t, 1, created)
	require.NoError(t, db.Model(&models.SupportMessage{}).Count(&count).Error)
	require.EqualValues(t, 2, count)
	var pngData, body bytes.Buffer
	require.NoError(t, png.Encode(&pngData, image.NewRGBA(image.Rect(0, 0, 2, 2))))
	form := multipart.NewWriter(&body)
	part, err := form.CreateFormFile("file", "capture.png")
	require.NoError(t, err)
	_, err = part.Write(pngData.Bytes())
	require.NoError(t, err)
	require.NoError(t, form.Close())
	files := run(fmt.Sprintf("/tickets/%d/attachments", ticket.ID), body.String(), form.FormDataContentType(), "controlled-concurrent-capture")
	created = 0
	for _, response := range files {
		switch response.Code {
		case 201:
			created++
		case 200, 409:
		default:
			t.Fatalf("upload status %d: %s", response.Code, response.Body.String())
		}
	}
	require.Equal(t, 1, created)
	require.EqualValues(t, 1, store.calls.Load())
	var attachment models.SupportAttachment
	require.NoError(t, db.First(&attachment).Error)
	require.Equal(t, "ready", attachment.Status)
}

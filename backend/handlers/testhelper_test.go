package handlers_test

// testhelper_test.go — utilidades compartidas para todos los handler tests.
//
// newMockDB: crea un *gorm.DB respaldado por go-sqlmock (sin base de datos real).
// newEchoCtx: atajo para crear un Echo context con body JSON y roles inyectados.

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// newMockDB devuelve un *gorm.DB conectado a sqlmock y el mock para configurar expectativas.
// El sql.DB debe cerrarse al terminar el test: defer sqlDB.Close().
func newMockDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock, *sql.DB) {
	t.Helper()
	sqlDB, mock, err := sqlmock.New()
	require.NoError(t, err)

	gormDB, err := gorm.Open(
		postgres.New(postgres.Config{Conn: sqlDB}),
		&gorm.Config{Logger: logger.Default.LogMode(logger.Silent)},
	)
	require.NoError(t, err)
	return gormDB, mock, sqlDB
}

// ctxOpts configura un Echo context para tests.
type ctxOpts struct {
	method string
	body   interface{}
	role   string
	userID uint
	params map[string]string
}

// newCtx crea un echo.Context listo para pasar a un handler.
func newCtx(t *testing.T, opts ctxOpts) (echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	e := echo.New()
	method := opts.method
	if method == "" {
		method = http.MethodPost
	}

	var req *http.Request
	if opts.body != nil {
		b, err := json.Marshal(opts.body)
		require.NoError(t, err)
		req = httptest.NewRequest(method, "/", bytes.NewBuffer(b))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, "/", nil)
	}

	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if opts.role != "" {
		c.Set("user_role", opts.role)
	}
	if opts.userID != 0 {
		c.Set("user_id", opts.userID)
	}
	if len(opts.params) > 0 {
		names := make([]string, 0, len(opts.params))
		vals  := make([]string, 0, len(opts.params))
		for k, v := range opts.params {
			names = append(names, k)
			vals  = append(vals, v)
		}
		c.SetParamNames(names...)
		c.SetParamValues(vals...)
	}
	return c, rec
}

// decodeBody parsea el JSON de la respuesta en v.
func decodeBody(t *testing.T, rec *httptest.ResponseRecorder, v interface{}) {
	t.Helper()
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), v))
}

package auth_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"casadelrey/backend/auth"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var errAuth = errors.New("db error")

// ─── helpers locales ──────────────────────────────────────────────────────────

func newAuthMockDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock, *sql.DB) {
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

func newAuthCtx(t *testing.T, method string, body interface{}, queryParams map[string]string) (echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	e := echo.New()
	if method == "" {
		method = http.MethodPost
	}
	var req *http.Request
	if body != nil {
		b, err := json.Marshal(body)
		require.NoError(t, err)
		req = httptest.NewRequest(method, "/", bytes.NewBuffer(b))
		req.Header.Set("Content-Type", "application/json")
	} else {
		target := "/"
		if len(queryParams) > 0 {
			target += "?"
			for k, v := range queryParams {
				target += k + "=" + v
			}
		}
		req = httptest.NewRequest(method, target, nil)
	}
	rec := httptest.NewRecorder()
	return e.NewContext(req, rec), rec
}

func decodeAuthBody(t *testing.T, rec *httptest.ResponseRecorder, v interface{}) {
	t.Helper()
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), v))
}

// ─── RegisterDisabled ─────────────────────────────────────────────────────────

func TestRegisterDisabled_SiempreRetorna403(t *testing.T) {
	db, _, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{"email": "x@x.com"}, nil)
	require.NoError(t, h.RegisterDisabled(c))
	assert.Equal(t, http.StatusForbidden, rec.Code)
}

// ─── Register ─────────────────────────────────────────────────────────────────

func TestRegister_CamposVacios_Retorna400(t *testing.T) {
	casos := []map[string]interface{}{
		{},
		{"name": "Ana"},
		{"name": "Ana", "email": "ana@test.com"},
		{"email": "ana@test.com", "password": "segura123"},
	}
	for _, body := range casos {
		db, _, sqlDB := newAuthMockDB(t)
		h := auth.NewHandler(db)

		c, rec := newAuthCtx(t, "POST", body, nil)
		require.NoError(t, h.Register(c))
		assert.Equal(t, http.StatusBadRequest, rec.Code, "body %v debe retornar 400", body)
		sqlDB.Close()
	}
}

func TestRegister_PasswordCorta_Retorna400(t *testing.T) {
	db, _, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"name": "Ana", "email": "ana@test.com", "password": "abc",
	}, nil)
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestRegister_EmailDuplicado_Retorna409(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	// Email ya existe
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "email"}).AddRow(1, "ana@test.com"))

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"name": "Ana", "email": "ana@test.com", "password": "segura123",
	}, nil)
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusConflict, rec.Code)
}

func TestRegister_Exito_Retorna201(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	// Email no existe
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))
	// Crear usuario
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(10))
	mock.ExpectCommit()

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"name": "Nuevo", "email": "nuevo@test.com", "password": "segura123",
	}, nil)
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusCreated, rec.Code)

	var resp map[string]interface{}
	decodeAuthBody(t, rec, &resp)
	assert.Contains(t, resp, "user")
}

// ─── Login ────────────────────────────────────────────────────────────────────

func TestLogin_EmailNoEncontrado_Retorna401(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"email": "noexiste@test.com", "password": "cualquier",
	}, nil)
	require.NoError(t, h.Login(c))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestLogin_PasswordIncorrecta_Retorna401(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	hash, _ := auth.HashPassword("contraseña_correcta")
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "email", "password", "email_verified"}).
			AddRow(1, "user@test.com", hash, true))

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"email": "user@test.com", "password": "contraseña_incorrecta",
	}, nil)
	require.NoError(t, h.Login(c))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestLogin_EmailNoVerificado_Retorna403(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	hash, _ := auth.HashPassword("password123")
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "email", "password", "email_verified"}).
			AddRow(1, "user@test.com", hash, false))

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"email": "user@test.com", "password": "password123",
	}, nil)
	require.NoError(t, h.Login(c))
	assert.Equal(t, http.StatusForbidden, rec.Code)
}

func TestLogin_Exito_Retorna200ConToken(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	hash, _ := auth.HashPassword("password123")
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password", "role", "email_verified"}).
			AddRow(1, "Admin", "admin@test.com", hash, "admin", true))

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"email": "admin@test.com", "password": "password123",
	}, nil)
	require.NoError(t, h.Login(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeAuthBody(t, rec, &resp)
	assert.NotEmpty(t, resp["token"])
	assert.Contains(t, resp, "user")
}

func TestRegister_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "users"`).WillReturnError(errAuth)
	mock.ExpectRollback()

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"name": "Test", "email": "test@t.com", "password": "password123",
	}, nil)
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── ForgotPassword ───────────────────────────────────────────────────────────

func TestForgotPassword_EmailExiste_GuardaTokenRetorna200(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "email", "password", "role"}).
			AddRow(1, "existe@test.com", "hash", "member"))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "users"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"email": "existe@test.com",
	}, nil)
	require.NoError(t, h.ForgotPassword(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]string
	decodeAuthBody(t, rec, &resp)
	assert.Contains(t, resp["message"], "Si el email")
}

func TestForgotPassword_SiempreRetorna200(t *testing.T) {
	// Respuesta genérica tanto si el email existe como si no.
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	// Email no existe
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"email": "noexiste@test.com",
	}, nil)
	require.NoError(t, h.ForgotPassword(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]string
	decodeAuthBody(t, rec, &resp)
	assert.Contains(t, resp["message"], "Si el email")
}

// ─── ResetPassword ────────────────────────────────────────────────────────────

func TestResetPassword_TokenVacio_Retorna400(t *testing.T) {
	db, _, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"token": "", "newPassword": "nueva123",
	}, nil)
	require.NoError(t, h.ResetPassword(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestResetPassword_PasswordCorta_Retorna400(t *testing.T) {
	db, _, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"token": "un-token", "newPassword": "abc",
	}, nil)
	require.NoError(t, h.ResetPassword(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestResetPassword_TokenInvalido_Retorna400(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"token": "token-falso-uuid", "newPassword": "nueva123",
	}, nil)
	require.NoError(t, h.ResetPassword(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestResetPassword_TokenExpirado_Retorna400(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	expiry := time.Now().Add(-1 * time.Hour) // expirado
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "reset_token", "reset_token_expiry"}).
			AddRow(1, "token-uuid", expiry))

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"token": "token-uuid", "newPassword": "nueva123",
	}, nil)
	require.NoError(t, h.ResetPassword(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestResetPassword_Exito_Retorna200(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	expiry := time.Now().Add(1 * time.Hour)
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "password", "reset_token", "reset_token_expiry",
		}).AddRow(1, "old-hash", "valid-uuid-token", expiry))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "users"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newAuthCtx(t, "POST", map[string]interface{}{
		"token": "valid-uuid-token", "newPassword": "nueva_segura123",
	}, nil)
	require.NoError(t, h.ResetPassword(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]string
	decodeAuthBody(t, rec, &resp)
	assert.Contains(t, resp["message"], "actualizada")
}

// ─── VerifyEmail ──────────────────────────────────────────────────────────────

func TestVerifyEmail_SinToken_Retorna400(t *testing.T) {
	db, _, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	c, rec := newAuthCtx(t, "GET", nil, nil)
	require.NoError(t, h.VerifyEmail(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestVerifyEmail_TokenInvalido_Retorna400(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newAuthCtx(t, "GET", nil, nil)
	c.Request().URL.RawQuery = "token=token-falso"
	require.NoError(t, h.VerifyEmail(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestVerifyEmail_TokenExpirado_Retorna400(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	expiry := time.Now().Add(-1 * time.Hour)
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "verification_token", "verification_token_expiry"}).
			AddRow(1, "token-viejo", expiry))

	c, rec := newAuthCtx(t, "GET", nil, nil)
	c.Request().URL.RawQuery = "token=token-viejo"
	require.NoError(t, h.VerifyEmail(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestVerifyEmail_Exito_Retorna200(t *testing.T) {
	db, mock, sqlDB := newAuthMockDB(t)
	defer sqlDB.Close()
	h := auth.NewHandler(db)

	expiry := time.Now().Add(1 * time.Hour)
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "email", "password", "role",
			"email_verified", "verification_token", "verification_token_expiry",
		}).AddRow(1, "Test", "t@t.com", "hash", "member", false, "token-valido", expiry))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "users"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newAuthCtx(t, "GET", nil, nil)
	c.Request().URL.RawQuery = "token=token-valido"
	require.NoError(t, h.VerifyEmail(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

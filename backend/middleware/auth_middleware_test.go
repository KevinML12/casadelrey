package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"casadelrey/backend/middleware"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testSecret = "super-secret-key-tests"

// makeToken crea un JWT firmado para usar en tests.
func makeToken(t *testing.T, secret, role string, userID uint, exp time.Duration) string {
	t.Helper()
	claims := jwt.MapClaims{
		"user_id": float64(userID),
		"role":    role,
		"name":    "Test User",
		"exp":     time.Now().Add(exp).Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(secret))
	require.NoError(t, err)
	return signed
}

// noopHandler es el handler de destino que siempre devuelve 200.
var noopHandler = func(c echo.Context) error { return c.NoContent(http.StatusOK) }

// ─── NewAuthMiddleware ────────────────────────────────────────────────────────

func TestAuthMiddleware_SinHeader_Retorna401(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	err := middleware.NewAuthMiddleware(testSecret)(noopHandler)(e.NewContext(req, rec))

	require.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestAuthMiddleware_HeaderSinBearer_Retorna401(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Token abc123") // formato incorrecto
	rec := httptest.NewRecorder()

	_ = middleware.NewAuthMiddleware(testSecret)(noopHandler)(e.NewContext(req, rec))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestAuthMiddleware_TokenInvalido_Retorna401(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer esto.no.es.un.jwt.valido")
	rec := httptest.NewRecorder()

	_ = middleware.NewAuthMiddleware(testSecret)(noopHandler)(e.NewContext(req, rec))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestAuthMiddleware_TokenFirmadoConOtroSecret_Retorna401(t *testing.T) {
	tok := makeToken(t, "otro-secret-diferente", "admin", 1, time.Hour)
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rec := httptest.NewRecorder()

	_ = middleware.NewAuthMiddleware(testSecret)(noopHandler)(e.NewContext(req, rec))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestAuthMiddleware_TokenExpirado_Retorna401(t *testing.T) {
	tok := makeToken(t, testSecret, "admin", 1, -time.Hour) // expirado hace 1 hora
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rec := httptest.NewRecorder()

	_ = middleware.NewAuthMiddleware(testSecret)(noopHandler)(e.NewContext(req, rec))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestAuthMiddleware_TokenValido_InyectaClaimsEnContexto(t *testing.T) {
	tok := makeToken(t, testSecret, "leader", 99, time.Hour)
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	var gotID uint
	var gotRole string
	handler := middleware.NewAuthMiddleware(testSecret)(func(c echo.Context) error {
		gotID, _ = c.Get("user_id").(uint)
		gotRole, _ = c.Get("user_role").(string)
		return c.NoContent(http.StatusOK)
	})

	require.NoError(t, handler(c))
	assert.Equal(t, uint(99), gotID)
	assert.Equal(t, "leader", gotRole)
}

// ─── AdminMiddleware ──────────────────────────────────────────────────────────

func TestAdminMiddleware_RolNoAdmin_Retorna403(t *testing.T) {
	rolesNoAdmin := []string{"member", "leader", "volunteer", ""}
	for _, role := range rolesNoAdmin {
		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user_role", role)

		_ = middleware.AdminMiddleware()(noopHandler)(c)
		assert.Equal(t, http.StatusForbidden, rec.Code, "rol '%s' debe ser rechazado", role)
	}
}

func TestAdminMiddleware_RolAdmin_Pasa(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_role", "admin")

	err := middleware.AdminMiddleware()(noopHandler)(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
}

// ─── AdminOrLeaderMiddleware ──────────────────────────────────────────────────

func TestAdminOrLeaderMiddleware_RolesPermitidos(t *testing.T) {
	for _, role := range []string{"admin", "leader"} {
		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user_role", role)

		err := middleware.AdminOrLeaderMiddleware()(noopHandler)(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code, "rol '%s' debe pasar", role)
	}
}

func TestAdminOrLeaderMiddleware_RolesRechazados(t *testing.T) {
	for _, role := range []string{"member", "volunteer", ""} {
		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user_role", role)

		_ = middleware.AdminOrLeaderMiddleware()(noopHandler)(c)
		assert.Equal(t, http.StatusForbidden, rec.Code, "rol '%s' debe ser rechazado", role)
	}
}

// ─── VolunteerMiddleware ──────────────────────────────────────────────────────

func TestVolunteerMiddleware_RolesPermitidos(t *testing.T) {
	for _, role := range []string{"admin", "leader", "volunteer"} {
		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set("user_role", role)

		err := middleware.VolunteerMiddleware()(noopHandler)(c)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code, "rol '%s' debe pasar", role)
	}
}

func TestVolunteerMiddleware_MemberRechazado(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_role", "member")

	_ = middleware.VolunteerMiddleware()(noopHandler)(c)
	assert.Equal(t, http.StatusForbidden, rec.Code)
}

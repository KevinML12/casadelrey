package security_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"casadelrey/backend/config"
	"casadelrey/backend/middleware"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

func init() {
	config.AppConfig = &config.Config{
		JWTSecret: "super_secret_for_tests",
	}
}

// generateTestJWTHelper genera un JWT válido pero le inyecta el rol que queremos
func generateTestJWTHelper(role string) string {
	claims := jwt.MapClaims{
		"user_id": float64(10),
		"role":    role,
		"exp":     float64(time.Now().Add(1 * time.Hour).Unix()),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(config.AppConfig.JWTSecret))
	return signed
}

func TestRBAC_BypassAdmin(t *testing.T) {
	e := echo.New()
	
	// Ruta protegida solo para Admin
	protected := e.Group("/admin", middleware.NewAuthMiddleware(config.AppConfig.JWTSecret), middleware.AdminMiddleware())
	protected.GET("/secret", func(c echo.Context) error {
		return c.String(http.StatusOK, "secret data")
	})

	// Un usuario "member" intentando entrar a ruta "admin"
	memberToken := generateTestJWTHelper("member")
	req := httptest.NewRequest(http.MethodGet, "/admin/secret", nil)
	req.Header.Set("Authorization", "Bearer "+memberToken)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	// Debería ser rechazado con 403 Forbidden
	assert.Equal(t, http.StatusForbidden, rec.Code)

	// Un "volunteer" intentando entrar
	volToken := generateTestJWTHelper("volunteer")
	req2 := httptest.NewRequest(http.MethodGet, "/admin/secret", nil)
	req2.Header.Set("Authorization", "Bearer "+volToken)
	rec2 := httptest.NewRecorder()
	e.ServeHTTP(rec2, req2)

	assert.Equal(t, http.StatusForbidden, rec2.Code)

	// Un "admin" intentando entrar
	adminToken := generateTestJWTHelper("admin")
	req3 := httptest.NewRequest(http.MethodGet, "/admin/secret", nil)
	req3.Header.Set("Authorization", "Bearer "+adminToken)
	rec3 := httptest.NewRecorder()
	e.ServeHTTP(rec3, req3)

	assert.Equal(t, http.StatusOK, rec3.Code)
}

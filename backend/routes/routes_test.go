package routes_test

// Tests de REGISTRO de rutas — guardan regresiones de routing que los
// tests de handlers no ven: colisiones de path (Echo deja ganar al
// último silenciosamente), rutas que deberían estar protegidas, y rutas
// muertas que se creía haber quitado.

import (
	"database/sql"
	"strings"
	"testing"

	"casadelrey/backend/config"
	"casadelrey/backend/routes"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func testEcho(t *testing.T) (*echo.Echo, *sql.DB) {
	t.Helper()
	sqlDB, _, err := sqlmock.New()
	require.NoError(t, err)
	gormDB, err := gorm.Open(
		postgres.New(postgres.Config{Conn: sqlDB}),
		&gorm.Config{Logger: logger.Default.LogMode(logger.Silent)},
	)
	require.NoError(t, err)

	e := echo.New()
	cfg := &config.Config{JWTSecret: "test-secret", Port: "8080"}
	// store nil: Register solo guarda la referencia en el handler, no la usa
	// al registrar rutas.
	routes.Register(e, gormDB, cfg, nil)
	return e, sqlDB
}

// routeName devuelve el nombre del handler (función) para method+path, o "".
func routeName(e *echo.Echo, method, path string) string {
	for _, r := range e.Routes() {
		if r.Method == method && r.Path == path {
			return r.Name
		}
	}
	return ""
}

func hasRoute(e *echo.Echo, method, path string) bool {
	return routeName(e, method, path) != ""
}

// GET /admin/leaders debe seguir sirviendo los USUARIOS con rol líder
// (AdminHandler.GetLeaders), no el directorio. Antes colisionaba con el
// CRUD del directorio y Echo dejaba ganar al último → rompía los selects
// de asignación de voluntarios/connect-cards.
func TestRoutes_AdminLeaders_ApuntaAAdminHandler(t *testing.T) {
	e, db := testEcho(t)
	defer db.Close()

	name := routeName(e, "GET", "/api/v1/admin/leaders")
	require.NotEmpty(t, name, "GET /api/v1/admin/leaders debe existir")
	assert.Contains(t, name, "AdminHandler", "debe apuntar a AdminHandler.GetLeaders, no al directorio")
	assert.Contains(t, name, "GetLeaders")
}

// El CRUD del directorio vive en su propia ruta, sin colisión.
func TestRoutes_LeaderDirectory_RutaPropia(t *testing.T) {
	e, db := testEcho(t)
	defer db.Close()

	assert.True(t, hasRoute(e, "GET", "/api/v1/admin/leader-directory"), "GET directorio")
	assert.True(t, hasRoute(e, "POST", "/api/v1/admin/leader-directory"), "POST directorio")
	assert.True(t, hasRoute(e, "PUT", "/api/v1/admin/leader-directory/:id"), "PUT directorio")
	assert.True(t, hasRoute(e, "DELETE", "/api/v1/admin/leader-directory/:id"), "DELETE directorio")

	dirName := routeName(e, "GET", "/api/v1/admin/leader-directory")
	assert.Contains(t, dirName, "LeaderDirectoryHandler")
}

// El directorio público (para Células/voluntarios) sigue expuesto.
func TestRoutes_DirectorioPublico_Existe(t *testing.T) {
	e, db := testEcho(t)
	defer db.Close()
	assert.True(t, hasRoute(e, "GET", "/api/v1/leaders"))
}

// PayPal fue removido: sus rutas ya no deben registrarse (no ocupar router
// ni rate-limit).
func TestRoutes_PayPal_NoRegistrado(t *testing.T) {
	e, db := testEcho(t)
	defer db.Close()

	for _, r := range e.Routes() {
		assert.NotContains(t, strings.ToLower(r.Path), "paypal", "ruta PayPal no debe existir: %s", r.Path)
	}
}

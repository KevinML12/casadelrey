package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// AdminDashboardPlaceholder es un handler temporal para el dashboard de administración.
// Implementar con métricas reales cuando el MVP esté estabilizado.
func AdminDashboardPlaceholder(c echo.Context) error {
	return c.JSON(http.StatusServiceUnavailable, map[string]interface{}{
		"error":   true,
		"message": "Dashboard de Admin — próximamente disponible.",
	})
}

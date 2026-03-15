package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// GetEventsPlaceholder es un handler temporal para el listado de eventos.
// Implementar con GORM y un modelo Event cuando sea requerido.
func GetEventsPlaceholder(c echo.Context) error {
	return c.JSON(http.StatusServiceUnavailable, map[string]interface{}{
		"error":   true,
		"message": "Módulo de Eventos — próximamente disponible.",
	})
}

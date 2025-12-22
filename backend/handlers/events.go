package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// GetEventsPlaceholder simula la futura lógica de obtener eventos.
func GetEventsPlaceholder(c *fiber.Ctx) error {
	return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
		"error":   true,
		"message": "Funcionalidad de Obtener Eventos no implementada en el MVP.",
	})
}

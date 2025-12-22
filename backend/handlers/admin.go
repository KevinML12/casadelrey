package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// AdminDashboardPlaceholder simula la futura lógica del dashboard de admin.
func AdminDashboardPlaceholder(c *fiber.Ctx) error {
	return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
		"error":   true,
		"message": "Funcionalidad de Dashboard de Admin no implementada en el MVP.",
	})
}

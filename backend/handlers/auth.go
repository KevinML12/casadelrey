package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// AdminLoginPlaceholder simula la futura lógica de login.
func AdminLoginPlaceholder(c *fiber.Ctx) error {
	return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
		"error":   true,
		"message": "Funcionalidad de Admin Login no implementada en el MVP.",
	})
}

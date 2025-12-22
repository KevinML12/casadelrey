package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// GetBlogPostsPlaceholder simula la futura lógica de obtener posts del blog.
func GetBlogPostsPlaceholder(c *fiber.Ctx) error {
	return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
		"error":   true,
		"message": "Funcionalidad de Obtener Posts del Blog no implementada en el MVP.",
	})
}

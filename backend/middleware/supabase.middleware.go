package middleware

import (
	"errors"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"gorm.io/gorm"
)

// Profile representa la tabla profiles en la DB
type Profile struct {
	ID    string `gorm:"primaryKey"`
	Email string
	Role  string
}

// NewSupabaseAuthMiddleware crea un middleware de autenticación que depende de la DB y el secreto JWT.
func NewSupabaseAuthMiddleware(db *gorm.DB, jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Obtener Token del header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Falta el header de Authorization"})
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 2. Validar el JWT manualmente usando el JWT_SECRET
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			log.Printf("JWT inválido: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Sesión inválida o expirada"})
		}

		// 3. Extraer el UUID del usuario del token (campo "sub")
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Claims inválidos"})
		}

		userID, ok := claims["sub"].(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Claim 'sub' (user ID) no encontrado o inválido"})
		}
		
		userEmail, ok := claims["email"].(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Claim 'email' no encontrado o inválido"})
		}

		// 4. Verificar Rol en la DB local (Supabase Postgres)
		var profile Profile
		result := db.Where("id = ?", userID).First(&profile)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Usuario sin perfil"})
			}
			return c.SendStatus(fiber.StatusInternalServerError)
		}

		// 5. Guardar en Locals para los handlers
		c.Locals("user_id", userID)
		c.Locals("user_email", userEmail)
		c.Locals("user_role", profile.Role)

		return c.Next()
	}
}

func AdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("user_role").(string)
		if !ok || role != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Acceso denegado"})
		}
		return c.Next()
	}
}

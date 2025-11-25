package middleware

import (
	"net/http"
	"strings"

	"casa-del-rey/backend/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// JWTClaims define los claims personalizados del JWT
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// getJWTSecret obtiene la clave secreta para JWT desde la configuración
func getJWTSecret() []byte {
	return []byte(config.AppConfig.JWTSecret)
}

// AuthMiddleware protege rutas validando el token JWT
func AuthMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Extraer el token del header Authorization
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Token de autorización requerido",
				})
			}

			// Verificar formato: "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Formato de token inválido. Use: Bearer <token>",
				})
			}

			tokenString := parts[1]

			// Parsear y validar el token
			token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
				// Verificar el método de firma
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, echo.NewHTTPError(http.StatusUnauthorized, "Método de firma inválido")
				}
				return getJWTSecret(), nil
			})

			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Token inválido o expirado",
				})
			}

			// Extraer los claims del token
			if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
				// Guardar user_id y role en el contexto de Echo
				c.Set("user_id", claims.UserID)
				c.Set("role", claims.Role)

				// Continuar con el siguiente handler
				return next(c)
			}

			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Token inválido",
			})
		}
	}
}

// AdminMiddleware verifica que el usuario autenticado tenga rol de administrador
// DEBE usarse DESPUÉS de AuthMiddleware
func AdminMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Verificar que existe el role (establecido por AuthMiddleware)
			role := c.Get("role")
			if role == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Autenticación requerida. Use AuthMiddleware antes de AdminMiddleware",
				})
			}

			// Verificar que el rol sea 'admin'
			if role != "admin" {
				return c.JSON(http.StatusForbidden, map[string]string{
					"error": "Acceso denegado. Se requiere rol de administrador",
				})
			}

			// Si es admin, continuar con el handler
			return next(c)
		}
	}
}

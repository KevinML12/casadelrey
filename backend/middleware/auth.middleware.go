// Package middleware provee middlewares de autenticación y autorización
// para las rutas protegidas del backend de Casa del Rey.
package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// NewAuthMiddleware retorna un middleware de Echo que:
//  1. Extrae el token JWT del header "Authorization: Bearer <token>"
//  2. Valida la firma con jwtSecret
//  3. Inyecta user_id (uint) y user_role (string) en el contexto de Echo
//     usando c.Set(), para que los handlers downstream puedan leerlos con c.Get()
//
// Los tokens son generados por auth.service.go con los claims user_id y role.
func NewAuthMiddleware(jwtSecret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// 1. Leer el header de autorización
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Falta el header Authorization. Formato: Bearer <token>",
				})
			}
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")

			// 2. Parsear y validar la firma del JWT
			token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
				// Verificar que el algoritmo sea HMAC (HS256), no RS256 u otro.
				// Esto previene el ataque "algorithm confusion".
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, echo.NewHTTPError(http.StatusUnauthorized, "método de firma inesperado")
				}
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Sesión inválida o expirada. Por favor, vuelve a iniciar sesión.",
				})
			}

			// 3. Extraer los claims del payload
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Claims del token inválidos.",
				})
			}

			// user_id se almacena como número en el JWT (float64 en Go al deserializar JSON)
			uidFloat, ok := claims["user_id"].(float64)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Claim 'user_id' no encontrado o tiene tipo inválido.",
				})
			}

			role, _ := claims["role"].(string)
			name, _ := claims["name"].(string)

			c.Set("user_id", uint(uidFloat))
			c.Set("user_role", role)
			c.Set("user_name", name)

			return next(c)
		}
	}
}

// AdminMiddleware debe aplicarse DESPUÉS de NewAuthMiddleware.
// Solo permite rol "admin".
func AdminMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			role, _ := c.Get("user_role").(string)
			if role != "admin" {
				return c.JSON(http.StatusForbidden, map[string]string{
					"error": "Acceso denegado. Se requiere rol de administrador.",
				})
			}
			return next(c)
		}
	}
}

// AdminOrLeaderMiddleware permite admin o leader (células, reportes).
func AdminOrLeaderMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			role, _ := c.Get("user_role").(string)
			if role != "admin" && role != "leader" {
				return c.JSON(http.StatusForbidden, map[string]string{
					"error": "Acceso denegado. Se requiere rol de administrador o líder.",
				})
			}
			return next(c)
		}
	}
}

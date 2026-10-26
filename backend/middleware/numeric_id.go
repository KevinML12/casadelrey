package middleware

import (
	"github.com/labstack/echo/v4"
	"net/http"
	"strconv"
)

// ValidateNumericID rejects malformed object IDs before any query is executed.
func ValidateNumericID(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		raw := c.Param("id")
		if raw != "" {
			id, err := strconv.ParseUint(raw, 10, 32)
			if err != nil || id == 0 {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
			}
		}
		return next(c)
	}
}

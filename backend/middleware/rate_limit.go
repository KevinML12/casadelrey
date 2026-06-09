package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"
)

// GlobalRateLimit protege toda la API de picos extremos de tráfico.
// Permite 50 peticiones por segundo por IP, con ráfagas de hasta 100.
func GlobalRateLimit() echo.MiddlewareFunc {
	config := middleware.RateLimiterConfig{
		Skipper: middleware.DefaultSkipper,
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(
			middleware.RateLimiterMemoryStoreConfig{
				Rate:      rate.Limit(50),
				Burst:     100,
				ExpiresIn: 3 * 60 * 1000000000, // 3 mins (en nanosegundos o usar time.Minute)
			},
		),
		IdentifierExtractor: func(ctx echo.Context) (string, error) {
			return ctx.RealIP(), nil
		},
		ErrorHandler: func(context echo.Context, err error) error {
			return context.JSON(http.StatusTooManyRequests, map[string]string{
				"error": "Demasiadas peticiones. Por favor, intenta más tarde.",
			})
		},
		DenyHandler: func(context echo.Context, identifier string, err error) error {
			return context.JSON(http.StatusTooManyRequests, map[string]string{
				"error": "Límite de velocidad global excedido.",
			})
		},
	}
	return middleware.RateLimiterWithConfig(config)
}

// AuthRateLimit protege endpoints sensibles (Login, Register).
// Solo permite 5 peticiones por segundo, con ráfaga de 10.
func AuthRateLimit() echo.MiddlewareFunc {
	config := middleware.RateLimiterConfig{
		Skipper: middleware.DefaultSkipper,
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(
			middleware.RateLimiterMemoryStoreConfig{
				Rate:      rate.Limit(5),
				Burst:     10,
				ExpiresIn: 3 * 60 * 1000000000,
			},
		),
		IdentifierExtractor: func(ctx echo.Context) (string, error) {
			return ctx.RealIP(), nil
		},
		ErrorHandler: func(context echo.Context, err error) error {
			return context.JSON(http.StatusTooManyRequests, map[string]string{
				"error": "Demasiados intentos. Por favor, intenta más tarde.",
			})
		},
		DenyHandler: func(context echo.Context, identifier string, err error) error {
			return context.JSON(http.StatusTooManyRequests, map[string]string{
				"error": "Demasiados intentos en autenticación. Espera un momento.",
			})
		},
	}
	return middleware.RateLimiterWithConfig(config)
}

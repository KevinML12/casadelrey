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
// 1 req/s con ráfaga de 5 por IP: un humano nunca lo nota, un ataque
// de fuerza bruta queda a ~60 intentos/minuto (repo público → asumir
// que conocen los emails del seed).
func AuthRateLimit() echo.MiddlewareFunc {
	config := middleware.RateLimiterConfig{
		Skipper: middleware.DefaultSkipper,
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(
			middleware.RateLimiterMemoryStoreConfig{
				Rate:      rate.Limit(1),
				Burst:     5,
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

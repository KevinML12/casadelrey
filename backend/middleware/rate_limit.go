package middleware

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"
)

// GlobalRateLimit protege toda la API de picos extremos de tráfico.
// Permite 50 peticiones por segundo por IP, con ráfagas de hasta 100.
func GlobalRateLimit() echo.MiddlewareFunc {
	config := middleware.RateLimiterConfig{
		Skipper: func(c echo.Context) bool { return c.Path() == "/health" || c.Path() == "/ready" },
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

// SubmissionRateLimit is shared per operation, with a small human-sized burst.
// It limits writes without restricting anonymous public browsing.
func SubmissionRateLimit() echo.MiddlewareFunc {
	return middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Store:               middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{Rate: rate.Limit(1.0 / 10), Burst: 5, ExpiresIn: time.Hour}),
		IdentifierExtractor: func(c echo.Context) (string, error) { return c.RealIP(), nil },
		DenyHandler: func(c echo.Context, _ string, _ error) error {
			c.Response().Header().Set("Retry-After", "10")
			return c.JSON(429, map[string]string{"error": "Espera unos segundos antes de realizar otro envío."})
		},
	})
}

// ConfigureClientIP reads XFF from right to left only behind internal proxies.
// Direct public peers cannot select their identity by supplying an HTTP header.
func ConfigureClientIP(e *echo.Echo) {
	e.IPExtractor = echo.ExtractIPFromXFFHeader(echo.TrustLinkLocal(false))
}

// TTSRateLimit protege el endpoint público de síntesis de voz (/tts).
// Es público (lo usa el lector del blog) pero cada request puede enviar
// hasta 12K caracteres a ElevenLabs/Google (de pago) — sin un límite
// propio, un abusador podría agotar la cuota/dinero. ~1 cada 3s con
// ráfaga de 3 por IP: cómodo para leer un artículo, caro de abusar.
func TTSRateLimit() echo.MiddlewareFunc {
	config := middleware.RateLimiterConfig{
		Skipper: middleware.DefaultSkipper,
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(
			middleware.RateLimiterMemoryStoreConfig{
				Rate:      rate.Limit(0.34), // ~1 cada 3 segundos
				Burst:     3,
				ExpiresIn: 3 * 60 * 1000000000,
			},
		),
		IdentifierExtractor: func(ctx echo.Context) (string, error) {
			return ctx.RealIP(), nil
		},
		ErrorHandler: func(context echo.Context, err error) error {
			return context.JSON(http.StatusTooManyRequests, map[string]string{
				"error": "Demasiadas solicitudes de audio. Espera un momento.",
			})
		},
		DenyHandler: func(context echo.Context, identifier string, err error) error {
			return context.JSON(http.StatusTooManyRequests, map[string]string{
				"error": "Límite de lectura de audio excedido. Espera un momento.",
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

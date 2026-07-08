package middleware

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

// PublicCache setea Cache-Control en respuestas GET públicas (hero, eventos,
// células, galería, feed social, anuncios, blog). No cambian por request de
// usuario y no llevan datos sensibles — el navegador y cualquier CDN pueden
// servirlas repetidas veces sin volver a pegarle a Postgres.
//
// stale-while-revalidate: sirve la caché vieja al instante mientras refresca
// en segundo plano, así el admin ve su cambio reflejado sin que el visitante
// note un salto a "sin caché".
func PublicCache(maxAgeSeconds int) echo.MiddlewareFunc {
	value := fmt.Sprintf("public, max-age=%d, stale-while-revalidate=%d", maxAgeSeconds, maxAgeSeconds*4)
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if c.Request().Method == http.MethodGet {
				c.Response().Header().Set("Cache-Control", value)
			}
			return next(c)
		}
	}
}

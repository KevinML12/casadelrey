package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// PayPal fue removido en mayo 2026. Endpoints desactivados.
// Se mantiene el archivo para no romper imports históricos.

func (h *DonationHandler) CreatePayPalOrder(c echo.Context) error {
	return c.JSON(http.StatusGone, map[string]string{
		"error": "PayPal fue removido. Usa transferencia bancaria o Tigo Money.",
	})
}

func (h *DonationHandler) CapturePayPalOrder(c echo.Context) error {
	return c.JSON(http.StatusGone, map[string]string{
		"error": "PayPal fue removido.",
	})
}

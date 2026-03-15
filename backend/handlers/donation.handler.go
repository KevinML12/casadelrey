package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// DonationHandler maneja el registro y gestión de donaciones.
type DonationHandler struct {
	DB *gorm.DB
}

// NewDonationHandler crea una nueva instancia del handler de donaciones.
func NewDonationHandler(db *gorm.DB) *DonationHandler {
	return &DonationHandler{DB: db}
}

// SimulateDonation godoc
// POST /api/v1/donations/simulate
// Registra una donación simulada en la base de datos (MVP sin pasarela real).
// En producción, reemplazar por el webhook de Stripe/PayPal.
func (h *DonationHandler) SimulateDonation(c echo.Context) error {
	donation := new(models.Donation)

	if err := c.Bind(donation); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Revisa los campos enviados para la donación.",
			"details": err.Error(),
		})
	}

	// Validar campos mínimos requeridos
	if donation.Amount <= 0 || donation.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "El nombre y el monto de la donación son obligatorios.",
		})
	}

	// Generar un ID de transacción simulado (formato: SIM-CDR-<timestamp>)
	donation.TransactionID = fmt.Sprintf("SIM-CDR-%d", time.Now().UnixNano())
	donation.IsSuccessful = true

	if donation.PaymentMethod == "" {
		donation.PaymentMethod = "Simulado"
	}
	if donation.Currency == "" {
		donation.Currency = "USD"
	}

	if result := h.DB.Create(donation); result.Error != nil {
		log.Printf("[Donation] Error al registrar donación: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "No se pudo registrar la donación. Inténtalo de nuevo.",
		})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"error":   false,
		"message": "¡Donación registrada con éxito! Gracias por tu generosidad.",
		"data":    donation,
	})
}

package handlers

import (
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// DonationHandler maneja el registro local de donaciones.
type DonationHandler struct {
	DB *gorm.DB
}

func NewDonationHandler(db *gorm.DB) *DonationHandler {
	return &DonationHandler{DB: db}
}

// RegisterDonation POST /api/v1/donations/register
// Registra la intención de donación con método de pago local.
func (h *DonationHandler) RegisterDonation(c echo.Context) error {
	var req struct {
		Name             string  `json:"name"`
		Email            string  `json:"email"`
		Amount           float64 `json:"amount"`
		Currency         string  `json:"currency"`
		PaymentMethod    string  `json:"payment_method"`
		PaymentReference string  `json:"payment_reference"`
		ReceiptURL       string  `json:"receipt_url"`
		DonationPurpose  string  `json:"donation_purpose"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos."})
	}

	if req.Amount < 10 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El monto mínimo es Q10."})
	}
	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El nombre es obligatorio."})
	}

	// Tigo Money removido (13 jul 2026, decisión del usuario) — solo
	// transferencia/depósito bancario o en persona. Los registros viejos
	// con tigo_money quedan en la DB; solo se rechaza para NUEVAS.
	validMethods := map[string]bool{
		"transferencia": true,
		"presencial":    true,
	}
	if req.PaymentMethod == "" || !validMethods[req.PaymentMethod] {
		req.PaymentMethod = "presencial"
	}

	currency := "GTQ"
	if req.Currency != "" {
		currency = req.Currency
	}

	donation := models.Donation{
		Name:             req.Name,
		Email:            req.Email,
		Amount:           req.Amount,
		Currency:         currency,
		PaymentMethod:    req.PaymentMethod,
		PaymentReference: req.PaymentReference,
		ReceiptURL:       req.ReceiptURL,
		IsSuccessful:     true,
		DonationPurpose:  req.DonationPurpose,
	}

	if err := h.DB.Create(&donation).Error; err != nil {
		log.Printf("[Donation] Error al registrar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo registrar la donación."})
	}

	log.Printf("[Donation] Registrada: %s — GTQ %.2f vía %s", donation.Name, donation.Amount, donation.PaymentMethod)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "¡Donación registrada! Un coordinador confirmará el proceso.",
		"id":      donation.ID,
	})
}

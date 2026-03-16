package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	stripe "github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/paymentintent"
	stripewebhook "github.com/stripe/stripe-go/v82/webhook"
	"gorm.io/gorm"
)

// DonationHandler maneja el registro y gestión de donaciones.
type DonationHandler struct {
	DB *gorm.DB
}

// NewDonationHandler crea una nueva instancia e inicializa la clave de Stripe.
func NewDonationHandler(db *gorm.DB) *DonationHandler {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	return &DonationHandler{DB: db}
}

// ─── CreatePaymentIntent ──────────────────────────────────────────────────────
// POST /api/v1/donations/create-payment-intent
// Crea un PaymentIntent en Stripe y devuelve el client_secret al frontend.
func (h *DonationHandler) CreatePaymentIntent(c echo.Context) error {
	type Request struct {
		Amount          float64 `json:"amount"`
		Currency        string  `json:"currency"`
		Name            string  `json:"name"`
		Email           string  `json:"email"`
		DonationPurpose string  `json:"donation_purpose"`
	}

	req := new(Request)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	if req.Amount < 10 || req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "El monto mínimo es Q10 y el nombre es obligatorio.",
		})
	}

	// Stripe trabaja en la unidad más pequeña de la moneda (centavos).
	// GTQ (Quetzal guatemalteco): 1 GTQ = 100 centavos.
	amountCentavos := int64(req.Amount * 100)

	currency := "gtq"
	if req.Currency != "" {
		currency = strings.ToLower(req.Currency)
	}

	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountCentavos),
		Currency: stripe.String(currency),
		// Guardamos los datos del donante en metadata para recuperarlos en el webhook.
		Metadata: map[string]string{
			"name":    req.Name,
			"email":   req.Email,
			"purpose": req.DonationPurpose,
		},
		// Activamos el modo automático para que Stripe elija el método de pago óptimo.
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		log.Printf("[Stripe] Error al crear PaymentIntent: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al iniciar el proceso de pago. Inténtalo de nuevo.",
		})
	}

	log.Printf("[Stripe] PaymentIntent creado: %s → Q%.2f", pi.ID, req.Amount)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"client_secret":     pi.ClientSecret,
		"payment_intent_id": pi.ID,
	})
}

// ─── HandleWebhook ────────────────────────────────────────────────────────────
// POST /api/v1/donations/webhook
// Recibe eventos de Stripe (firma verificada). Registra donaciones confirmadas.
// IMPORTANTE: Este endpoint debe estar SIN middleware de auth.
func (h *DonationHandler) HandleWebhook(c echo.Context) error {
	payload, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "No se pudo leer el cuerpo de la petición.",
		})
	}

	endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	if endpointSecret == "" {
		log.Println("[Stripe] ADVERTENCIA: STRIPE_WEBHOOK_SECRET no configurado, omitiendo verificación de firma.")
	}

	var event stripe.Event

	if endpointSecret != "" {
		sig := c.Request().Header.Get("Stripe-Signature")
		event, err = stripewebhook.ConstructEvent(payload, sig, endpointSecret)
		if err != nil {
			log.Printf("[Stripe] Webhook — firma inválida: %v", err)
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Firma del webhook inválida.",
			})
		}
	} else {
		if err := json.Unmarshal(payload, &event); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Evento inválido.",
			})
		}
	}

	switch event.Type {
	case "payment_intent.succeeded":
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			log.Printf("[Stripe] Error al parsear PaymentIntent: %v", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Error al procesar el evento."})
		}

		// Verificar que no se haya registrado ya esta transacción (idempotencia).
		var existing models.Donation
		if result := h.DB.Where("transaction_id = ?", pi.ID).First(&existing); result.Error == nil {
			log.Printf("[Stripe] Donación %s ya registrada, ignorando duplicado.", pi.ID)
			return c.JSON(http.StatusOK, map[string]string{"received": "true"})
		}

		donation := models.Donation{
			Name:            pi.Metadata["name"],
			Email:           pi.Metadata["email"],
			Amount:          float64(pi.Amount) / 100,
			Currency:        strings.ToUpper(string(pi.Currency)),
			PaymentMethod:   "stripe",
			TransactionID:   pi.ID,
			IsSuccessful:    true,
			DonationPurpose: pi.Metadata["purpose"],
		}

		if result := h.DB.Create(&donation); result.Error != nil {
			log.Printf("[Stripe] Error al guardar donación en BD: %v", result.Error)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al registrar la donación."})
		}

		log.Printf("[Stripe] ✓ Donación registrada: %s — %s %.2f", donation.Name, donation.Currency, donation.Amount)

	case "payment_intent.payment_failed":
		log.Printf("[Stripe] Pago fallido — evento ID: %s", event.ID)
	}

	return c.JSON(http.StatusOK, map[string]string{"received": "true"})
}

// ─── SimulateDonation ─────────────────────────────────────────────────────────
// POST /api/v1/donations/simulate
// Mantiene compatibilidad con el modo de desarrollo/prueba sin Stripe.
func (h *DonationHandler) SimulateDonation(c echo.Context) error {
	donation := new(models.Donation)

	if err := c.Bind(donation); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Revisa los campos enviados para la donación.",
		})
	}

	if donation.Amount <= 0 || donation.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "El nombre y el monto de la donación son obligatorios.",
		})
	}

	if donation.PaymentMethod == "" {
		donation.PaymentMethod = "simulado"
	}
	if donation.Currency == "" {
		donation.Currency = "GTQ"
	}
	donation.IsSuccessful = true

	if result := h.DB.Create(donation); result.Error != nil {
		log.Printf("[Donation] Error al registrar donación simulada: %v", result.Error)
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

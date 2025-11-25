package handlers

import (
	"log"
	"net/http"

	"casa-del-rey/backend/config"

	"github.com/labstack/echo/v4"
	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/paymentintent"
	"gorm.io/gorm"
)

// Donation representa el modelo de donación (debe coincidir con models.Donation)
type Donation struct {
	gorm.Model
	Name          string  `json:"name"`
	Email         string  `json:"email" validate:"required,email"`
	Amount        float64 `json:"amount" validate:"required,gt=0"`
	PaymentMethod string  `json:"payment_method"`
	Message       string  `json:"message"`
	Status        string  `json:"status"`
	TransactionID string  `json:"transaction_id"`
}

// DonationHandler maneja las donaciones
type DonationHandler struct {
	DB *gorm.DB
}

// NewDonationHandler crea un nuevo handler de donaciones
func NewDonationHandler(db *gorm.DB) *DonationHandler {
	return &DonationHandler{DB: db}
}

// CreateStripePaymentIntent crea y confirma un PaymentIntent de Stripe
func (h *DonationHandler) CreateStripePaymentIntent(c echo.Context) error {
	var input struct {
		Amount          float64 `json:"amount" validate:"required,gt=0"`
		PaymentMethodID string  `json:"payment_method_id" validate:"required"`
		Email           string  `json:"email" validate:"required,email"`
		Name            string  `json:"name" validate:"required"`
		Message         string  `json:"message"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos",
		})
	}

	// Validar con el validador registrado
	if err := c.Validate(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
	}

	// Configurar la clave secreta de Stripe desde config
	if config.AppConfig.StripeKey == "" {
		log.Println("Error: STRIPE_SECRET_KEY no está configurada")
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Configuración de pago no disponible",
		})
	}
	stripe.Key = config.AppConfig.StripeKey

	// Convertir amount a centavos (Stripe usa centavos)
	amountInCents := int64(input.Amount * 100)

	// Crear el PaymentIntent
	params := &stripe.PaymentIntentParams{
		Amount:        stripe.Int64(amountInCents),
		Currency:      stripe.String("usd"),
		PaymentMethod: stripe.String(input.PaymentMethodID),
		Confirm:       stripe.Bool(true),
		ReceiptEmail:  stripe.String(input.Email),
		Description:   stripe.String("Donación a Casa del Rey - " + input.Name),
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		log.Printf("Error al crear PaymentIntent de Stripe: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al procesar el pago",
		})
	}

	// Verificar que el pago fue exitoso
	if pi.Status != stripe.PaymentIntentStatusSucceeded {
		log.Printf("PaymentIntent no exitoso: %s", pi.Status)
		return c.JSON(http.StatusPaymentRequired, map[string]string{
			"error":  "El pago no se completó",
			"status": string(pi.Status),
		})
	}

	// Crear registro de donación con estado Completed
	donation := Donation{
		Name:          input.Name,
		Email:         input.Email,
		Amount:        input.Amount,
		PaymentMethod: "Stripe",
		Message:       input.Message,
		Status:        "Completed",
		TransactionID: pi.ID,
	}

	if result := h.DB.Create(&donation); result.Error != nil {
		log.Printf("Error al registrar donación: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "El pago fue procesado pero no se pudo registrar la donación",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":        "Donación procesada exitosamente",
		"transaction_id": pi.ID,
		"amount":         input.Amount,
		"status":         "Completed",
	})
}

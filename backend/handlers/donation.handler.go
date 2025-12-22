package handlers

import (
	"fmt"
	"time"

	"casadelrey/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// DonationHandler maneja las operaciones de donaciones
type DonationHandler struct {
	DB *gorm.DB
}

// NewDonationHandler crea un nuevo handler de donaciones
func NewDonationHandler(db *gorm.DB) *DonationHandler {
	return &DonationHandler{DB: db}
}


// SimulateDonation maneja la recepción y registro de donaciones simuladas.
func (h *DonationHandler) SimulateDonation(c *fiber.Ctx) error {
	donation := new(models.Donation)

	// 1. Parsear el cuerpo de la solicitud JSON
	if err := c.BodyParser(donation); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Revise los campos enviados para la donación.",
			"details": err.Error(),
		})
	}

	// 2. Validación simple (Campos obligatorios)
	if donation.Amount <= 0 || donation.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "El nombre y el monto de la donación son obligatorios.",
		})
	}

	// 3. Simulación de Transacción
	donation.TransactionID = fmt.Sprintf("SIM-CDR-%d", time.Now().UnixNano())
	if donation.PaymentMethod == "" {
		donation.PaymentMethod = "Simulated Payment" // Asegura que no sea nulo
	}
	donation.IsSuccessful = true // Forzamos a true para MVP

	// 4. Guardar en la base de datos
	result := h.DB.Create(donation)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "No se pudo registrar la donación.",
			"details": result.Error.Error(),
		})
	}

	// 5. Respuesta de éxito
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"error":   false,
		"message": "Donación registrada con éxito!",
		"data":    donation,
	})
}

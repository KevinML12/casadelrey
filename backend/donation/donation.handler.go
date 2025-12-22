package donation

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// Handler maneja las donaciones
type Handler struct {
	DB *gorm.DB
}

// NewHandler crea un nuevo handler de donaciones
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

// SimulateDonation maneja la recepción y registro de donaciones simuladas.
func (h *Handler) SimulateDonation(c *fiber.Ctx) error {
	donation := new(Donation)

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
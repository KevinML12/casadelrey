package handlers

import (
	"log"
	"strconv"

	"casadelrey/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// PetitionHandler maneja las peticiones de oración
type PetitionHandler struct {
	DB *gorm.DB
}

// NewPetitionHandler crea un nuevo handler de peticiones
func NewPetitionHandler(db *gorm.DB) *PetitionHandler {
	return &PetitionHandler{DB: db}
}


// CreatePetition crea una nueva petición
func (h *PetitionHandler) CreatePetition(c *fiber.Ctx) error {
	p := new(models.Petition)
	if err := c.BodyParser(p); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Datos de entrada inválidos"})
	}

	// TODO: Add validation

	if result := h.DB.Create(&p); result.Error != nil {
		log.Printf("Error al guardar petición: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Fallo al guardar la petición."})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Petición guardada con éxito",
		"id":      p.ID,
	})
}

// GetAllPetitions obtiene todas las peticiones (solo admin)
func (h *PetitionHandler) GetAllPetitions(c *fiber.Ctx) error {
	var petitions []models.Petition
	if result := h.DB.Order("created_at desc").Find(&petitions); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener las peticiones",
		})
	}
	return c.Status(fiber.StatusOK).JSON(petitions)
}

// MarkAsRead marca una petición como leída (solo admin)
func (h *PetitionHandler) MarkAsRead(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID de petición inválido"})
	}

	var petition models.Petition
	if result := h.DB.First(&petition, id); result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Petición no encontrada"})
	}

	petition.IsAnswered = true
	if result := h.DB.Save(&petition); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "No se pudo actualizar la petición"})
	}

	return c.Status(fiber.StatusOK).JSON(petition)
}

package handlers

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Petition representa el modelo de petición (debe coincidir con models.Petition)
type Petition struct {
	gorm.Model
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Phone    string `json:"phone"`
	Message  string `json:"message" validate:"required"`
	IsPrayer bool   `json:"is_prayer"`
}

// PetitionHandler maneja las peticiones
type PetitionHandler struct {
	DB *gorm.DB
}

// NewPetitionHandler crea un nuevo handler de peticiones
func NewPetitionHandler(db *gorm.DB) *PetitionHandler {
	return &PetitionHandler{DB: db}
}

// CreatePetition crea una nueva petición
func (h *PetitionHandler) CreatePetition(c echo.Context) error {
	p := new(Petition)
	if err := c.Bind(p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos"})
	}

	// Validar con el validador registrado
	if err := c.Validate(p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
	}

	if result := h.DB.Create(&p); result.Error != nil {
		log.Printf("Error al guardar petición: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Fallo al guardar la petición."})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Petición guardada con éxito",
		"id":      p.ID,
	})
}

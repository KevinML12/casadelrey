package events

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type Handler struct {
	DB *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

// GetEvents - GET /api/events
// Devuelve todos los eventos ordenados por fecha de inicio
func (h *Handler) GetEvents(c echo.Context) error {
	var events []Event

	result := h.DB.Order("start_time ASC").Find(&events)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener eventos",
		})
	}

	return c.JSON(http.StatusOK, events)
}

// CreateEvent - POST /api/admin/events
// Crea un nuevo evento (solo admin)
func (h *Handler) CreateEvent(c echo.Context) error {
	var input struct {
		Title       string    `json:"title" validate:"required"`
		Description string    `json:"description"`
		StartTime   time.Time `json:"start_time" validate:"required"`
		EndTime     time.Time `json:"end_time" validate:"required"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos inválidos",
		})
	}

	// Validar con el validador registrado
	if err := c.Validate(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
	}

	// Validar que la fecha de inicio sea antes que la de fin
	if input.StartTime.After(input.EndTime) {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "La fecha de inicio debe ser anterior a la fecha de fin",
		})
	}

	event := Event{
		Title:       input.Title,
		Description: input.Description,
		StartTime:   input.StartTime,
		EndTime:     input.EndTime,
	}

	if result := h.DB.Create(&event); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al crear el evento",
		})
	}

	return c.JSON(http.StatusCreated, event)
}

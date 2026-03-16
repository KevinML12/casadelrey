package handlers

import (
	"log"
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// EventHandler maneja el CRUD de eventos de la iglesia.
type EventHandler struct {
	DB *gorm.DB
}

// NewEventHandler crea una nueva instancia del handler de eventos.
func NewEventHandler(db *gorm.DB) *EventHandler {
	return &EventHandler{DB: db}
}

// GetEvents godoc
// GET /api/v1/events/
// Lista todos los eventos activos, ordenados por fecha ascendente.
func (h *EventHandler) GetEvents(c echo.Context) error {
	var events []models.Event
	result := h.DB.
		Where("is_active = ?", true).
		Order("date ASC").
		Find(&events)

	if result.Error != nil {
		log.Printf("[Events] Error al obtener eventos: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener los eventos.",
		})
	}

	return c.JSON(http.StatusOK, events)
}

// CreateEvent godoc
// POST /api/v1/admin/events  [Requiere auth + rol admin]
// Crea un nuevo evento.
func (h *EventHandler) CreateEvent(c echo.Context) error {
	event := new(models.Event)
	if err := c.Bind(event); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	if event.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "El título del evento es obligatorio.",
		})
	}

	event.IsActive = true

	if result := h.DB.Create(event); result.Error != nil {
		log.Printf("[Events] Error al crear evento: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo crear el evento.",
		})
	}

	return c.JSON(http.StatusCreated, event)
}

// UpdateEvent godoc
// PUT /api/v1/admin/events/:id  [Requiere auth + rol admin]
// Actualiza un evento existente.
func (h *EventHandler) UpdateEvent(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "ID de evento inválido.",
		})
	}

	var event models.Event
	if result := h.DB.First(&event, id); result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Evento no encontrado.",
		})
	}

	if err := c.Bind(&event); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	if result := h.DB.Save(&event); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo actualizar el evento.",
		})
	}

	return c.JSON(http.StatusOK, event)
}

// DeleteEvent godoc
// DELETE /api/v1/admin/events/:id  [Requiere auth + rol admin]
// Desactiva un evento (soft-delete lógico: is_active = false).
func (h *EventHandler) DeleteEvent(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "ID de evento inválido.",
		})
	}

	if result := h.DB.Model(&models.Event{}).Where("id = ?", id).Update("is_active", false); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo eliminar el evento.",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Evento eliminado correctamente.",
	})
}

package handlers

import (
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// RSVPHandler gestiona el registro de asistencia a eventos.
type RSVPHandler struct {
	DB *gorm.DB
}

func NewRSVPHandler(db *gorm.DB) *RSVPHandler {
	return &RSVPHandler{DB: db}
}

// RegisterRSVP POST /api/v1/events/:id/rsvp — público.
func (h *RSVPHandler) RegisterRSVP(c echo.Context) error {
	eventID := c.Param("id")

	var event models.Event
	if err := h.DB.First(&event, eventID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Evento no encontrado."})
	}
	if !event.IsActive {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Este evento ya no está activo."})
	}

	var req struct {
		Name          string `json:"name"`
		Email         string `json:"email"`
		Phone         string `json:"phone"`
		AttendeeCount int    `json:"attendee_count"`
		Notes         string `json:"notes"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Name == "" || req.Email == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre y correo son obligatorios."})
	}
	if req.AttendeeCount < 1 {
		req.AttendeeCount = 1
	}

	// Evitar doble registro
	var existing models.EventRegistration
	if h.DB.Where("event_id = ? AND email = ?", eventID, req.Email).First(&existing).Error == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Ya existe un registro con este correo para este evento."})
	}

	userID, _ := c.Get("user_id").(uint)
	reg := models.EventRegistration{
		EventID:       event.ID,
		Name:          req.Name,
		Email:         req.Email,
		Phone:         req.Phone,
		AttendeeCount: req.AttendeeCount,
		Notes:         req.Notes,
	}
	if userID != 0 {
		reg.UserID = &userID
	}

	if err := h.DB.Create(&reg).Error; err != nil {
		log.Printf("[RSVP] Error al registrar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al registrar asistencia."})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message":      "Registro confirmado.",
		"registration": reg,
	})
}

// GetEventRSVPs GET /api/v1/admin/events/:id/rsvps — admin.
func (h *RSVPHandler) GetEventRSVPs(c echo.Context) error {
	eventID := c.Param("id")
	page, limit := parsePage(c)

	var total int64
	h.DB.Model(&models.EventRegistration{}).Where("event_id = ?", eventID).Count(&total)

	offset := (page - 1) * limit
	var registrations []models.EventRegistration
	if err := h.DB.Where("event_id = ?", eventID).
		Order("created_at DESC").
		Offset(offset).Limit(limit).
		Find(&registrations).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener registros."})
	}

	// Total de asistentes confirmados
	var totalAttendees int64
	h.DB.Model(&models.EventRegistration{}).
		Where("event_id = ?", eventID).
		Select("COALESCE(SUM(attendee_count), 0)").
		Scan(&totalAttendees)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":             registrations,
		"meta":             newMeta(total, page, limit),
		"total_attendees":  totalAttendees,
	})
}

// DeleteRSVP DELETE /api/v1/admin/rsvps/:id — admin.
func (h *RSVPHandler) DeleteRSVP(c echo.Context) error {
	id := c.Param("id")
	if err := h.DB.Delete(&models.EventRegistration{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar el registro."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Registro eliminado."})
}

package handlers

import (
	"fmt"
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

	userID, _ := c.Get("user_id").(uint)

	// Todo el chequeo (duplicado, cupo, pago) + el INSERT van en una sola
	// transaccion con lock de fila sobre el Event (SELECT ... FOR UPDATE):
	// sin esto, dos RSVP simultaneos para el ultimo cupo podrian leer el
	// mismo conteo de asistentes y los dos pasar la validacion, sobre-
	// inscribiendo el evento. Con el lock, el segundo espera a que el
	// primero termine (commit o rollback) antes de leer el conteo.
	var status int
	var body interface{}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var event models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, eventID).Error; err != nil {
			status, body = http.StatusNotFound, map[string]string{"error": "Evento no encontrado."}
			return nil
		}
		if !event.IsActive {
			status, body = http.StatusBadRequest, map[string]string{"error": "Este evento ya no está activo."}
			return nil
		}

		// Evitar doble registro
		var existing models.EventRegistration
		if tx.Where("event_id = ? AND email = ?", eventID, req.Email).First(&existing).Error == nil {
			status, body = http.StatusConflict, map[string]string{"error": "Ya existe un registro con este correo para este evento."}
			return nil
		}

		// Cupo — 0 = sin limite
		if event.Capacity > 0 {
			current := attendeeCountFor(tx, event.ID)
			remaining := event.Capacity - int(current)
			if remaining <= 0 {
				status, body = http.StatusConflict, map[string]interface{}{
					"error":   "Este evento ya alcanzó su cupo máximo.",
					"is_full": true,
				}
				return nil
			}
			if req.AttendeeCount > remaining {
				errMsg := fmt.Sprintf("Solo quedan %d cupos disponibles para este evento.", remaining)
				if remaining == 1 {
					errMsg = "Solo queda 1 cupo disponible para este evento."
				}
				status, body = http.StatusConflict, map[string]interface{}{
					"error":           errMsg,
					"spots_remaining": remaining,
				}
				return nil
			}
		}

		// Si el evento requiere pago, validar que exista un comprobante verificado o pendiente
		paymentStatus := "no_requerido"
		if event.RequiresPayment {
			var receipt models.PaymentReceipt
			err := tx.Where("payer_email = ? AND event_id = ? AND status IN ('pendiente','verificado')", req.Email, event.ID).
				First(&receipt).Error

			if err != nil {
				// No hay boleta → bloquear el registro
				status, body = http.StatusPaymentRequired, map[string]interface{}{
					"error":             "Este evento requiere pago. Sube tu comprobante bancario antes de registrarte.",
					"requires_payment":  true,
					"price_gtq":         event.PriceGTQ,
					"upload_url":        "/comprobante",
				}
				return nil
			}

			// Hay boleta: si está verificada → confirmado, si está pendiente → en espera
			if receipt.Status == "verificado" {
				paymentStatus = "verificado"
			} else {
				paymentStatus = "pendiente"
			}
		}

		reg := models.EventRegistration{
			EventID:       event.ID,
			Name:          req.Name,
			Email:         req.Email,
			Phone:         req.Phone,
			AttendeeCount: req.AttendeeCount,
			Notes:         req.Notes,
			PaymentStatus: paymentStatus,
		}
		if userID != 0 {
			reg.UserID = &userID
		}

		if err := tx.Create(&reg).Error; err != nil {
			return err
		}

		msg := "Registro confirmado."
		if paymentStatus == "pendiente" {
			msg = "Registro recibido. Tu pago está pendiente de verificación."
		}
		status, body = http.StatusCreated, map[string]interface{}{
			"message":      msg,
			"registration": reg,
		}
		return nil
	})

	if err != nil {
		log.Printf("[RSVP] Error al registrar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al registrar asistencia."})
	}

	return c.JSON(status, body)
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

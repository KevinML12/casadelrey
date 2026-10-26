package handlers

import (
	"casadelrey/backend/auth"
	"casadelrey/backend/email"
	"fmt"
	"html"
	"log"
	"net/http"
	"strings"
	"time"

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
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", eventID).First(&event).Error; err != nil {
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
		var receiptID *uint
		if event.RequiresPayment {
			var receipt models.PaymentReceipt
			err := tx.Where("payer_email = ? AND event_id = ? AND status IN ('pendiente','verificado')", req.Email, event.ID).
				First(&receipt).Error

			if err != nil {
				// No hay boleta → bloquear el registro
				status, body = http.StatusPaymentRequired, map[string]interface{}{
					"error":            "Este evento requiere pago. Sube tu comprobante bancario antes de registrarte.",
					"requires_payment": true,
					"price_gtq":        event.PriceGTQ,
					"upload_url":       "/comprobante",
				}
				return nil
			}

			// Amount is in GTQ; an insufficient or reused receipt cannot reserve seats.
			required := event.PriceGTQ * float64(req.AttendeeCount)
			if receipt.Currency != "GTQ" || receipt.Purpose != "evento" || receipt.Amount+0.005 < required {
				status, body = http.StatusPaymentRequired, map[string]interface{}{"error": "El comprobante no cubre el total de asistentes en GTQ.", "required_amount": required, "requires_payment": true}
				return nil
			}
			var used int64
			if err := tx.Model(&models.EventRegistration{}).Where("receipt_id = ?", receipt.ID).Count(&used).Error; err != nil {
				return err
			}
			if used > 0 {
				status, body = http.StatusConflict, map[string]string{"error": "El comprobante ya está asociado a una inscripción."}
				return nil
			}

			// Hay boleta: si está verificada → confirmado, si está pendiente → en espera
			if receipt.Status == "verificado" {
				paymentStatus = "verificado"
			} else {
				paymentStatus = "pendiente"
			}
			// Sin esto, PaymentReceiptHandler.Verify (Where("receipt_id = ?", ...))
			// nunca encontraba a que registro actualizarle el payment_status al
			// aprobar/rechazar -- el campo existia en el modelo pero nadie lo
			// llenaba, asi que la inscripcion se quedaba en "pendiente" para
			// siempre aunque el admin ya hubiera verificado el comprobante.
			receiptID = &receipt.ID
		}

		reg := models.EventRegistration{
			EventID:       event.ID,
			Name:          req.Name,
			Email:         req.Email,
			Phone:         req.Phone,
			AttendeeCount: req.AttendeeCount,
			Notes:         req.Notes,
			PaymentStatus: paymentStatus,
			ReceiptID:     receiptID,
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
		"data":            registrations,
		"meta":            newMeta(total, page, limit),
		"total_attendees": totalAttendees,
	})
}

// DeleteRSVP DELETE /api/v1/admin/rsvps/:id — admin.
func (h *RSVPHandler) DeleteRSVP(c echo.Context) error {
	id := c.Param("id")
	if err := h.DB.Where("id = ?", id).Delete(&models.EventRegistration{}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar el registro."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Registro eliminado."})
}

// RequestCancellation issues a short-lived credential to the registration email.
// Always return the same response so a visitor cannot enumerate registrations.
func (h *RSVPHandler) RequestCancellation(c echo.Context) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.Bind(&req); err != nil || strings.TrimSpace(req.Email) == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Correo requerido."})
	}
	var reg models.EventRegistration
	err := h.DB.Where("event_id = ? AND email = ?", c.Param("id"), strings.TrimSpace(req.Email)).First(&reg).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo procesar la solicitud."})
	}
	if err == nil {
		token, err := auth.GenerateSecureToken(32)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo procesar la solicitud."})
		}
		if err := h.DB.Model(&reg).Updates(map[string]interface{}{"cancellation_token_hash": auth.HashToken(token), "cancellation_token_expiry": time.Now().Add(15 * time.Minute)}).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo procesar la solicitud."})
		}
		email.SendEmailAsync(reg.Email, "Código para cancelar tu inscripción — Casa del Rey", "<p>Para cancelar tu inscripción, copia este código en el formulario del evento. Caduca en 15 minutos.</p><p><strong>"+html.EscapeString(token)+"</strong></p><p>Si no lo solicitaste, puedes ignorar este correo.</p>")
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Si existe una inscripción con ese correo, recibirás un código de cancelación."})
}

// CancelMyRSVP consumes the email credential in the same statement as the deletion.
func (h *RSVPHandler) CancelMyRSVP(c echo.Context) error {
	var req struct {
		Email string `json:"email"`
		Token string `json:"token"`
	}
	if err := c.Bind(&req); err != nil || req.Email == "" || req.Token == "" {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "Se requiere el código enviado a tu correo."})
	}
	result := h.DB.Where("event_id = ? AND email = ? AND cancellation_token_hash = ? AND cancellation_token_expiry > ?", c.Param("id"), strings.TrimSpace(req.Email), auth.HashToken(strings.TrimSpace(req.Token)), time.Now()).Delete(&models.EventRegistration{})
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo cancelar el registro."})
	}
	if result.RowsAffected != 1 {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "Código inválido o expirado."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Registro cancelado."})
}

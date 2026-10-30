package handlers

import (
	"casadelrey/backend/auth"
	"casadelrey/backend/email"
	"casadelrey/backend/storage"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
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
	DB    *gorm.DB
	store storage.ReceiptStore
}

func NewRSVPHandler(db *gorm.DB, stores ...storage.Store) *RSVPHandler {
	h := &RSVPHandler{DB: db}
	if len(stores) > 0 {
		h.store, _ = stores[0].(storage.ReceiptStore)
	}
	return h
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
		Receipt       *struct {
			Amount    float64 `json:"amount"`
			Bank      string  `json:"bank_name"`
			Reference string  `json:"reference_number"`
			File      string  `json:"receipt_image_url"`
		} `json:"receipt"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = normalizeEmail(req.Email)
	if req.Name == "" || len(req.Name) > 100 || !email.ValidAddress(req.Email) {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre y correo son obligatorios."})
	}
	if req.AttendeeCount < 1 {
		req.AttendeeCount = 1
	}
	if req.AttendeeCount > 100 || len(req.Notes) > 2000 {
		return c.JSON(400, map[string]string{"error": "Revisa la cantidad de asistentes y las notas."})
	}

	var submissionKey *string
	requestHash := ""
	if key := c.Request().Header.Get("Idempotency-Key"); key != "" {
		if !donationKeyPattern.MatchString(key) {
			return c.JSON(400, map[string]string{"error": "Identificador de envío inválido."})
		}
		sum := sha256.Sum256([]byte(key))
		hashed := hex.EncodeToString(sum[:])
		submissionKey = &hashed
		data, _ := json.Marshal(req)
		sum = sha256.Sum256(data)
		requestHash = hex.EncodeToString(sum[:])
	}
	if req.Receipt != nil {
		if submissionKey == nil || !validMoney(req.Receipt.Amount) {
			return c.JSON(400, map[string]string{"error": "Revisa los datos del comprobante."})
		}
		if _, ok := storage.ReceiptKey(req.Receipt.File); !ok {
			return c.JSON(400, map[string]string{"error": "Sube el archivo desde el formulario."})
		}
		if h.store == nil {
			return c.JSON(503, map[string]string{"error": "El almacenamiento privado no está disponible."})
		}
		f, _, err := h.store.OpenReceipt(c.Request().Context(), req.Receipt.File)
		if err != nil {
			return c.JSON(400, map[string]string{"error": "Vuelve a subir el comprobante."})
		}
		f.Close()
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
		if tx.Where("event_id = ? AND LOWER(email) = ?", eventID, req.Email).First(&existing).Error == nil {
			if submissionKey != nil && existing.SubmissionKey != nil && *submissionKey == *existing.SubmissionKey && existing.RequestHash == requestHash {
				status, body = 200, map[string]interface{}{"message": "Registro recibido.", "registration": existing}
				return nil
			}
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
			if paymentDeadlinePassed(event) {
				status, body = 400, map[string]string{"error": "El plazo de pago de este evento terminó."}
				return nil
			}
			var receipt models.PaymentReceipt
			if req.Receipt != nil {
				if len(req.Receipt.Bank) > 100 || len(req.Receipt.Reference) > 100 || req.Receipt.Amount+0.005 < event.PriceGTQ*float64(req.AttendeeCount) {
					return echo.NewHTTPError(400, "El comprobante no cubre el total de asistentes.")
				}
				if err := reserveReceipt(tx, req.Receipt.File, 0); err != nil {
					return err
				}
				receipt = models.PaymentReceipt{PayerName: req.Name, PayerEmail: req.Email, PayerPhone: req.Phone, Amount: req.Receipt.Amount, Currency: "GTQ", BankName: req.Receipt.Bank, ReferenceNumber: req.Receipt.Reference, ReceiptImageURL: req.Receipt.File, Purpose: "evento", EventID: &event.ID, Status: "pendiente"}
				if err := tx.Create(&receipt).Error; err != nil {
					return err
				}
			}
			var err error
			if req.Receipt == nil {
				err = tx.Where("LOWER(payer_email) = ? AND event_id = ? AND status IN ('pendiente','verificado')", req.Email, event.ID).Order("created_at DESC").
					First(&receipt).Error
			}

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

		reg := models.EventRegistration{SubmissionKey: submissionKey, RequestHash: requestHash,
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
		return email.Enqueue(tx, email.Message{Key: fmt.Sprintf("rsvp:%d:created", reg.ID), Kind: "event_registration", To: reg.Email, Subject: "Tu inscripción — Casa del Rey", HTML: email.GetEventRegistrationTemplate(reg.Name, event.Title, event.Date, event.Time, event.Location, paymentStatus, reg.AttendeeCount)})
	})

	if err != nil {
		var he *echo.HTTPError
		if errors.As(err, &he) {
			return c.JSON(he.Code, map[string]interface{}{"error": he.Message})
		}
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
	err := h.DB.Where("event_id = ? AND LOWER(email) = ?", c.Param("id"), normalizeEmail(req.Email)).First(&reg).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo procesar la solicitud."})
	}
	if err == nil {
		token, err := auth.GenerateSecureToken(32)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo procesar la solicitud."})
		}
		expiry := time.Now().Add(15 * time.Minute)
		err = h.DB.Transaction(func(tx *gorm.DB) error {
			if err := tx.Model(&reg).Updates(map[string]interface{}{"cancellation_token_hash": auth.HashToken(token), "cancellation_token_expiry": expiry}).Error; err != nil {
				return err
			}
			return email.Enqueue(tx, email.Message{Key: "rsvp-cancel:" + auth.HashToken(token), Kind: "event_cancellation_code", To: reg.Email, Subject: "Código para cancelar tu inscripción — Casa del Rey", HTML: email.GetCancellationTemplate(token), ExpiresAt: expiry})
		})
		if err != nil {
			return c.JSON(500, map[string]string{"error": "No se pudo procesar la solicitud."})
		}
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
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var reg models.EventRegistration
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("event_id = ? AND LOWER(email) = ? AND cancellation_token_hash = ? AND cancellation_token_expiry > ?", c.Param("id"), normalizeEmail(req.Email), auth.HashToken(strings.TrimSpace(req.Token)), time.Now()).First(&reg).Error; err != nil {
			return echo.NewHTTPError(403, "Código inválido o expirado.")
		}
		var ev models.Event
		if err := tx.First(&ev, reg.EventID).Error; err != nil {
			return err
		}
		if err := tx.Delete(&reg).Error; err != nil {
			return err
		}
		return email.Enqueue(tx, email.Message{Key: fmt.Sprintf("rsvp:%d:cancelled", reg.ID), Kind: "event_cancelled", To: reg.Email, Subject: "Inscripción cancelada — Casa del Rey", HTML: email.GetEventCancelledTemplate(ev.Title)})
	})
	if err != nil {
		var he *echo.HTTPError
		if errors.As(err, &he) {
			return c.JSON(he.Code, map[string]interface{}{"error": he.Message})
		}
		return c.JSON(500, map[string]string{"error": "No se pudo cancelar el registro."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Registro cancelado."})
}

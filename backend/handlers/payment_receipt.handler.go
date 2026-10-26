package handlers

import (
	"errors"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"casadelrey/backend/email"
	"casadelrey/backend/models"
	"casadelrey/backend/storage"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PaymentReceiptHandler struct {
	DB    *gorm.DB
	store storage.ReceiptStore
}

func NewPaymentReceiptHandler(db *gorm.DB, stores ...storage.Store) *PaymentReceiptHandler {
	h := &PaymentReceiptHandler{DB: db}
	if len(stores) > 0 {
		h.store, _ = stores[0].(storage.ReceiptStore)
	}
	return h
}

// File streams a receipt only after the router has validated a live admin session.
// Never fetch client-supplied URLs (including historical public URLs).
func (h *PaymentReceiptHandler) File(c echo.Context) error {
	c.Response().Header().Set("Cache-Control", "private, no-store")
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")
	var receipt models.PaymentReceipt
	if err := h.DB.Where("id = ?", c.Param("id")).First(&receipt).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Comprobante no encontrado."})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo consultar el comprobante."})
	}
	key, ok := storage.ReceiptKey(receipt.ReceiptImageURL)
	if !ok {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Este archivo requiere migración al almacenamiento privado."})
	}
	if h.store == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "El almacenamiento privado no está disponible."})
	}
	file, contentType, err := h.store.OpenReceipt(c.Request().Context(), receipt.ReceiptImageURL)
	if err != nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "No se pudo abrir el archivo privado."})
	}
	defer file.Close()
	c.Response().Header().Set("Content-Disposition", `inline; filename="`+strings.TrimPrefix(key, "comprobantes/")+`"`)
	return c.Stream(http.StatusOK, contentType, file)
}

// Submit POST /api/v1/receipts — público, cualquiera puede subir un comprobante.
func (h *PaymentReceiptHandler) Submit(c echo.Context) error {
	var req struct {
		PayerName       string  `json:"payer_name"`
		PayerEmail      string  `json:"payer_email"`
		PayerPhone      string  `json:"payer_phone"`
		Amount          float64 `json:"amount"`
		BankName        string  `json:"bank_name"`
		ReferenceNumber string  `json:"reference_number"`
		ReceiptImageURL string  `json:"receipt_image_url"`
		Purpose         string  `json:"purpose"` // donacion | evento
		EventID         *uint   `json:"event_id"`
		DonationID      *uint   `json:"donation_id"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.PayerName == "" || req.Amount <= 0 || req.ReceiptImageURL == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Nombre, monto y foto del comprobante son requeridos.",
		})
	}
	if _, ok := storage.ReceiptKey(req.ReceiptImageURL); !ok {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Sube el comprobante mediante el formulario antes de enviarlo."})
	}

	receipt := models.PaymentReceipt{
		PayerName:       req.PayerName,
		PayerEmail:      req.PayerEmail,
		PayerPhone:      req.PayerPhone,
		Amount:          req.Amount,
		Currency:        "GTQ",
		BankName:        req.BankName,
		ReferenceNumber: req.ReferenceNumber,
		ReceiptImageURL: req.ReceiptImageURL,
		Purpose:         req.Purpose,
		EventID:         req.EventID,
		DonationID:      req.DonationID,
		Status:          "pendiente",
	}

	if err := h.DB.Create(&receipt).Error; err != nil {
		log.Printf("[Receipt] Error al guardar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al registrar el comprobante."})
	}

	log.Printf("[Receipt] Nuevo comprobante ID:%d", receipt.ID)
	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Comprobante recibido. El equipo lo verificará en 24-48 horas.",
		"id":      receipt.ID,
	})
}

// GetAll GET /api/v1/admin/receipts — admin ve todos los comprobantes.
func (h *PaymentReceiptHandler) GetAll(c echo.Context) error {
	status := c.QueryParam("status")
	purpose := c.QueryParam("purpose")
	page, limit := parsePage(c)

	q := h.DB.Model(&models.PaymentReceipt{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if purpose != "" {
		q = q.Where("purpose = ?", purpose)
	}

	var total int64
	q.Count(&total)

	var receipts []models.PaymentReceipt
	if err := q.Order("created_at DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&receipts).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener comprobantes."})
	}

	return c.JSON(http.StatusOK, PagedResponse{Data: receipts, Meta: newMeta(total, page, limit)})
}

// Verify PUT /api/v1/admin/receipts/:id/verify — admin aprueba o rechaza.
func (h *PaymentReceiptHandler) Verify(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}

	var req struct {
		Status          string `json:"status"`           // verificado | rechazado
		RejectionReason string `json:"rejection_reason"` // solo si rechazado
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Status != "verificado" && req.Status != "rechazado" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Status debe ser 'verificado' o 'rechazado'."})
	}

	var receipt models.PaymentReceipt
	adminID, _ := c.Get("user_id").(uint)
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&receipt, id).Error; err != nil {
			return err
		}
		now := time.Now()
		receipt.Status = req.Status
		receipt.VerifiedByID = &adminID
		receipt.VerifiedAt = &now
		receipt.RejectionReason = req.RejectionReason
		return persistReceiptStatus(tx, &receipt)
	})
	if err != nil {
		return receiptWriteError(c, err)
	}

	// Notificar al pagador -- la UI (AdminReceipts.jsx) le promete al admin
	// que rechazar "notifica al pagador" y el formulario público le promete
	// al donante que "recibirás confirmación"; sin este envío ninguna de las
	// dos ocurría. Solo si dejó correo (el flujo es público, puede quedar vacío).
	if receipt.PayerEmail != "" {
		if req.Status == "verificado" {
			email.SendEmailAsync(receipt.PayerEmail, "Comprobante verificado — Casa del Rey",
				email.GetReceiptVerifiedTemplate(receipt.PayerName, receipt.Amount))
		} else {
			email.SendEmailAsync(receipt.PayerEmail, "Comprobante rechazado — Casa del Rey",
				email.GetReceiptRejectedTemplate(receipt.PayerName, receipt.Amount, receipt.RejectionReason))
		}
	}

	log.Printf("[Receipt] %s por admin %d — ID:%d", req.Status, adminID, receipt.ID)
	return c.JSON(http.StatusOK, receipt)
}

// GetPendingCount GET /api/v1/admin/receipts/count — para badges de notificación.
func (h *PaymentReceiptHandler) GetPendingCount(c echo.Context) error {
	var count int64
	h.DB.Model(&models.PaymentReceipt{}).Where("status = ?", "pendiente").Count(&count)
	return c.JSON(http.StatusOK, map[string]int64{"pending": count})
}

// Revert PUT /api/v1/admin/receipts/:id/revert — revierte a pendiente.
// Útil si el admin cometió un error al verificar o rechazar.
func (h *PaymentReceiptHandler) Revert(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}

	var receipt models.PaymentReceipt
	var prevStatus string
	adminID, _ := c.Get("user_id").(uint)
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&receipt, id).Error; err != nil {
			return err
		}
		prevStatus = receipt.Status
		receipt.Status = "pendiente"
		receipt.VerifiedByID = nil
		receipt.VerifiedAt = nil
		receipt.RejectionReason = ""
		return persistReceiptStatus(tx, &receipt)
	})
	if err != nil {
		return receiptWriteError(c, err)
	}

	log.Printf("[Receipt] Revertido de '%s' a 'pendiente' por admin %d — ID:%d", prevStatus, adminID, receipt.ID)
	return c.JSON(http.StatusOK, receipt)
}

// persistReceiptStatus changes receipt and financial/RSVP state in one transaction.
func persistReceiptStatus(tx *gorm.DB, receipt *models.PaymentReceipt) error {
	if receipt.Purpose == "evento" {
		var registrations []models.EventRegistration
		if err := tx.Preload("Event").Where("receipt_id = ?", receipt.ID).Find(&registrations).Error; err != nil {
			return err
		}
		if receipt.Status == "verificado" {
			if len(registrations) > 1 {
				return echo.NewHTTPError(http.StatusConflict, "El comprobante está asociado a más de una inscripción. Revisa los datos antes de verificar.")
			}
			for _, reg := range registrations {
				if receipt.EventID == nil || *receipt.EventID != reg.EventID || receipt.Currency != "GTQ" || receipt.Amount+0.005 < reg.Event.PriceGTQ*float64(reg.AttendeeCount) {
					return echo.NewHTTPError(http.StatusBadRequest, "El comprobante no cubre el importe del evento.")
				}
			}
		}
	}
	if receipt.Purpose == "donacion" && receipt.DonationID != nil {
		var donation models.Donation
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&donation, *receipt.DonationID).Error; err != nil {
			return err
		}
		if donation.ReceiptID != nil && *donation.ReceiptID != receipt.ID {
			return echo.NewHTTPError(http.StatusConflict, "La donación ya tiene otro comprobante asociado.")
		}
		if donation.Currency != receipt.Currency || math.Round(donation.Amount*100) != math.Round(receipt.Amount*100) || !strings.EqualFold(strings.TrimSpace(donation.Email), strings.TrimSpace(receipt.PayerEmail)) {
			return echo.NewHTTPError(http.StatusBadRequest, "El comprobante no coincide con la donación.")
		}
		if err := tx.Model(&donation).Updates(map[string]interface{}{"receipt_id": receipt.ID, "is_successful": receipt.Status == "verificado"}).Error; err != nil {
			return err
		}
	}
	if err := tx.Save(receipt).Error; err != nil {
		return err
	}
	if receipt.Purpose == "evento" {
		return tx.Model(&models.EventRegistration{}).Where("receipt_id = ?", receipt.ID).Update("payment_status", receipt.Status).Error
	}
	return nil
}
func receiptWriteError(c echo.Context, err error) error {
	var he *echo.HTTPError
	if errors.As(err, &he) {
		return c.JSON(he.Code, map[string]interface{}{"error": he.Message})
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Comprobante o registro relacionado no encontrado."})
	}
	log.Printf("[Receipt] Error al guardar: %v", err)
	return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo actualizar el comprobante."})
}

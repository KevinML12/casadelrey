package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"casadelrey/backend/email"
	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type PaymentReceiptHandler struct {
	DB *gorm.DB
}

func NewPaymentReceiptHandler(db *gorm.DB) *PaymentReceiptHandler {
	return &PaymentReceiptHandler{DB: db}
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

	log.Printf("[Receipt] Nuevo comprobante: %s Q%.2f banco:%s ref:%s", receipt.PayerName, receipt.Amount, receipt.BankName, receipt.ReferenceNumber)
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
	if err := h.DB.First(&receipt, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Comprobante no encontrado."})
	}

	adminID, _ := c.Get("user_id").(uint)
	now := time.Now()

	receipt.Status = req.Status
	receipt.VerifiedByID = &adminID
	receipt.VerifiedAt = &now
	receipt.RejectionReason = req.RejectionReason

	h.DB.Save(&receipt)

	// Si está ligado a una inscripción de evento, actualizar su payment_status
	if receipt.Purpose == "evento" && receipt.EventID != nil {
		newPaymentStatus := "verificado"
		if req.Status == "rechazado" {
			newPaymentStatus = "rechazado"
		}
		h.DB.Model(&models.EventRegistration{}).
			Where("receipt_id = ?", receipt.ID).
			Update("payment_status", newPaymentStatus)
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
	if err := h.DB.First(&receipt, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Comprobante no encontrado."})
	}
	if receipt.Status == "pendiente" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El comprobante ya está en estado pendiente."})
	}

	prevStatus := receipt.Status
	receipt.Status = "pendiente"
	receipt.VerifiedByID = nil
	receipt.VerifiedAt = nil
	receipt.RejectionReason = ""
	h.DB.Save(&receipt)

	// Si estaba ligado a una inscripción de evento, revertir también su payment_status
	if receipt.Purpose == "evento" && receipt.EventID != nil {
		h.DB.Model(&models.EventRegistration{}).
			Where("receipt_id = ?", receipt.ID).
			Update("payment_status", "pendiente")
	}

	adminID, _ := c.Get("user_id").(uint)
	log.Printf("[Receipt] Revertido de '%s' a 'pendiente' por admin %d — ID:%d", prevStatus, adminID, receipt.ID)
	return c.JSON(http.StatusOK, receipt)
}

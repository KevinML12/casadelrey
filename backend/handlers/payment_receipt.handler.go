package handlers

import (
	"casadelrey/backend/auth"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"casadelrey/backend/config"
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
		Purpose         string  `json:"purpose"`
		EventID         *uint   `json:"event_id"`
		DonationID      *uint   `json:"donation_id"`
		DonationPurpose string  `json:"donation_purpose"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(400, map[string]string{"error": "Datos inválidos."})
	}
	req.PayerName = strings.TrimSpace(req.PayerName)
	req.PayerEmail = normalizeEmail(req.PayerEmail)
	if req.PayerName == "" || len(req.PayerName) > 100 || !email.ValidAddress(req.PayerEmail) || !validMoney(req.Amount) || len(req.ReferenceNumber) > 100 || len(req.BankName) > 100 {
		return c.JSON(400, map[string]string{"error": "Revisa tu nombre, correo y monto del depósito."})
	}
	if req.Purpose != "evento" && req.Purpose != "donacion" {
		return c.JSON(400, map[string]string{"error": "Selecciona evento o donación."})
	}
	if req.DonationID != nil || (req.Purpose == "donacion" && req.EventID != nil) || (req.Purpose == "evento" && (req.EventID == nil || *req.EventID == 0)) {
		return c.JSON(400, map[string]string{"error": "El comprobante no corresponde a un destino válido."})
	}
	key := c.Request().Header.Get("Idempotency-Key")
	if key == "" {
		// Previously loaded clients did not send this header. The already opaque
		// private-file reference supplies a stable key during the rollout.
		legacy := sha256.Sum256([]byte("receipt-file:" + req.ReceiptImageURL))
		key = hex.EncodeToString(legacy[:])
	}
	if !donationKeyPattern.MatchString(key) {
		return c.JSON(400, map[string]string{"error": "No se pudo identificar el envío. Vuelve a intentar desde el formulario."})
	}
	if _, ok := storage.ReceiptKey(req.ReceiptImageURL); !ok {
		return c.JSON(400, map[string]string{"error": "Sube el comprobante mediante el formulario antes de enviarlo."})
	}
	if h.store == nil {
		return c.JSON(503, map[string]string{"error": "El almacenamiento privado no está disponible."})
	}
	file, _, err := h.store.OpenReceipt(c.Request().Context(), req.ReceiptImageURL)
	if err != nil {
		return c.JSON(400, map[string]string{"error": "No encontramos el archivo privado. Vuelve a subirlo."})
	}
	file.Close()
	sum := sha256.Sum256([]byte(key))
	storedKey := hex.EncodeToString(sum[:])
	data, _ := json.Marshal(req)
	sum = sha256.Sum256(data)
	requestHash := hex.EncodeToString(sum[:])
	var receipt models.PaymentReceipt
	replayed := false
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if tx.Dialector.Name() == "postgres" {
			if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", "receipt-submission:"+storedKey).Error; err != nil {
				return err
			}
		}
		var existing models.PaymentReceipt
		find := tx.Unscoped().Where("submission_key = ?", storedKey).First(&existing)
		if find.Error == nil {
			if existing.DeletedAt.Valid || existing.RequestHash != requestHash {
				return echo.NewHTTPError(409, "Este envío ya fue utilizado con otros datos.")
			}
			receipt = existing
			replayed = true
			return nil
		}
		if !errors.Is(find.Error, gorm.ErrRecordNotFound) {
			return find.Error
		}
		if req.Purpose == "evento" {
			var ev models.Event
			if err := tx.First(&ev, *req.EventID).Error; err != nil {
				return err
			}
			if !ev.IsActive || !ev.RequiresPayment || paymentDeadlinePassed(ev) || !validMoney(ev.PriceGTQ) || req.Amount+0.005 < ev.PriceGTQ {
				return echo.NewHTTPError(400, "El evento no acepta este depósito. Revisa el plazo y el importe.")
			}
		}
		if req.Purpose == "donacion" {
			var n int64
			if err := tx.Model(&models.DonationPurpose{}).Where("value = ? AND is_active = ?", req.DonationPurpose, true).Count(&n).Error; err != nil {
				return err
			}
			if n != 1 || req.Amount < 10 {
				return echo.NewHTTPError(400, "Selecciona un destino de donación activo y un monto desde Q10.")
			}
		}
		if err := reserveReceipt(tx, req.ReceiptImageURL, 0); err != nil {
			return err
		}
		receipt = models.PaymentReceipt{SubmissionKey: &storedKey, RequestHash: requestHash, PayerName: req.PayerName, PayerEmail: req.PayerEmail, PayerPhone: req.PayerPhone, Amount: req.Amount, Currency: "GTQ", BankName: req.BankName, ReferenceNumber: req.ReferenceNumber, ReceiptImageURL: req.ReceiptImageURL, Purpose: req.Purpose, EventID: req.EventID, Status: "pendiente"}
		if err := tx.Create(&receipt).Error; err != nil {
			return err
		}
		if req.Purpose == "donacion" {
			d := models.Donation{Name: req.PayerName, Email: req.PayerEmail, Amount: req.Amount, Currency: "GTQ", PaymentMethod: "transferencia", ReceiptID: &receipt.ID, DonationPurpose: req.DonationPurpose}
			if err := tx.Create(&d).Error; err != nil {
				return err
			}
			receipt.DonationID = &d.ID
			if err := tx.Save(&receipt).Error; err != nil {
				return err
			}
		}
		return queueReceiptNotice(tx, receipt, "pendiente", "")
	})
	if err != nil {
		return receiptWriteError(c, err)
	}
	status := 201
	if replayed {
		status = 200
	}
	return c.JSON(status, map[string]interface{}{"message": "Comprobante recibido. El pago permanece pendiente de verificación.", "id": receipt.ID})
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
	var replacementToken string
	adminID, _ := c.Get("user_id").(uint)
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&receipt, id).Error; err != nil {
			return err
		}
		if receipt.Status == req.Status {
			return nil
		}
		if receipt.Status != "pendiente" {
			return echo.NewHTTPError(409, "Primero devuelve el comprobante a pendiente para cambiar la decisión.")
		}
		if req.Status == "rechazado" && strings.TrimSpace(req.RejectionReason) == "" {
			return echo.NewHTTPError(400, "Escribe el motivo del rechazo.")
		}
		if len(req.RejectionReason) > 255 {
			return echo.NewHTTPError(400, "El motivo admite hasta 255 caracteres.")
		}
		receipt.Revision++
		receipt.ReplacementTokenHash = ""
		receipt.ReplacementTokenExpiry = nil
		if req.Status == "rechazado" {
			receipt.ConsumedReplacementHash = ""
			receipt.ReplacementRequestHash = ""
			receipt.ConsumedReplacementExpiry = nil
			var err error
			replacementToken, err = auth.GenerateSecureToken(32)
			if err != nil {
				return err
			}
			expiry := time.Now().Add(7 * 24 * time.Hour)
			receipt.ReplacementTokenHash = auth.HashToken(replacementToken)
			receipt.ReplacementTokenExpiry = &expiry
		}
		now := time.Now()
		receipt.Status = req.Status
		receipt.VerifiedByID = &adminID
		receipt.VerifiedAt = &now
		receipt.RejectionReason = req.RejectionReason
		if err := persistReceiptStatus(tx, &receipt); err != nil {
			return err
		}
		action := ""
		if replacementToken != "" {
			action = strings.TrimRight(config.AppConfig.ClientURL, "/") + fmt.Sprintf("/comprobante?receipt=%d#token=%s", receipt.ID, replacementToken)
		}
		return queueReceiptNotice(tx, receipt, req.Status, action)
	})
	if err != nil {
		return receiptWriteError(c, err)
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
		if receipt.Status == "pendiente" {
			return nil
		}
		receipt.Revision++
		receipt.ReplacementTokenHash = ""
		receipt.ReplacementTokenExpiry = nil
		prevStatus = receipt.Status
		receipt.Status = "pendiente"
		receipt.VerifiedByID = nil
		receipt.VerifiedAt = nil
		receipt.RejectionReason = ""
		if err := persistReceiptStatus(tx, &receipt); err != nil {
			return err
		}
		return queueReceiptNotice(tx, receipt, "revertido", "")
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

// ReplacementInfo validates a credential from the rejection email. The token
// travels in a POST body, never an access-log URL or a public storage link.
func (h *PaymentReceiptHandler) ReplacementInfo(c echo.Context) error {
	var req struct {
		Token string `json:"token"`
	}
	if c.Bind(&req) != nil || req.Token == "" {
		return c.JSON(403, map[string]string{"error": "El enlace no es válido o caducó."})
	}
	var r models.PaymentReceipt
	if err := h.DB.Where("id = ? AND status = ? AND replacement_token_hash = ? AND replacement_token_expiry > ?", c.Param("id"), "rechazado", auth.HashToken(req.Token), time.Now()).First(&r).Error; err != nil {
		return c.JSON(403, map[string]string{"error": "El enlace no es válido o caducó."})
	}
	return c.JSON(200, map[string]interface{}{"payer_name": r.PayerName, "payer_email": r.PayerEmail, "amount": r.Amount, "purpose": r.Purpose, "event_id": r.EventID, "rejection_reason": r.RejectionReason})
}
func (h *PaymentReceiptHandler) Resubmit(c echo.Context) error {
	var req struct {
		Token     string `json:"token"`
		Reference string `json:"receipt_image_url"`
		Bank      string `json:"bank_name"`
		Number    string `json:"reference_number"`
	}
	if c.Bind(&req) != nil || req.Token == "" {
		return c.JSON(403, map[string]string{"error": "El enlace no es válido o caducó."})
	}
	if _, ok := storage.ReceiptKey(req.Reference); !ok || len(req.Bank) > 100 || len(req.Number) > 100 {
		return c.JSON(400, map[string]string{"error": "Sube un comprobante válido."})
	}
	if h.store == nil {
		return c.JSON(503, map[string]string{"error": "El almacenamiento privado no está disponible."})
	}
	file, _, err := h.store.OpenReceipt(c.Request().Context(), req.Reference)
	if err != nil {
		return c.JSON(400, map[string]string{"error": "Vuelve a subir el archivo privado."})
	}
	file.Close()
	data, _ := json.Marshal(req)
	sum := sha256.Sum256(data)
	requestHash := hex.EncodeToString(sum[:])
	replayed := false
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		var r models.PaymentReceipt
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", c.Param("id")).First(&r).Error; err != nil {
			return echo.NewHTTPError(403, "El enlace no es válido, ya se utilizó o caducó.")
		}
		tokenHash := auth.HashToken(req.Token)
		if r.ConsumedReplacementHash == tokenHash && r.ReplacementRequestHash == requestHash && r.ConsumedReplacementExpiry != nil && r.ConsumedReplacementExpiry.After(time.Now()) {
			replayed = true
			return nil
		}
		if r.Status != "rechazado" || r.ReplacementTokenHash != tokenHash || r.ReplacementTokenExpiry == nil || !r.ReplacementTokenExpiry.After(time.Now()) {
			return echo.NewHTTPError(403, "El enlace no es válido, ya se utilizó o caducó.")
		}
		r.ConsumedReplacementHash = tokenHash
		r.ReplacementRequestHash = requestHash
		r.ConsumedReplacementExpiry = r.ReplacementTokenExpiry
		if err := reserveReceipt(tx, req.Reference, r.ID); err != nil {
			return err
		}
		r.ReceiptImageURL = req.Reference
		r.BankName = req.Bank
		r.ReferenceNumber = req.Number
		r.Status = "pendiente"
		r.Revision++
		r.RejectionReason = ""
		r.VerifiedByID = nil
		r.VerifiedAt = nil
		r.ReplacementTokenHash = ""
		r.ReplacementTokenExpiry = nil
		if err := persistReceiptStatus(tx, &r); err != nil {
			return err
		}
		return queueReceiptNotice(tx, r, "pendiente", "")
	})
	if err != nil {
		return receiptWriteError(c, err)
	}
	if replayed {
		return c.JSON(200, map[string]string{"message": "Ya recibimos esta corrección. Consulta la última actualización por correo."})
	}
	return c.JSON(200, map[string]string{"message": "Recibimos la corrección. El pago vuelve a estar pendiente de revisión."})
}

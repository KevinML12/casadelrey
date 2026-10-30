package handlers

import (
	"casadelrey/backend/email"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"casadelrey/backend/models"
	"casadelrey/backend/storage"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var donationKeyPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{16,128}$`)
var errDonationKeyConflict = errors.New("donation idempotency conflict")

// DonationHandler maneja el registro local de donaciones.
type DonationHandler struct {
	DB    *gorm.DB
	store storage.ReceiptStore
}

func NewDonationHandler(db *gorm.DB, stores ...storage.Store) *DonationHandler {
	h := &DonationHandler{DB: db}
	if len(stores) > 0 {
		h.store, _ = stores[0].(storage.ReceiptStore)
	}
	return h
}

// RegisterDonation POST /api/v1/donations/register
// Registra la intención de donación con método de pago local.
func (h *DonationHandler) RegisterDonation(c echo.Context) error {
	var req struct {
		Name             string  `json:"name"`
		Email            string  `json:"email"`
		Amount           float64 `json:"amount"`
		Currency         string  `json:"currency"`
		PaymentMethod    string  `json:"payment_method"`
		PaymentReference string  `json:"payment_reference"`
		ReceiptURL       string  `json:"receipt_url"`
		DonationPurpose  string  `json:"donation_purpose"`
		Receipt          *struct {
			PayerPhone      string `json:"payer_phone"`
			BankName        string `json:"bank_name"`
			ReferenceNumber string `json:"reference_number"`
			ReceiptImageURL string `json:"receipt_image_url"`
		} `json:"receipt"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos."})
	}

	if !validMoney(req.Amount) || req.Amount < 10 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El monto mínimo es Q10."})
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = normalizeEmail(req.Email)
	if req.Email != "" && !email.ValidAddress(req.Email) {
		return c.JSON(400, map[string]string{"error": "Revisa tu correo electrónico."})
	}
	if req.Name == "" || len(req.Name) > 100 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El nombre es obligatorio."})
	}

	// Tigo Money removido (13 jul 2026, decisión del usuario) — solo
	// transferencia/depósito bancario o en persona. Los registros viejos
	// con tigo_money quedan en la DB; solo se rechaza para NUEVAS.
	validMethods := map[string]bool{
		"transferencia": true,
		"presencial":    true,
	}
	if req.PaymentMethod == "" || !validMethods[req.PaymentMethod] {
		req.PaymentMethod = "presencial"
	}

	currency := "GTQ"
	if req.Currency != "" && req.Currency != "GTQ" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "La moneda debe ser GTQ."})
	}

	donation := models.Donation{
		Name:             req.Name,
		Email:            req.Email,
		Amount:           req.Amount,
		Currency:         currency,
		PaymentMethod:    req.PaymentMethod,
		PaymentReference: req.PaymentReference,
		ReceiptURL:       req.ReceiptURL,
		IsSuccessful:     false,
		DonationPurpose:  req.DonationPurpose,
	}

	if req.Receipt != nil && (req.PaymentMethod != "transferencia" || req.Receipt.ReceiptImageURL == "") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El comprobante debe corresponder a una transferencia y tener una imagen."})
	}
	if req.Receipt != nil && !email.ValidAddress(req.Email) {
		return c.JSON(400, map[string]string{"error": "Ingresa tu correo para recibir la revisión del pago."})
	}
	if req.Receipt != nil {
		if h.store == nil {
			return c.JSON(503, map[string]string{"error": "El almacenamiento privado no está disponible."})
		}
		f, _, err := h.store.OpenReceipt(c.Request().Context(), req.Receipt.ReceiptImageURL)
		if err != nil {
			return c.JSON(400, map[string]string{"error": "Vuelve a subir el archivo privado."})
		}
		f.Close()
		if _, ok := storage.ReceiptKey(req.Receipt.ReceiptImageURL); !ok {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Sube el comprobante mediante el formulario antes de enviarlo."})
		}
	}
	if req.ReceiptURL != "" {
		if _, ok := storage.ReceiptKey(req.ReceiptURL); !ok {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Sube el comprobante mediante el formulario antes de enviarlo."})
		}
	}
	key := c.Request().Header.Get("Idempotency-Key")
	if key == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "No se pudo identificar el envío. Vuelve a iniciar la donación."})
	}
	if key != "" {
		if !donationKeyPattern.MatchString(key) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Clave de envío inválida."})
		}
		keySum := sha256.Sum256([]byte(key))
		storedKey := hex.EncodeToString(keySum[:])
		donation.IdempotencyKey = &storedKey
		req.Currency = currency
		data, err := json.Marshal(req)
		if err != nil {
			return err
		}
		sum := sha256.Sum256(data)
		donation.RequestHash = hex.EncodeToString(sum[:])
	}
	replayed := false
	if err := h.DB.Transaction(func(tx *gorm.DB) error {
		insert := tx
		if donation.IdempotencyKey != nil {
			insert = insert.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "idempotency_key"}}, DoNothing: true})
		}
		result := insert.Create(&donation)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 && donation.IdempotencyKey != nil {
			var existing models.Donation
			if err := tx.Unscoped().Where("idempotency_key = ?", *donation.IdempotencyKey).First(&existing).Error; err != nil {
				return err
			}
			if existing.DeletedAt.Valid || existing.RequestHash != donation.RequestHash {
				return errDonationKeyConflict
			}
			donation = existing
			replayed = true
			return nil
		}
		if req.DonationPurpose != "" {
			var n int64
			if err := tx.Model(&models.DonationPurpose{}).Where("value = ? AND is_active = ?", req.DonationPurpose, true).Count(&n).Error; err != nil {
				return err
			}
			if n != 1 {
				return echo.NewHTTPError(400, "Selecciona un destino de donación activo.")
			}
		}
		if req.Receipt != nil {
			if err := reserveReceipt(tx, req.Receipt.ReceiptImageURL, 0); err != nil {
				return err
			}
			receipt := models.PaymentReceipt{
				PayerName: req.Name, PayerEmail: req.Email, PayerPhone: req.Receipt.PayerPhone,
				Amount: req.Amount, Currency: "GTQ", BankName: req.Receipt.BankName,
				ReferenceNumber: req.Receipt.ReferenceNumber, ReceiptImageURL: req.Receipt.ReceiptImageURL,
				Purpose: "donacion", DonationID: &donation.ID, Status: "pendiente",
			}
			if err := tx.Create(&receipt).Error; err != nil {
				return err
			}
			donation.ReceiptID = &receipt.ID
			if err := tx.Model(&donation).Update("receipt_id", receipt.ID).Error; err != nil {
				return err
			}
			return queueReceiptNotice(tx, receipt, "pendiente", "")
		}
		return email.Enqueue(tx, email.Message{Key: fmt.Sprintf("donation:%d:received", donation.ID), Kind: "donation_intent", To: donation.Email, Subject: "Donación registrada — Casa del Rey", HTML: email.GetPaymentUpdateTemplate(donation.Name, "Donación", "presencial", donation.Amount, "", "")})
	}); err != nil {
		var he *echo.HTTPError
		if errors.As(err, &he) {
			return c.JSON(he.Code, map[string]interface{}{"error": he.Message})
		}
		if errors.Is(err, errDonationKeyConflict) {
			return c.JSON(http.StatusConflict, map[string]string{"error": "Este envío ya fue utilizado con otros datos. Inicia una nueva donación."})
		}
		log.Printf("[Donation] Error al registrar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo registrar la donación."})
	}

	status := http.StatusCreated
	if replayed {
		status = http.StatusOK
	}

	return c.JSON(status, map[string]interface{}{
		"message": "¡Donación registrada! Un coordinador confirmará el proceso.",
		"id":      donation.ID,
	})
}

// ConfirmCash records a handover; it never moves money or verifies a transfer.
func (h *DonationHandler) ConfirmCash(c echo.Context) error {
	var req struct {
		Received *bool `json:"received"`
	}
	if err := c.Bind(&req); err != nil || req.Received == nil {
		return c.JSON(400, map[string]string{"error": "Indica si el aporte fue recibido."})
	}
	var donation models.Donation
	adminID, _ := c.Get("user_id").(uint)
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&donation, c.Param("id")).Error; err != nil {
			return err
		}
		if donation.PaymentMethod != "presencial" || donation.ReceiptID != nil {
			return echo.NewHTTPError(400, "Los depósitos se confirman desde Comprobantes.")
		}
		if donation.IsSuccessful == *req.Received {
			return nil
		}
		donation.IsSuccessful = *req.Received
		donation.Revision++
		donation.ConfirmedByID = nil
		donation.ConfirmedAt = nil
		state := "presencial_revertida"
		if *req.Received {
			now := time.Now()
			donation.ConfirmedAt = &now
			donation.ConfirmedByID = &adminID
			state = "presencial_recibida"
		}
		if err := tx.Save(&donation).Error; err != nil {
			return err
		}
		return email.Enqueue(tx, email.Message{Key: fmt.Sprintf("donation:%d:%d:%s", donation.ID, donation.Revision, state), Kind: "donation_" + state, To: donation.Email, Subject: "Tu donación — Casa del Rey", HTML: email.GetPaymentUpdateTemplate(donation.Name, "Donación", state, donation.Amount, "", "")})
	})
	if err != nil {
		return receiptWriteError(c, err)
	}
	return c.JSON(200, donation)
}

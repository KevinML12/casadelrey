package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"

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
	DB *gorm.DB
}

func NewDonationHandler(db *gorm.DB) *DonationHandler {
	return &DonationHandler{DB: db}
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

	if req.Amount < 10 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El monto mínimo es Q10."})
	}
	if req.Name == "" {
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
	if req.Receipt != nil {
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
		if req.Receipt != nil {
			receipt := models.PaymentReceipt{
				PayerName: req.Name, PayerEmail: req.Email, PayerPhone: req.Receipt.PayerPhone,
				Amount: req.Amount, Currency: "GTQ", BankName: req.Receipt.BankName,
				ReferenceNumber: req.Receipt.ReferenceNumber, ReceiptImageURL: req.Receipt.ReceiptImageURL,
				Purpose: "donacion", DonationID: &donation.ID, Status: "pendiente",
			}
			if err := tx.Create(&receipt).Error; err != nil {
				return err
			}
			return tx.Model(&donation).Update("receipt_id", receipt.ID).Error
		}
		return nil
	}); err != nil {
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

package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
)

// paypalBaseURL devuelve la URL base de la API PayPal (sandbox o live).
func paypalBaseURL() string {
	if os.Getenv("PAYPAL_MODE") == "live" {
		return "https://api-m.paypal.com"
	}
	return "https://api-m.sandbox.paypal.com"
}

// paypalAccessToken obtiene un token OAuth2 de PayPal.
func paypalAccessToken(client *http.Client) (string, error) {
	clientID := os.Getenv("PAYPAL_CLIENT_ID")
	clientSecret := os.Getenv("PAYPAL_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		return "", fmt.Errorf("PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET son requeridos")
	}

	auth := base64.StdEncoding.EncodeToString([]byte(clientID + ":" + clientSecret))
	req, err := http.NewRequest("POST", paypalBaseURL()+"/v1/oauth2/token", strings.NewReader("grant_type=client_credentials"))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("PayPal OAuth: %s", string(body))
	}

	var tok struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &tok); err != nil {
		return "", err
	}
	return tok.AccessToken, nil
}

// CreatePayPalOrder crea una orden en PayPal y guarda los datos en BD.
// POST /api/v1/donations/create-paypal-order
func (h *DonationHandler) CreatePayPalOrder(c echo.Context) error {
	type Request struct {
		Amount          float64 `json:"amount"`
		Currency        string  `json:"currency"`
		Name            string  `json:"name"`
		Email           string  `json:"email"`
		DonationPurpose string  `json:"donation_purpose"`
	}

	req := new(Request)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos."})
	}

	if req.Amount < 10 || req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "El monto mínimo es Q10 y el nombre es obligatorio.",
		})
	}

	currency := "GTQ"
	if req.Currency != "" {
		currency = strings.ToUpper(req.Currency)
	}

	// PayPal: GTQ soportado en Guatemala. Si falla, se puede cambiar a USD.
	amountStr := fmt.Sprintf("%.2f", req.Amount)

	client := &http.Client{Timeout: 15 * time.Second}
	token, err := paypalAccessToken(client)
	if err != nil {
		log.Printf("[PayPal] Error OAuth: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo conectar con PayPal. Verifica la configuración.",
		})
	}

	origin := os.Getenv("CLIENT_URL")
	if origin == "" {
		origin = "http://localhost:5173"
	}
	returnURL := strings.TrimSuffix(origin, "/") + "/payment-success?payment_method=paypal"
	cancelURL := strings.TrimSuffix(origin, "/") + "/donate"

	orderBody := map[string]interface{}{
		"intent": "CAPTURE",
		"purchase_units": []map[string]interface{}{
			{
				"amount": map[string]string{
					"currency_code": currency,
					"value":         amountStr,
				},
				"description": "Donación - Casa del Rey",
			},
		},
		"application_context": map[string]string{
			"return_url": returnURL,
			"cancel_url": cancelURL,
			"brand_name": "Casa del Rey",
		},
	}
	bodyBytes, _ := json.Marshal(orderBody)

	httpReq, err := http.NewRequest("POST", paypalBaseURL()+"/v2/checkout/orders", bytes.NewReader(bodyBytes))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear la orden."})
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("[PayPal] Error crear orden: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al conectar con PayPal."})
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("[PayPal] Respuesta crear orden: %s", string(respBody))
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "PayPal rechazó la orden. Revisa el monto y la moneda.",
		})
	}

	var orderResp struct {
		ID    string `json:"id"`
		Links []struct {
			Href   string `json:"href"`
			Rel    string `json:"rel"`
			Method string `json:"method"`
		} `json:"links"`
	}
	if err := json.Unmarshal(respBody, &orderResp); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al procesar la respuesta de PayPal."})
	}

	var approvalURL string
	for _, l := range orderResp.Links {
		if l.Rel == "approve" {
			approvalURL = l.Href
			break
		}
	}
	if approvalURL == "" {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "PayPal no devolvió URL de aprobación."})
	}

	// Guardar en BD para recuperar al capturar
	po := models.PayPalOrder{
		OrderID:   orderResp.ID,
		Name:      req.Name,
		Email:     req.Email,
		Amount:    req.Amount,
		Currency:  currency,
		Purpose:   req.DonationPurpose,
		CreatedAt: time.Now(),
	}
	if result := h.DB.Create(&po); result.Error != nil {
		log.Printf("[PayPal] Error guardar orden: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al registrar la orden."})
	}

	log.Printf("[PayPal] Orden creada: %s → %s %.2f", orderResp.ID, currency, req.Amount)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"order_id":     orderResp.ID,
		"approval_url": approvalURL,
	})
}

// CapturePayPalOrder captura una orden aprobada y registra la donación.
// POST /api/v1/donations/capture-paypal-order
func (h *DonationHandler) CapturePayPalOrder(c echo.Context) error {
	type Request struct {
		OrderID string `json:"order_id"`
	}

	req := new(Request)
	if err := c.Bind(req); err != nil || req.OrderID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Se requiere order_id."})
	}

	// Obtener datos guardados
	var po models.PayPalOrder
	if result := h.DB.Where("order_id = ?", req.OrderID).First(&po); result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Orden no encontrada o ya capturada."})
	}

	client := &http.Client{Timeout: 15 * time.Second}
	token, err := paypalAccessToken(client)
	if err != nil {
		log.Printf("[PayPal] Error OAuth: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al conectar con PayPal."})
	}

	httpReq, err := http.NewRequest("POST", paypalBaseURL()+"/v2/checkout/orders/"+req.OrderID+"/capture", nil)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al capturar."})
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("[PayPal] Error capturar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al conectar con PayPal."})
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("[PayPal] Respuesta captura: %s", string(respBody))
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "No se pudo capturar el pago. La orden puede haber expirado.",
		})
	}

	// Verificar idempotencia
	var existing models.Donation
	if result := h.DB.Where("transaction_id = ?", req.OrderID).First(&existing); result.Error == nil {
		h.DB.Delete(&po)
		return c.JSON(http.StatusOK, map[string]interface{}{
			"success": true,
			"message": "Donación ya registrada.",
		})
	}

	donation := models.Donation{
		Name:            po.Name,
		Email:           po.Email,
		Amount:          po.Amount,
		Currency:        po.Currency,
		PaymentMethod:   "paypal",
		TransactionID:   req.OrderID,
		IsSuccessful:    true,
		DonationPurpose: po.Purpose,
	}
	if result := h.DB.Create(&donation); result.Error != nil {
		log.Printf("[PayPal] Error guardar donación: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al registrar la donación."})
	}

	h.DB.Delete(&po)
	log.Printf("[PayPal] ✓ Donación registrada: %s — %s %.2f", donation.Name, donation.Currency, donation.Amount)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "¡Donación registrada con éxito! Gracias por tu generosidad.",
	})
}

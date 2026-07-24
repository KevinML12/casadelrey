package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"casadelrey/backend/config"
)

const brevoSendURL = "https://api.brevo.com/v3/smtp/email"

type brevoContact struct {
	Name  string `json:"name,omitempty"`
	Email string `json:"email"`
}

type brevoSendRequest struct {
	Sender      brevoContact   `json:"sender"`
	To          []brevoContact `json:"to"`
	Subject     string         `json:"subject"`
	HTMLContent string         `json:"htmlContent"`
}

// SendEmail envía un correo electrónico usando la API transaccional de Brevo.
func SendEmail(to, subject, htmlContent string) error {
	if config.AppConfig.BrevoKey == "" {
		log.Println("Advertencia: BREVO_API_KEY no está configurada, el email no se enviará")
		return fmt.Errorf("Brevo no configurado")
	}

	body, err := json.Marshal(brevoSendRequest{
		Sender:      brevoContact{Name: "Casa del Rey", Email: "noreply@casadelreyhue.org"},
		To:          []brevoContact{{Email: to}},
		Subject:     subject,
		HTMLContent: htmlContent,
	})
	if err != nil {
		return fmt.Errorf("error al preparar el correo: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, brevoSendURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("error al crear la solicitud: %w", err)
	}
	req.Header.Set("accept", "application/json")
	req.Header.Set("content-type", "application/json")
	req.Header.Set("api-key", config.AppConfig.BrevoKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Error al enviar email a %s: %v", to, err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("Email enviado exitosamente a %s (Status: %d)", to, resp.StatusCode)
		return nil
	}

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("Error al enviar email a %s (Status: %d, Body: %s)", to, resp.StatusCode, respBody)
	return fmt.Errorf("error al enviar email: status %d", resp.StatusCode)
}

// SendEmailAsync envía un email de forma asíncrona
func SendEmailAsync(to, subject, htmlContent string) {
	go func() {
		if err := SendEmail(to, subject, htmlContent); err != nil {
			log.Printf("Error en envío asíncrono de email: %v", err)
		}
	}()
}

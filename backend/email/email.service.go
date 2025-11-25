package email

import (
	"fmt"
	"log"

	"casa-del-rey/backend/config"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

// SendEmail envía un correo electrónico usando SendGrid
func SendEmail(to, subject, htmlContent string) error {
	// Validar que SendGrid esté configurado
	if config.AppConfig.SendGridKey == "" {
		log.Println("Advertencia: SENDGRID_API_KEY no está configurada, el email no se enviará")
		return fmt.Errorf("SendGrid no configurado")
	}

	// Configurar el remitente
	from := mail.NewEmail("Casa del Rey", "noreply@casadelrey.com")
	toEmail := mail.NewEmail("", to)

	// Crear el mensaje
	message := mail.NewSingleEmail(from, subject, toEmail, "", htmlContent)

	// Enviar el email
	client := sendgrid.NewSendClient(config.AppConfig.SendGridKey)
	response, err := client.Send(message)

	if err != nil {
		log.Printf("Error al enviar email a %s: %v", to, err)
		return err
	}

	// Log del resultado
	if response.StatusCode >= 200 && response.StatusCode < 300 {
		log.Printf("Email enviado exitosamente a %s (Status: %d)", to, response.StatusCode)
	} else {
		log.Printf("Error al enviar email a %s (Status: %d, Body: %s)", to, response.StatusCode, response.Body)
		return fmt.Errorf("error al enviar email: status %d", response.StatusCode)
	}

	return nil
}

// SendEmailAsync envía un email de forma asíncrona
func SendEmailAsync(to, subject, htmlContent string) {
	go func() {
		if err := SendEmail(to, subject, htmlContent); err != nil {
			log.Printf("Error en envío asíncrono de email: %v", err)
		}
	}()
}

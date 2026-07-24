package email

import (
	"fmt"
	"strings"

	"casadelrey/backend/config"
)

// Paleta y logo compartidos con el sitio (frontend/src/index.css: --bg,
// --ink, --celeste). Los clientes de correo no soportan backdrop-filter,
// así que el material "liquid glass" se aproxima con una tarjeta blanca
// sólida flotando sobre el fondo navy -- mismo efecto que .glass-light
// en el sitio, sin el blur.
const (
	brandNavy    = "#0A1526"
	brandInk     = "#FFFFFF"
	brandCeleste = "#3B82F6"
	brandLogoURL = "https://casadelreyhue.vercel.app/logo.png"
	emailFont    = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
)

func baseURL() string {
	if config.AppConfig != nil && config.AppConfig.ClientURL != "" {
		return config.AppConfig.ClientURL
	}
	return "https://casadelreyhue.org"
}

// emailShell envuelve el contenido de cada plantilla en el mismo marco
// visual del sitio: canvas navy + tarjeta blanca centrada con esquinas
// redondeadas + chip del logo arriba + pie de página uniforme.
func emailShell(title, bodyHTML string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>%s</title>
</head>
<body style="margin:0;padding:0;background-color:%s;font-family:%s;">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color:%s;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

<tr><td align="center" style="padding-bottom:24px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td
    style="width:56px;height:56px;background-color:%s;border-radius:16px;" align="center" valign="middle">
    <img src="%s" width="34" height="34" alt="Casa del Rey" style="display:block;">
  </td></tr></table>
</td></tr>

<tr><td style="background-color:%s;border-radius:24px;padding:36px 32px;box-shadow:0 24px 50px -20px rgba(0,0,0,0.35);">
  <div style="width:36px;height:4px;background-color:%s;border-radius:2px;margin-bottom:22px;"></div>
  <div style="color:%s;font-family:%s;font-size:15px;line-height:1.65;">
    %s
  </div>
</td></tr>

<tr><td align="center" style="padding-top:28px;">
  <p style="margin:0;color:#ffffff99;font-family:%s;font-size:12px;line-height:1.6;">
    Casa del Rey · Huehuetenango<br>
    Correo automático, por favor no respondas a este mensaje.
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`, title, brandNavy, emailFont, brandNavy, brandNavy, brandLogoURL, brandInk, brandCeleste, brandNavy, emailFont, bodyHTML, emailFont)
}

// emailButton es el CTA de pill sapphire, igual al de los botones "filled"
// del sitio (rounded-full, bg celeste, texto blanco, bold).
func emailButton(label, url string) string {
	return fmt.Sprintf(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td
    style="background-color:%s;border-radius:999px;" align="center">
    <a href="%s" style="display:inline-block;padding:14px 30px;color:#FFFFFF;text-decoration:none;font-family:%s;font-weight:700;font-size:15px;">%s</a>
  </td></tr></table>`, brandCeleste, url, emailFont, label)
}

// emailNote es el aviso secundario (expiración, motivo de rechazo, etc.) --
// mismo tratamiento visual que los "chips" suaves del sitio.
func emailNote(text string) string {
	return fmt.Sprintf(`<div style="background-color:%s0d;border-left:3px solid %s;border-radius:8px;padding:12px 16px;margin:18px 0;color:%s;font-family:%s;font-size:14px;">%s</div>`,
		brandCeleste, brandCeleste, brandNavy, emailFont, text)
}

func h1(text string) string {
	return fmt.Sprintf(`<h1 style="margin:0 0 14px;color:%s;font-family:%s;font-size:22px;font-weight:800;letter-spacing:-0.01em;">%s</h1>`, brandNavy, emailFont, text)
}

// GetWelcomeTemplate devuelve la plantilla HTML de bienvenida
func GetWelcomeTemplate(name string) string {
	body := h1("¡Bienvenido a Casa del Rey!") + fmt.Sprintf(`
<p style="margin:0 0 12px;">Hola, %s</p>
<p style="margin:0 0 12px;">Gracias por unirte a nuestra comunidad. Estamos emocionados de tenerte con nosotros.</p>
<p style="margin:0;">Tu cuenta ya está activa y puedes acceder a todos nuestros servicios.</p>
%s`, name, emailButton("Visitar el sitio", baseURL()))
	return emailShell("Bienvenido a Casa del Rey", body)
}

// GetVerificationEmailTemplate devuelve la plantilla HTML para verificación de correo
func GetVerificationEmailTemplate(name, token string) string {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", baseURL(), token)
	body := h1("Verifica tu correo") + fmt.Sprintf(`
<p style="margin:0 0 12px;">Hola, %s</p>
<p style="margin:0;">Gracias por registrarte en Casa del Rey. Para activar tu cuenta, confirma tu correo:</p>
%s
%s
<p style="margin:14px 0 0;font-size:13px;color:%s99;">Si el botón no funciona, copia este enlace:<br><span style="word-break:break-all;color:%s;">%s</span></p>`,
		name, emailButton("Verificar mi correo", verifyURL),
		emailNote("Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo."),
		brandNavy, brandCeleste, verifyURL)
	return emailShell("Verifica tu correo — Casa del Rey", body)
}

// GetPasswordResetTemplate devuelve la plantilla HTML para reseteo de contraseña
func GetPasswordResetTemplate(token string) string {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", baseURL(), token)
	body := h1("Recuperación de contraseña") + fmt.Sprintf(`
<p style="margin:0;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Crea una nueva contraseña:</p>
%s
%s
<p style="margin:14px 0 0;font-size:13px;color:%s99;">Si el botón no funciona, copia este enlace:<br><span style="word-break:break-all;color:%s;">%s</span></p>`,
		emailButton("Restablecer contraseña", resetURL),
		emailNote("Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo."),
		brandNavy, brandCeleste, resetURL)
	return emailShell("Recuperación de contraseña — Casa del Rey", body)
}

// GetReceiptVerifiedTemplate devuelve la plantilla HTML para cuando un
// comprobante bancario fue APROBADO -- ver payment_receipt.handler.go Verify.
func GetReceiptVerifiedTemplate(name string, amount float64) string {
	body := h1("¡Comprobante verificado!") + fmt.Sprintf(`
<p style="margin:0 0 12px;">Hola, %s</p>
<p style="margin:0;">Confirmamos que tu comprobante por <strong>Q%.2f</strong> fue verificado correctamente. ¡Gracias!</p>`,
		name, amount)
	return emailShell("Comprobante verificado — Casa del Rey", body)
}

// GetReceiptRejectedTemplate devuelve la plantilla HTML para cuando un
// comprobante bancario fue RECHAZADO -- ver payment_receipt.handler.go Verify.
func GetReceiptRejectedTemplate(name string, amount float64, reason string) string {
	reasonHTML := ""
	if reason != "" {
		reasonHTML = emailNote(fmt.Sprintf("<strong>Motivo:</strong> %s", reason))
	}
	body := h1("No pudimos verificar tu comprobante") + fmt.Sprintf(`
<p style="margin:0 0 12px;">Hola, %s</p>
<p style="margin:0;">Tu comprobante por <strong>Q%.2f</strong> no pudo ser verificado.</p>
%s
<p style="margin:12px 0 0;">Por favor revisa los datos y sube el comprobante nuevamente, o contáctanos si crees que fue un error.</p>`,
		name, amount, reasonHTML)
	return emailShell("Comprobante rechazado — Casa del Rey", body)
}

// GetWeeklyPetitionsDigestTemplate arma el correo semanal para los
// intercesores (líderes y admins) con las peticiones de la semana en curso.
func GetWeeklyPetitionsDigestTemplate(weekStart, weekEnd string, petitions []struct {
	Name    string
	Subject string
	Message string
}) string {
	var rows strings.Builder
	if len(petitions) == 0 {
		rows.WriteString(fmt.Sprintf(`<p style="margin:0;color:%s99;">No hubo peticiones esta semana.</p>`, brandNavy))
	}
	for _, p := range petitions {
		rows.WriteString(fmt.Sprintf(`
<div style="background-color:%s08;border-left:3px solid %s;border-radius:10px;padding:14px 16px;margin-bottom:10px;">
  <p style="margin:0 0 4px;font-weight:700;color:%s;">%s <span style="font-weight:400;color:%s99;">· %s</span></p>
  <p style="margin:0;color:%s;">%s</p>
</div>`, brandCeleste, brandCeleste, brandNavy, p.Name, brandNavy, p.Subject, brandNavy, p.Message))
	}

	body := h1("Peticiones de oración") + fmt.Sprintf(`
<p style="margin:0 0 18px;color:%s99;">%s — %s</p>
<p style="margin:0 0 14px;">Para orar e interceder esta semana:</p>
%s`, brandNavy, weekStart, weekEnd, rows.String())
	return emailShell("Peticiones de la semana — Casa del Rey", body)
}

// GetPetitionConfirmationTemplate devuelve la plantilla HTML de confirmación de petición
func GetPetitionConfirmationTemplate(name string) string {
	body := h1("Petición recibida") + fmt.Sprintf(`
<p style="margin:0 0 12px;">Hola, %s</p>
<p style="margin:0 0 12px;">Hemos recibido tu petición de oración y queremos que sepas que estamos orando por ti.</p>
<p style="margin:0;">Que Dios te bendiga abundantemente.</p>`, name)
	return emailShell("Petición recibida — Casa del Rey", body)
}

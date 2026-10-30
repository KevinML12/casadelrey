package email

import (
	"fmt"
	"html"
	"net/url"
	"strings"
	"time"

	"casadelrey/backend/config"
)

// Email-safe interpretation of the site's photographic glass surfaces.
// Inline colors and solid fallbacks keep the message readable without blur,
// background images, custom fonts or client-side code.
const (
	brandNavy    = "#0A1526" // --bg / tinta
	brandInk     = "#FFFFFF" // --ink
	brandCeleste = "#3B82F6" // --celeste
	brandPaper   = "#F2F5FA" // bg-paper -- canvas del panel admin/líder
	brandLogoURL = "https://casadelreyhue.vercel.app/logo.png"
	emailFont    = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

	// El "bisel" de vidrio real de .glass-light (index.css) -- luz superior
	// izquierda, sombra tenue inferior derecha, hairline superior, realce
	// inferior, y elevación externa. Sin backdrop-filter (no hay nada que
	// desenfocar detrás en un correo) pero el relieve es el mismo -- así
	// se ven las cards del panel sobre su propio canvas claro.
	glassCardShadow = "inset 0 1px 0 rgba(255,255,255,0.95),inset 0 -1px 0 rgba(10,21,38,0.10),0 14px 32px rgba(10,21,38,0.14)"

	// shadow-card de tailwind.config.js -- el mismo que usa el botón
	// "filled" (Button.jsx) del panel: navy relleno, texto blanco.
	buttonShadow = "0 12px 36px -12px rgba(10,21,38,0.18),0 2px 6px rgba(10,21,38,0.08)"
)

func baseURL() string {
	if config.AppConfig != nil && config.AppConfig.ClientURL != "" {
		return strings.TrimRight(config.AppConfig.ClientURL, "/")
	}
	return "https://casadelreyhue.vercel.app"
}

// One white card over an administrator-managed community photograph.
func emailShell(title, bodyHTML string) string {
	return fmt.Sprintf(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>%s</title>
<style>@media(max-width:600px){.email-outside{padding:24px 12px!important}.email-content{padding:26px 20px!important}.email-scenery{height:72px!important}.email-action{display:block!important;text-align:center!important}}</style></head>
<body style="margin:0;background:#0A1526;font-family:%s;color:#0A1526">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">%s</div>
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#0A1526"><tr><td class="email-outside" align="center" style="padding:40px 20px">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px"><tr><td background="__CDR_EMAIL_BG__" style="background-color:#17243A;background-image:linear-gradient(rgba(10,21,38,.25),rgba(10,21,38,.65)),url('__CDR_EMAIL_BG__');background-position:center;background-size:cover;border-radius:16px;padding:24px 16px;border:1px solid #596476">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:12px;background:#0A1526;padding:10px;border:1px solid #798293"><img src="%s/logo.png" width="42" height="42" alt="Casa del Rey" style="display:block;object-fit:contain"></td></tr></table></td></tr>
<tr><td class="email-scenery" height="104" style="height:104px;font-size:1px;line-height:1px">&nbsp;</td></tr>
<tr><td class="email-content" bgcolor="#F2F5FA" style="background-color:#F2F5FA;background-color:rgba(242,245,250,.94);border:1px solid #FFFFFF;border-radius:16px;box-shadow:%s;padding:30px 28px;font-family:%s;font-size:16px;line-height:1.65;color:#0A1526;overflow-wrap:anywhere;word-break:break-word">%s</td></tr>
<tr><td align="center" style="padding:22px 12px 4px;color:#FFFFFF;font-size:12px;line-height:1.7">Casa del Rey · Huehuetenango<br>Notificación de tu solicitud o cuenta.<br><a href="%s" style="color:#FFFFFF;text-decoration:underline">Visitar Casa del Rey</a></td></tr>
</table></td></tr></table></td></tr></table></body></html>`, html.EscapeString(title), emailFont, html.EscapeString(title), html.EscapeString(baseURL()), glassCardShadow, emailFont, bodyHTML, html.EscapeString(baseURL()))
}

// A single high-contrast action, compatible with table-based mail clients.
func emailButton(label, url string) string {
	return fmt.Sprintf(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr><td
    style="background-color:%s;border-radius:12px;box-shadow:%s;" align="center">
    <a class="email-action" href="%s" style="display:inline-block;padding:14px 30px;color:%s;text-decoration:none;font-family:%s;font-weight:700;font-size:15px;">%s</a>
  </td></tr></table>`, brandNavy, buttonShadow, url, brandInk, emailFont, label)
}

// emailNote es el aviso secundario (expiración, motivo de rechazo, etc.).
func emailNote(text string) string {
	return fmt.Sprintf(`<div style="background-color:#3B82F60d;border-left:3px solid %s;border-radius:8px;padding:12px 16px;margin:18px 0;color:%s;font-family:%s;font-size:14px;overflow-wrap:anywhere;word-break:break-word;">%s</div>`,
		brandCeleste, brandNavy, emailFont, text)
}

func h1(text string) string {
	return fmt.Sprintf(`<h1 style="margin:0 0 14px;color:%s;font-family:%s;font-size:22px;font-weight:800;letter-spacing:-0.01em;">%s</h1>`, brandNavy, emailFont, text)
}

// GetWelcomeTemplate devuelve la plantilla HTML de bienvenida
func GetWelcomeTemplate(name string) string {
	name = html.EscapeString(name)
	body := h1("¡Bienvenido a Casa del Rey!") + fmt.Sprintf(`
<p style="margin:0 0 12px;">Hola, %s</p>
<p style="margin:0 0 12px;">Gracias por unirte a nuestra comunidad. Estamos emocionados de tenerte con nosotros.</p>
<p style="margin:0;">Tu cuenta ya está activa y puedes acceder a todos nuestros servicios.</p>
%s`, name, emailButton("Visitar el sitio", baseURL()))
	return emailShell("Bienvenido a Casa del Rey", body)
}

// GetVerificationEmailTemplate devuelve la plantilla HTML para verificación de correo
func GetVerificationEmailTemplate(name, token string) string {
	name = html.EscapeString(name)
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", baseURL(), url.QueryEscape(token))
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
	resetURL := fmt.Sprintf("%s/reset-password/%s", baseURL(), url.PathEscape(token))
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
	name = html.EscapeString(name)
	body := h1("¡Comprobante verificado!") + fmt.Sprintf(`
<p style="margin:0 0 12px;">Hola, %s</p>
<p style="margin:0;">Confirmamos que tu comprobante por <strong>Q%.2f</strong> fue verificado correctamente. ¡Gracias!</p>`,
		name, amount)
	return emailShell("Comprobante verificado — Casa del Rey", body)
}

// GetReceiptRejectedTemplate devuelve la plantilla HTML para cuando un
// comprobante bancario fue RECHAZADO -- ver payment_receipt.handler.go Verify.
func GetReceiptRejectedTemplate(name string, amount float64, reason string) string {
	name = html.EscapeString(name)
	reason = html.EscapeString(reason)
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
</div>`, brandCeleste, brandCeleste, brandNavy, html.EscapeString(p.Name), brandNavy, html.EscapeString(p.Subject), brandNavy, html.EscapeString(p.Message)))
	}

	body := h1("Peticiones de oración") + fmt.Sprintf(`
<p style="margin:0 0 18px;color:%s99;">%s — %s</p>
<p style="margin:0 0 14px;">Para orar e interceder esta semana:</p>
%s`, brandNavy, weekStart, weekEnd, rows.String())
	return emailShell("Peticiones de la semana — Casa del Rey", body)
}

// GetPetitionConfirmationTemplate devuelve la plantilla HTML de confirmación de petición
func GetPetitionConfirmationTemplate(name string) string {
	name = html.EscapeString(name)
	body := h1("Petición recibida") + fmt.Sprintf(`
<p style="margin:0 0 12px;">Hola, %s</p>
<p style="margin:0 0 12px;">Hemos recibido tu petición de oración y queremos que sepas que estamos orando por ti.</p>
<p style="margin:0;">Que Dios te bendiga abundantemente.</p>`, name)
	return emailShell("Petición recibida — Casa del Rey", body)
}

// Financial notifications do not attach receipts or expose storage references.
func GetPaymentUpdateTemplate(name, contextLabel, state string, amount float64, reason, actionURL string) string {
	text := map[string]string{
		"pendiente":            "Recibimos tu comprobante. El pago está pendiente de revisión por el equipo.",
		"verificado":           "El equipo verificó tu pago correctamente.",
		"rechazado":            "No pudimos verificar el comprobante. Puedes corregirlo desde el enlace seguro.",
		"revertido":            "El equipo volvió a poner tu pago en revisión. Todavía no está confirmado.",
		"presencial_recibida":  "El equipo registró la recepción de tu aporte en persona. Gracias por tu generosidad.",
		"presencial_revertida": "El equipo devolvió tu aporte en persona al estado pendiente. Su recepción no está confirmada.",
		"presencial":           "Registramos tu intención de donar en persona. El importe todavía no se considera recibido.",
	}[state]
	body := h1("Actualización de tu pago") + fmt.Sprintf("<p>Hola, %s</p><p>%s</p><p><strong>%s · Q%.2f</strong></p>", html.EscapeString(name), text, html.EscapeString(contextLabel), amount)
	if reason != "" {
		body += emailNote(html.EscapeString(reason))
	}
	if actionURL != "" {
		body += emailButton("Revisar y continuar", html.EscapeString(actionURL))
	}
	return emailShell("Tu pago — Casa del Rey", body)
}
func GetEventRegistrationTemplate(name, title, date, eventTime, location, status string, count int) string {
	state := "Tu inscripción está confirmada."
	if status == "pendiente" {
		state = "Recibimos tu inscripción. El pago está pendiente de revisión; todavía no está confirmado."
	}
	when := date
	if parsed, err := time.Parse("2006-01-02", date); err == nil {
		months := []string{"enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"}
		when = fmt.Sprintf("%d de %s de %d", parsed.Day(), months[int(parsed.Month())-1], parsed.Year())
	}
	if eventTime != "" {
		when += " · " + eventTime
	}
	body := h1("Tu inscripción") + fmt.Sprintf("<p>Hola, %s</p><p>%s</p><p><strong>%s</strong></p><p>%s<br>%s</p><p>Asistentes: %d</p>", html.EscapeString(name), state, html.EscapeString(title), html.EscapeString(when), html.EscapeString(location), count)
	return emailShell("Tu inscripción — Casa del Rey", body+emailButton("Ver eventos", baseURL()+"/events"))
}
func GetCancellationTemplate(token string) string {
	return emailShell("Cancelar inscripción — Casa del Rey", h1("Confirma tu cancelación")+"<p>Copia este código en el formulario del evento. Caduca en 15 minutos y sólo se puede usar una vez.</p>"+emailNote(html.EscapeString(token))+"<p>Si no lo solicitaste, ignora este correo. Cancelar una inscripción no procesa una devolución bancaria.</p>")
}
func GetEventCancelledTemplate(title string) string {
	return emailShell("Inscripción cancelada — Casa del Rey", h1("Inscripción cancelada")+"<p>Se canceló tu inscripción a <strong>"+html.EscapeString(title)+"</strong>.</p><p>Si realizaste un depósito, coordina con el equipo cualquier devolución. Esta cancelación no mueve dinero.</p>")
}

// A controlled delivery check never claims that a payment or registration exists.
func GetServiceCheckTemplate() string {
	return emailShell("Comprobación del servicio — Casa del Rey", h1("El correo de Casa del Rey")+"<p>Esta es una comprobación del servicio de notificaciones.</p><p>No registra donaciones, pagos ni inscripciones. Sirve para revisar la presentación y la recepción del mensaje en este buzón.</p>"+emailButton("Visitar Casa del Rey", baseURL()))
}

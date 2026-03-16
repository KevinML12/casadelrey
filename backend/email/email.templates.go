package email

import (
	"fmt"

	"casadelrey/backend/config"
)

// GetWelcomeTemplate devuelve la plantilla HTML de bienvenida
func GetWelcomeTemplate(name string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Casa del Rey</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4A90E2;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4A90E2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>¡Bienvenido a Casa del Rey!</h1>
    </div>
    <div class="content">
        <h2>Hola, %s</h2>
        <p>Gracias por unirte a nuestra comunidad. Estamos emocionados de tenerte con nosotros.</p>
        <p>Tu cuenta ha sido creada exitosamente y ya puedes acceder a todos nuestros servicios.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <a href="https://casadelrey.com" class="button">Visitar Sitio Web</a>
    </div>
    <div class="footer">
        <p>© 2025 Casa del Rey. Todos los derechos reservados.</p>
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
</body>
</html>
`, name)
}

func baseURL() string {
	if config.AppConfig != nil && config.AppConfig.ClientURL != "" {
		return config.AppConfig.ClientURL
	}
	return "https://casadelreyhue.org"
}

// GetVerificationEmailTemplate devuelve la plantilla HTML para verificación de correo
func GetVerificationEmailTemplate(name, token string) string {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", baseURL(), token)
	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu correo — Casa del Rey</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #27AE60; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #27AE60; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background-color: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header"><h1>Verifica tu correo</h1></div>
    <div class="content">
        <h2>Hola, %s</h2>
        <p>Gracias por registrarte en Casa del Rey. Para activar tu cuenta, haz clic en el botón:</p>
        <a href="%s" class="button">Verificar mi correo</a>
        <div class="warning">
            <strong>Nota:</strong> Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.
        </div>
        <p>Si el botón no funciona, copia este enlace: %s</p>
    </div>
    <div class="footer"><p>© 2025 Casa del Rey. Correo automático.</p></div>
</body>
</html>
`, name, verifyURL, verifyURL)
}

// GetPasswordResetTemplate devuelve la plantilla HTML para reseteo de contraseña
func GetPasswordResetTemplate(token string) string {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", baseURL(), token)

	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #E74C3C;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #E74C3C;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .warning {
            background-color: #FFF3CD;
            border-left: 4px solid #FFC107;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Recuperación de Contraseña</h1>
    </div>
    <div class="content">
        <h2>Solicitud de Cambio de Contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
        <a href="%s" class="button">Restablecer Contraseña</a>
        <div class="warning">
            <strong>Nota de seguridad:</strong> Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este correo.
        </div>
        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #4A90E2;">%s</p>
    </div>
    <div class="footer">
        <p>© 2025 Casa del Rey. Todos los derechos reservados.</p>
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
</body>
</html>
`, resetURL, resetURL)
}

// GetPetitionConfirmationTemplate devuelve la plantilla HTML de confirmación de petición
func GetPetitionConfirmationTemplate(name string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Petición Recibida</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #27AE60;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Petición Recibida</h1>
    </div>
    <div class="content">
        <h2>Hola, %s</h2>
        <p>Hemos recibido tu petición de oración y queremos que sepas que estamos orando por ti.</p>
        <p>Tu petición es importante para nosotros y nuestro equipo estará intercediendo por tu necesidad.</p>
        <p>Que Dios te bendiga abundantemente.</p>
    </div>
    <div class="footer">
        <p>© 2025 Casa del Rey. Todos los derechos reservados.</p>
    </div>
</body>
</html>
`, name)
}

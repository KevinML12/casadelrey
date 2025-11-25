package middleware

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// CustomErrorHandler maneja todos los errores HTTP de forma centralizada
func CustomErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	message := "Error interno del servidor"
	var details interface{}

	// Si ya se envió una respuesta, no hacer nada
	if c.Response().Committed {
		return
	}

	// 1. Manejar errores de Echo HTTP
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		message = fmt.Sprintf("%v", he.Message)
		if he.Internal != nil {
			log.Printf("Error interno: %v", he.Internal)
		}
	} else if validationErrs, ok := err.(validator.ValidationErrors); ok {
		// 2. Manejar errores de validación
		code = http.StatusBadRequest
		message = "Errores de validación"

		// Construir un mapa de errores por campo
		fieldErrors := make(map[string]string)
		for _, fieldErr := range validationErrs {
			fieldName := fieldErr.Field()
			switch fieldErr.Tag() {
			case "required":
				fieldErrors[fieldName] = fmt.Sprintf("%s es requerido", fieldName)
			case "email":
				fieldErrors[fieldName] = fmt.Sprintf("%s debe ser un email válido", fieldName)
			case "min":
				fieldErrors[fieldName] = fmt.Sprintf("%s debe tener al menos %s caracteres", fieldName, fieldErr.Param())
			case "gt":
				fieldErrors[fieldName] = fmt.Sprintf("%s debe ser mayor que %s", fieldName, fieldErr.Param())
			case "oneof":
				fieldErrors[fieldName] = fmt.Sprintf("%s debe ser uno de: %s", fieldName, fieldErr.Param())
			default:
				fieldErrors[fieldName] = fmt.Sprintf("%s falló la validación %s", fieldName, fieldErr.Tag())
			}
		}
		details = fieldErrors
	} else if err == gorm.ErrRecordNotFound {
		// 3. Manejar errores de registro no encontrado en GORM
		code = http.StatusNotFound
		message = "Recurso no encontrado"
	} else {
		// 4. Errores genéricos
		log.Printf("Error no manejado: %v", err)
		message = "Error interno del servidor"

		// En desarrollo, puedes incluir el error real
		// details = err.Error()
	}

	// Construir respuesta JSON
	response := map[string]interface{}{
		"error": message,
	}

	if details != nil {
		response["details"] = details
	}

	// Enviar respuesta
	if err := c.JSON(code, response); err != nil {
		log.Printf("Error al enviar respuesta de error: %v", err)
	}
}

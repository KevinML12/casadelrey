package utils

import (
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

// CustomValidator es un validador personalizado para Echo
type CustomValidator struct {
	Validator *validator.Validate
}

// Validate implementa la interfaz echo.Validator
func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.Validator.Struct(i); err != nil {
		return echo.NewHTTPError(400, err.Error())
	}
	return nil
}

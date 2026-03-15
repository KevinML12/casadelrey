// Package auth maneja el registro, login y recuperación de contraseña.
package auth

import (
	"casadelrey/backend/email"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Handler agrupa las dependencias necesarias para los endpoints de autenticación.
type Handler struct {
	DB *gorm.DB
}

// NewHandler crea una nueva instancia del handler de autenticación.
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

// Register godoc
// POST /api/v1/auth/register
// Registra un nuevo usuario con nombre, email y contraseña hasheada (bcrypt).
func (h *Handler) Register(c echo.Context) error {
	type RegisterRequest struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	req := new(RegisterRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	// Validación básica de campos requeridos
	if req.Name == "" || req.Email == "" || len(req.Password) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Nombre y email son requeridos. La contraseña debe tener mínimo 6 caracteres.",
		})
	}

	// Verificar unicidad del email antes de crear el usuario
	var existing User
	if result := h.DB.Where("email = ?", req.Email).First(&existing); result.Error == nil {
		return c.JSON(http.StatusConflict, map[string]string{
			"error": "Este email ya está registrado.",
		})
	}

	// Hashear la contraseña con bcrypt (costo por defecto)
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		log.Printf("[Auth] Error al hashear contraseña: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error interno al procesar la contraseña.",
		})
	}

	user := User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     "member", // Rol por defecto; solo admins pueden promover a otros
	}

	if result := h.DB.Create(&user); result.Error != nil {
		log.Printf("[Auth] Error al crear usuario: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al crear el usuario.",
		})
	}

	// Email de bienvenida en goroutine (no bloquea la respuesta HTTP)
	email.SendEmailAsync(
		user.Email,
		"Bienvenido a Casa del Rey",
		email.GetWelcomeTemplate(user.Name),
	)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Usuario registrado exitosamente. Por favor inicia sesión.",
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// Login godoc
// POST /api/v1/auth/login
// Autentica al usuario verificando email + contraseña y devuelve un JWT de 24h.
func (h *Handler) Login(c echo.Context) error {
	type LoginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	req := new(LoginRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	var user User
	if result := h.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		// Respuesta genérica: no revelar si el email existe o no
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Credenciales inválidas.",
		})
	}

	// Comparar la contraseña del request con el hash almacenado
	if err := ComparePassword(user.Password, req.Password); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Credenciales inválidas.",
		})
	}

	// Generar el token JWT (válido 24h, firmado con JWT_SECRET)
	token, err := GenerateJWT(user.ID, user.Role)
	if err != nil {
		log.Printf("[Auth] Error al generar JWT: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error interno al generar el token de sesión.",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// ForgotPassword godoc
// POST /api/v1/auth/forgot-password
// Genera un token de reseteo (UUID) y envía un email con el enlace.
// Siempre responde con el mismo mensaje para no revelar qué emails existen.
func (h *Handler) ForgotPassword(c echo.Context) error {
	type Request struct {
		Email string `json:"email"`
	}

	req := new(Request)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	// Respuesta genérica (security best practice: no revelar si el email existe)
	genericResponse := map[string]string{
		"message": "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.",
	}

	var user User
	if result := h.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		return c.JSON(http.StatusOK, genericResponse)
	}

	// Crear token único (UUID v4) con expiración de 1 hora
	resetToken := uuid.New().String()
	expiry := time.Now().Add(1 * time.Hour)
	user.ResetToken = &resetToken
	user.ResetTokenExpiry = &expiry

	if result := h.DB.Save(&user); result.Error != nil {
		log.Printf("[Auth] Error al guardar token de reseteo: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error interno al procesar la solicitud.",
		})
	}

	// Enviar email con el token de reseteo (en background)
	email.SendEmailAsync(
		user.Email,
		"Restablecer contraseña — Casa del Rey",
		email.GetPasswordResetTemplate(resetToken),
	)

	return c.JSON(http.StatusOK, genericResponse)
}

// ResetPassword godoc
// POST /api/v1/auth/reset-password
// Valida el token de reseteo y actualiza la contraseña del usuario.
func (h *Handler) ResetPassword(c echo.Context) error {
	type Request struct {
		Token       string `json:"token"`
		NewPassword string `json:"newPassword"`
	}

	req := new(Request)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	if req.Token == "" || len(req.NewPassword) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Token y nueva contraseña (mín. 6 caracteres) son requeridos.",
		})
	}

	var user User
	if result := h.DB.Where("reset_token = ?", req.Token).First(&user); result.Error != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Token inválido o expirado.",
		})
	}

	// Verificar que el token no haya vencido
	if user.ResetTokenExpiry == nil || time.Now().After(*user.ResetTokenExpiry) {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Token inválido o expirado.",
		})
	}

	hashedPassword, err := HashPassword(req.NewPassword)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error interno al procesar la contraseña.",
		})
	}

	// Actualizar contraseña e invalidar el token usado
	user.Password = hashedPassword
	user.ResetToken = nil
	user.ResetTokenExpiry = nil

	if result := h.DB.Save(&user); result.Error != nil {
		log.Printf("[Auth] Error al actualizar contraseña: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error interno al actualizar la contraseña.",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión.",
	})
}

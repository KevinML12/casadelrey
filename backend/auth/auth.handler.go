package auth

import (
	"casadelrey/backend/email"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Handler maneja las peticiones de autenticación
type Handler struct {
	DB *gorm.DB
}

// NewHandler crea un nuevo handler de autenticación
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

// Register registra un nuevo usuario
func (h *Handler) Register(c *fiber.Ctx) error {
	type RegisterRequest struct {
		Name     string `json:"name" validate:"required"`
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=6"`
	}

	req := new(RegisterRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos de entrada inválidos",
		})
	}

	// Verificar si el email ya existe
	var existingUser User
	if result := h.DB.Where("email = ?", req.Email).First(&existingUser); result.Error == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "El email ya está registrado",
		})
	}

	// Hashear la contraseña
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		log.Printf("Error al hashear contraseña: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al procesar la contraseña",
		})
	}

	// Crear el nuevo usuario
	user := User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     "member", // Rol por defecto
	}

	if result := h.DB.Create(&user); result.Error != nil {
		log.Printf("Error al crear usuario: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al crear el usuario",
		})
	}

	// Enviar email de bienvenida de forma asíncrona
	email.SendEmailAsync(
		user.Email,
		"Bienvenido a Casa del Rey",
		email.GetWelcomeTemplate(user.Name),
	)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Usuario registrado exitosamente. Por favor, inicia sesión.",
		"user": fiber.Map{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// Login autentica un usuario y genera un token JWT
func (h *Handler) Login(c *fiber.Ctx) error {
	type LoginRequest struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
	}

	req := new(LoginRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos de entrada inválidos",
		})
	}

	// Buscar usuario por email
	var user User
	if result := h.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Credenciales inválidas",
		})
	}

	// Comparar contraseña
	if err := ComparePassword(user.Password, req.Password); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Credenciales inválidas",
		})
	}

	// Generar token JWT
	token, err := GenerateJWT(user.ID, user.Role)
	if err != nil {
		log.Printf("Error al generar token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al generar el token",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// ForgotPassword maneja la solicitud de reseteo de contraseña
func (h *Handler) ForgotPassword(c *fiber.Ctx) error {
	type ForgotPasswordRequest struct {
		Email string `json:"email" validate:"required,email"`
	}

	req := new(ForgotPasswordRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos de entrada inválidos",
		})
	}

	// Buscar usuario por email
	var user User
	if result := h.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		// Por seguridad, devolver el mismo mensaje aunque el usuario no exista
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Si el email existe, recibirás un correo con instrucciones para resetear tu contraseña",
		})
	}

	// Generar token de reseteo
	resetToken := uuid.New().String()
	expiry := time.Now().Add(1 * time.Hour) // Token válido por 1 hora

	// Guardar el token en la base de datos
	user.ResetToken = &resetToken
	user.ResetTokenExpiry = &expiry

	if result := h.DB.Save(&user); result.Error != nil {
		log.Printf("Error al guardar token de reseteo: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al procesar la solicitud",
		})
	}

	// Enviar email de forma asíncrona
	email.SendEmailAsync(
		user.Email,
		"Reseteo de Contraseña - Casa del Rey",
		email.GetPasswordResetTemplate(resetToken),
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Si el email existe, recibirás un correo con instrucciones para resetear tu contraseña",
	})
}

// ResetPassword maneja la actualización de la contraseña con el token
func (h *Handler) ResetPassword(c *fiber.Ctx) error {
	type ResetPasswordRequest struct {
		Token       string `json:"token" validate:"required"`
		NewPassword string `json:"newPassword" validate:"required,min=6"`
	}

	req := new(ResetPasswordRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos de entrada inválidos",
		})
	}

	// Buscar usuario por token de reseteo
	var user User
	if result := h.DB.Where("reset_token = ?", req.Token).First(&user); result.Error != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Token inválido o expirado",
		})
	}

	// Verificar si el token ha expirado
	if user.ResetTokenExpiry == nil || time.Now().After(*user.ResetTokenExpiry) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Token inválido o expirado",
		})
	}

	// Hashear la nueva contraseña
	hashedPassword, err := HashPassword(req.NewPassword)
	if err != nil {
		log.Printf("Error al hashear contraseña: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al procesar la contraseña",
		})
	}

	// Actualizar la contraseña y limpiar el token
	user.Password = hashedPassword
	user.ResetToken = nil
	user.ResetTokenExpiry = nil

	if result := h.DB.Save(&user); result.Error != nil {
		log.Printf("Error al actualizar contraseña: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al actualizar la contraseña",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Contraseña actualizada exitosamente. Por favor, inicia sesión con tu nueva contraseña.",
	})
}

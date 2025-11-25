package handlers

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User representa el modelo de usuario
type User struct {
	gorm.Model
	Name     string `json:"name" gorm:"not null"`
	Email    string `json:"email" gorm:"unique;not null"`
	Password string `json:"-" gorm:"not null"`
	Role     string `json:"role" gorm:"default:member"`
}

// JWTClaims define los claims del JWT
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthHandler maneja la autenticación
type AuthHandler struct {
	DB *gorm.DB
}

// NewAuthHandler crea un nuevo handler de autenticación
func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{DB: db}
}

// GetJWTSecret obtiene la clave secreta para JWT
func GetJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default-secret-key-change-in-production"
	}
	return []byte(secret)
}

// Register registra un nuevo usuario
func (h *AuthHandler) Register(c echo.Context) error {
	type RegisterRequest struct {
		Name     string `json:"name" validate:"required"`
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=6"`
	}

	req := new(RegisterRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos"})
	}

	// Validaciones básicas
	if req.Name == "" || req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre, email y contraseña son requeridos"})
	}

	if len(req.Password) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "La contraseña debe tener al menos 6 caracteres"})
	}

	// Verificar si el email ya existe
	var existingUser User
	if result := h.DB.Where("email = ?", req.Email).First(&existingUser); result.Error == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "El email ya está registrado"})
	}

	// Hashear la contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error al hashear contraseña: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al procesar la contraseña"})
	}

	// Crear el nuevo usuario
	user := User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "member",
	}

	if result := h.DB.Create(&user); result.Error != nil {
		log.Printf("Error al crear usuario: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear el usuario"})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Usuario registrado exitosamente. Por favor, inicia sesión.",
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// Login autentica un usuario y genera un token JWT
func (h *AuthHandler) Login(c echo.Context) error {
	type LoginRequest struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
	}

	req := new(LoginRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos"})
	}

	// Buscar usuario por email
	var user User
	if result := h.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Credenciales inválidas"})
	}

	// Comparar contraseña
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Credenciales inválidas"})
	}

	// Generar token JWT
	claims := &JWTClaims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(GetJWTSecret())
	if err != nil {
		log.Printf("Error al generar token: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al generar el token"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token": tokenString,
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

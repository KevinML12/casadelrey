package auth

import (
	"time"

	"casadelrey/backend/config"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWTClaims define los claims personalizados del JWT
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// HashPassword hashea una contraseña usando bcrypt
func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

// ComparePassword compara una contraseña hasheada con una contraseña en texto plano
func ComparePassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// GenerateJWT genera un token JWT con los datos básicos del usuario
func GenerateJWT(userID uint, name, email, role string) (string, error) {
	claims := &JWTClaims{
		UserID: userID,
		Name:   name,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Crear y firmar el token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// GetJWTSecret obtiene la clave secreta para JWT (usado por middlewares)
func GetJWTSecret() []byte {
	return []byte(config.AppConfig.JWTSecret)
}

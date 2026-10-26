package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"time"

	"casadelrey/backend/config"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWTClaims define los claims personalizados del JWT
type JWTClaims struct {
	UserID         uint   `json:"user_id"`
	Name           string `json:"name"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	SessionVersion uint   `json:"session_version"`
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
func GenerateJWT(userID uint, name, email, role string, versions ...uint) (string, error) {
	var version uint
	if len(versions) > 0 {
		version = versions[0]
	}
	claims := &JWTClaims{
		SessionVersion: version,
		UserID:         userID,
		Name:           name,
		Email:          email,
		Role:           role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
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

// GenerateSecureToken genera una cadena segura aleatoria de tamaño especificado
func GenerateSecureToken(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// HashToken keeps opaque bearer credentials out of database storage.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

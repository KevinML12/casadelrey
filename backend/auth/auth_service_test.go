package auth_test

import (
	"testing"
	"time"

	"casadelrey/backend/auth"
	"casadelrey/backend/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	// Set dummy JWT secret for testing
	config.AppConfig = &config.Config{
		JWTSecret: "test_secret_123",
	}
}

func TestHashAndComparePassword(t *testing.T) {
	password := "MiSuperContrasenaSecreta!"

	// Prueba de Hasheo
	hashed, err := auth.HashPassword(password)
	require.NoError(t, err)
	assert.NotEmpty(t, hashed)
	assert.NotEqual(t, password, hashed, "El hash no debe ser igual al texto plano")

	// Prueba de Comparación Exitosa
	err = auth.ComparePassword(hashed, password)
	assert.NoError(t, err, "Las contraseñas deberían coincidir")

	// Prueba de Comparación Fallida
	err = auth.ComparePassword(hashed, "OtraContrasena")
	assert.Error(t, err, "Las contraseñas no deberían coincidir")
}

func TestGenerateJWT(t *testing.T) {
	userID := uint(42)
	name := "Juan Test"
	email := "juan@test.com"
	role := "admin"

	tokenString, err := auth.GenerateJWT(userID, name, email, role)
	require.NoError(t, err)
	assert.NotEmpty(t, tokenString)

	// Validar el token generado parseándolo de nuevo
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JWTSecret), nil
	})
	require.NoError(t, err)
	assert.True(t, token.Valid)

	// Verificar Claims
	claims, ok := token.Claims.(jwt.MapClaims)
	require.True(t, ok)
	
	// jwt.MapClaims almacena los enteros como float64
	assert.Equal(t, float64(userID), claims["user_id"])
	assert.Equal(t, name, claims["name"])
	assert.Equal(t, email, claims["email"])
	assert.Equal(t, role, claims["role"])

	// Verificar Expiración (Debería ser en el futuro, ~24 horas)
	expFloat, ok := claims["exp"].(float64)
	require.True(t, ok)
	expTime := time.Unix(int64(expFloat), 0)
	assert.True(t, expTime.After(time.Now()), "El token ya debería estar vigente")
}

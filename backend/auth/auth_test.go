package auth_test

import (
	"strings"
	"testing"

	"casadelrey/backend/auth"
	"casadelrey/backend/config"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	// Inicializar config global con secreto de prueba.
	config.AppConfig = &config.Config{JWTSecret: "test-secret-key-for-unit-tests"}
}

// ─── HashPassword ────────────────────────────────────────────────────────────

func TestHashPassword_GeneraHashValido(t *testing.T) {
	hash, err := auth.HashPassword("password123")
	require.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, "password123", hash, "el hash no debe ser igual al texto plano")
}

func TestHashPassword_SaltAleatorio(t *testing.T) {
	h1, err1 := auth.HashPassword("mismaContraseña")
	h2, err2 := auth.HashPassword("mismaContraseña")
	require.NoError(t, err1)
	require.NoError(t, err2)
	assert.NotEqual(t, h1, h2, "bcrypt debe generar salts distintos en cada llamada")
}

func TestHashPassword_ContraseñaVacia(t *testing.T) {
	// bcrypt acepta contraseñas vacías — debe retornar hash válido.
	hash, err := auth.HashPassword("")
	require.NoError(t, err)
	assert.NotEmpty(t, hash)
}

// ─── ComparePassword ─────────────────────────────────────────────────────────

func TestComparePassword_Correcta(t *testing.T) {
	hash, _ := auth.HashPassword("mi_secreto")
	assert.NoError(t, auth.ComparePassword(hash, "mi_secreto"))
}

func TestComparePassword_Incorrecta(t *testing.T) {
	hash, _ := auth.HashPassword("correcto")
	err := auth.ComparePassword(hash, "incorrecto")
	assert.Error(t, err, "una contraseña incorrecta debe devolver error")
}

func TestComparePassword_HashInvalido(t *testing.T) {
	err := auth.ComparePassword("no-es-un-hash-bcrypt", "cualquiera")
	assert.Error(t, err, "un hash malformado debe devolver error")
}

// ─── GenerateJWT ─────────────────────────────────────────────────────────────

func TestGenerateJWT_TokenValido(t *testing.T) {
	token, err := auth.GenerateJWT(1, "Ana García", "ana@casadelrey.gt", "admin")
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestGenerateJWT_FormatoTresParts(t *testing.T) {
	token, err := auth.GenerateJWT(42, "Pedro", "pedro@test.com", "leader")
	require.NoError(t, err)

	parts := strings.Split(token, ".")
	assert.Len(t, parts, 3, "JWT debe tener header.payload.signature")
}

func TestGenerateJWT_TokensDiferentesParaUsuariosDiferentes(t *testing.T) {
	t1, _ := auth.GenerateJWT(1, "User A", "a@test.com", "member")
	t2, _ := auth.GenerateJWT(2, "User B", "b@test.com", "member")
	assert.NotEqual(t, t1, t2)
}

func TestGenerateJWT_RolesDistintos(t *testing.T) {
	roles := []string{"admin", "leader", "volunteer", "member"}
	tokens := make(map[string]bool)
	for _, role := range roles {
		tok, err := auth.GenerateJWT(1, "Test", "t@t.com", role)
		require.NoError(t, err, "GenerateJWT no debe fallar para rol %s", role)
		tokens[tok] = true
	}
	assert.Len(t, tokens, len(roles), "cada rol debe producir un token distinto")
}

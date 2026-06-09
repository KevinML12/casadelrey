package security_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"casadelrey/backend/auth"
	"casadelrey/backend/handlers"
	"casadelrey/backend/models"
	"casadelrey/backend/utils/testutils"

	"github.com/stretchr/testify/assert"
)

func TestSQLInjection_Login(t *testing.T) {
	db := testutils.SetupTestDB()
	e := testutils.SetupTestServer()

	// Crear usuario de prueba
	hashedPassword, _ := auth.HashPassword("Password123!")
	db.Create(&models.User{
		Name:     "Test User",
		Email:    "test@casadelreyhue.org",
		Password: hashedPassword,
		Role:     "member",
	})

	// Setup auth handler
	authHandler := auth.NewHandler(db)
	e.POST("/login", authHandler.Login)

	// Array de payloads maliciosos
	payloads := []string{
		"test@casadelreyhue.org' OR '1'='1",
		"admin' --",
		"' OR 1=1; DROP TABLE users; --",
	}

	for _, payload := range payloads {
		body, _ := json.Marshal(map[string]string{
			"email":    payload,
			"password": "Password123!",
		})
		req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		// Debe dar Unauthorized porque GORM sanitiza las comillas
		assert.Equal(t, http.StatusUnauthorized, rec.Code, "Payload '%s' no fue bloqueado", payload)
	}
}

func TestXSSInjection_Petition(t *testing.T) {
	db := testutils.SetupTestDB()
	e := testutils.SetupTestServer()

	petitionHandler := handlers.NewPetitionHandler(db)
	e.POST("/petition", petitionHandler.CreatePetition)

	// Payload XSS clásico
	xssPayload := "<script>alert('xss')</script> Hola pastor"
	body, _ := json.Marshal(map[string]string{
		"name":     "Hacker",
		"email":    "hacker@xss.com",
		"subject":  "Hack",
		"message":  xssPayload,
		"category": "Oracion",
	})

	req := httptest.NewRequest(http.MethodPost, "/petition", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	// La API lo debe guardar, pero nosotros validamos que la DB no se corrompió
	assert.Equal(t, http.StatusCreated, rec.Code)

	var saved models.Petition
	db.First(&saved, "email = ?", "hacker@xss.com")
	
	// La data se guarda literalmente, el frontend debe usar frameworks modernos (React/Vite)
	// que escapan HTML por defecto, o podemos sanitizar en el backend.
	// Por ahora verificamos que la petición entró.
	assert.Equal(t, xssPayload, saved.Message)
}

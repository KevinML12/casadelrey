package e2e_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"casadelrey/backend/auth"
	"casadelrey/backend/config"
	"casadelrey/backend/handlers"
	"casadelrey/backend/middleware"
	"casadelrey/backend/models"
	"casadelrey/backend/utils/testutils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestE2E_UserLoginAndProfileFetch(t *testing.T) {
	// 1. Iniciar la DB y Servidor (SQLite en memoria)
	db := testutils.SetupTestDB()
	e := testutils.SetupTestServer()

	config.AppConfig = &config.Config{
		JWTSecret: "e2e_secret_key",
	}

	// 2. Pre-cargar datos en la DB
	hashedPassword, _ := auth.HashPassword("TestPass123!")
	user := models.User{
		Name:          "E2E User",
		Email:         "e2e@casadelreyhue.org",
		Password:      hashedPassword,
		Role:          "member",
		EmailVerified: true,
	}
	db.Create(&user)

	// 3. Setup de las Rutas Reales (Handlers + Middlewares)
	authHandler := auth.NewHandler(db)
	profileHandler := handlers.NewProfileHandler(db)
	authMW := middleware.NewAuthMiddleware(config.AppConfig.JWTSecret)

	e.POST("/api/v1/auth/login", authHandler.Login)
	e.GET("/api/v1/profile/goals", profileHandler.GetGoals, authMW)

	// 4. Paso E2E 1: Hacer Login
	loginPayload, _ := json.Marshal(map[string]string{
		"email":    "e2e@casadelreyhue.org",
		"password": "TestPass123!",
	})
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginPayload))
	reqLogin.Header.Set("Content-Type", "application/json")
	recLogin := httptest.NewRecorder()
	e.ServeHTTP(recLogin, reqLogin)

	require.Equal(t, http.StatusOK, recLogin.Code)

	var loginResponse struct {
		Token string `json:"token"`
		User  struct {
			ID   uint   `json:"ID"`
			Role string `json:"role"`
		} `json:"user"`
	}
	err := json.Unmarshal(recLogin.Body.Bytes(), &loginResponse)
	require.NoError(t, err)
	require.NotEmpty(t, loginResponse.Token, "El token JWT no debe estar vacío")

	// 5. Paso E2E 2: Obtener perfil usando el JWT real emitido por el backend
	reqProfile := httptest.NewRequest(http.MethodGet, "/api/v1/profile/goals", nil)
	reqProfile.Header.Set("Authorization", "Bearer "+loginResponse.Token)
	recProfile := httptest.NewRecorder()
	e.ServeHTTP(recProfile, reqProfile)

	// Valida que el middleware dejó pasar al usuario y que la DB cargó su data
	assert.Equal(t, http.StatusOK, recProfile.Code)
}

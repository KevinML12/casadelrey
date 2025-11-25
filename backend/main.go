package main

import (
	"log"
	"net/http"

	"casa-del-rey/backend/auth"
	"casa-del-rey/backend/blog"
	"casa-del-rey/backend/config"
	"casa-del-rey/backend/database"
	"casa-del-rey/backend/donation"
	"casa-del-rey/backend/events"
	customMiddleware "casa-del-rey/backend/middleware"
	"casa-del-rey/backend/petition"
	"casa-del-rey/backend/router"
	"casa-del-rey/backend/utils"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Cargar configuración desde variables de entorno
	cfg := config.LoadConfig()

	// Inicializar la base de datos con todos los modelos
	database.InitDB(
		cfg.DatabaseURL,
		&auth.User{},         // Usuario del módulo auth
		&petition.Petition{}, // Petición del módulo petition
		&donation.Donation{}, // Donación del módulo donation
		&blog.Post{},         // Post del módulo blog
		&events.Event{},      // Evento del módulo events
	)

	// Crear instancia de Echo
	e := echo.New()

	// Registrar manejador de errores personalizado
	e.HTTPErrorHandler = customMiddleware.CustomErrorHandler

	// Registrar validador personalizado
	e.Validator = &utils.CustomValidator{Validator: validator.New()}

	// Middleware de seguridad básico y logs
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Configuración CORS profesional
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{cfg.ClientURL},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
	}))

	// Configurar todas las rutas
	router.SetupRoutes(e, database.DB)

	// Iniciar el servidor
	log.Printf("Iniciando servidor en el puerto: %s", cfg.Port)
	if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}

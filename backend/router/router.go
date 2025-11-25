package router

import (
	"net/http"
	"os"

	"casa-del-rey/backend/auth"
	"casa-del-rey/backend/blog"
	"casa-del-rey/backend/dashboard"
	"casa-del-rey/backend/donation"
	"casa-del-rey/backend/events"
	"casa-del-rey/backend/middleware"
	"casa-del-rey/backend/petition"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// SetupRoutes configura todas las rutas de la aplicación
func SetupRoutes(e *echo.Echo, db *gorm.DB) {
	// Inicializar handlers
	petitionHandler := petition.NewHandler(db)
	donationHandler := donation.NewHandler(db)
	authHandler := auth.NewHandler(db)
	blogHandler := blog.NewHandler(db)
	eventHandler := events.NewHandler(db)
	dashboardHandler := dashboard.NewHandler(db)

	// --- RUTAS PÚBLICAS ---
	e.GET("/api/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "CasaDelRey Backend API",
		})
	})

	// Rutas de contacto y donaciones
	e.POST("/api/contact/petition", petitionHandler.CreatePetition)
	e.POST("/api/donate/stripe", donationHandler.CreateStripePaymentIntent)

	// Rutas de autenticación
	e.POST("/api/auth/register", authHandler.Register)
	e.POST("/api/auth/login", authHandler.Login)
	e.POST("/api/auth/forgot-password", authHandler.ForgotPassword)
	e.POST("/api/auth/reset-password", authHandler.ResetPassword)

	// Rutas públicas de blog
	e.GET("/api/blog/posts", blogHandler.GetPublicPosts)
	e.GET("/api/blog/posts/:slug", blogHandler.GetPostBySlug)

	// Rutas públicas de eventos
	e.GET("/api/events", eventHandler.GetEvents)

	// --- RUTAS PROTEGIDAS (requieren autenticación) ---
	protected := e.Group("/api/protected")
	protected.Use(middleware.AuthMiddleware())

	protected.GET("/profile", func(c echo.Context) error {
		userID := c.Get("user_id").(uint)
		role := c.Get("role").(string)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Perfil de usuario",
			"user_id": userID,
			"role":    role,
		})
	})

	// --- RUTAS DE ADMINISTRADOR (requieren rol admin) ---
	admin := e.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminMiddleware())

	// Dashboard
	admin.GET("/dashboard", func(c echo.Context) error {
		userID := c.Get("user_id").(uint)
		role := c.Get("role").(string)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Panel de administración",
			"user_id": userID,
			"role":    role,
		})
	})

	// KPIs del dashboard
	admin.GET("/kpis", dashboardHandler.GetKPIs)

	// Listar donaciones y peticiones
	admin.GET("/donations", func(c echo.Context) error {
		var donations []donation.Donation
		if result := db.Find(&donations); result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error al obtener las donaciones",
			})
		}
		return c.JSON(http.StatusOK, donations)
	})

	admin.GET("/petitions", petitionHandler.GetAllPetitions)
	admin.PUT("/petitions/:id/read", petitionHandler.MarkAsRead)

	// Rutas de blog para admin
	admin.POST("/blog", blogHandler.CreatePost)
	admin.PUT("/blog/:id", blogHandler.UpdatePost)

	// Rutas de eventos para admin
	admin.POST("/events", eventHandler.CreateEvent)

	// --- CONFIGURACIÓN DE DESPLIEGUE HÍBRIDO ---
	isProduction := os.Getenv("ENV") == "production"

	if isProduction {
		// Servir archivos estáticos del build de React
		e.Static("/", "../frontend/dist")

		// Fallback para rutas de frontend (SPA routing)
		e.GET("/*", func(c echo.Context) error {
			return c.File("../frontend/dist/index.html")
		})
	}
}

// Package routes centraliza el registro de todas las rutas del servidor Echo.
// Agrupa las rutas por dominio (auth, blog, peticiones, donaciones, admin)
// y aplica los middlewares de autenticación a las rutas protegidas.
package routes

import (
	"net/http"

	"casadelrey/backend/auth"
	"casadelrey/backend/config"
	"casadelrey/backend/handlers"
	"casadelrey/backend/middleware"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Register registra todos los grupos de rutas en la instancia de Echo.
// Crea las instancias de los handlers con inyección de dependencias (DB).
//
// Parámetros:
//   - e:   Instancia de Echo configurada en main.go
//   - db:  Conexión singleton a PostgreSQL
//   - cfg: Configuración cargada desde variables de entorno
func Register(e *echo.Echo, db *gorm.DB, cfg *config.Config) {

	// ── Instanciar los handlers con sus dependencias ──────────────────────
	authHandler     := auth.NewHandler(db)
	blogHandler     := handlers.NewBlogHandler(db)
	petitionHandler := handlers.NewPetitionHandler(db)
	donationHandler := handlers.NewDonationHandler(db)
	uploadHandler   := handlers.NewUploadHandler()

	// ── Middlewares de autenticación y autorización ───────────────────────
	// authMW: valida el JWT y carga user_id + user_role en el contexto
	// adminMW: verifica que user_role == "admin" (aplicar DESPUÉS de authMW)
	authMW  := middleware.NewAuthMiddleware(cfg.JWTSecret)
	adminMW := middleware.AdminMiddleware()

	// ── Health Check ──────────────────────────────────────────────────────
	// Usado por Dokploy, Docker Healthcheck y balanceadores de carga.
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "CasaDelRey Backend",
			"version": "1.0.0",
		})
	})

	// ── Servir archivos subidos de forma estática ─────────────────────────
	// Los archivos en ./uploads/ son accesibles en GET /uploads/<filename>
	e.Static("/uploads", "./uploads")

	// ── API v1 ────────────────────────────────────────────────────────────
	api := e.Group("/api/v1")

	// ── 1. Auth (rutas públicas) ──────────────────────────────────────────
	authGroup := api.Group("/auth")
	authGroup.POST("/register",        authHandler.Register)
	authGroup.POST("/login",           authHandler.Login)
	authGroup.POST("/forgot-password", authHandler.ForgotPassword)
	authGroup.POST("/reset-password",  authHandler.ResetPassword)

	// ── 2. Blog (lectura pública) ─────────────────────────────────────────
	blogGroup := api.Group("/blog")
	blogGroup.GET("/",     blogHandler.GetPublishedPosts)
	blogGroup.GET("/:slug", blogHandler.GetPostBySlug)

	// ── 3. Peticiones de Oración (envío público) ──────────────────────────
	contactGroup := api.Group("/contact")
	contactGroup.POST("/petition", petitionHandler.CreatePetition)

	// ── 4. Donaciones (envío público) ─────────────────────────────────────
	donationsGroup := api.Group("/donations")
	donationsGroup.POST("/simulate",              donationHandler.SimulateDonation)
	donationsGroup.POST("/create-payment-intent", donationHandler.CreatePaymentIntent)
	// El webhook NO lleva authMW: Stripe firma sus propias peticiones.
	donationsGroup.POST("/webhook", donationHandler.HandleWebhook)

	// ── 5. Eventos (placeholder) ──────────────────────────────────────────
	eventsGroup := api.Group("/events")
	eventsGroup.GET("/", handlers.GetEventsPlaceholder)

	// ── 6. Upload de Archivos (requiere autenticación) ────────────────────
	// Protegido para evitar abuso del almacenamiento del servidor.
	uploadGroup := api.Group("/upload", authMW)
	uploadGroup.POST("", uploadHandler.UploadFile)

	// ── 7. Admin (requiere auth + rol admin) ──────────────────────────────
	// El orden de middlewares es importante: primero authMW, luego adminMW.
	adminGroup := api.Group("/admin", authMW, adminMW)
	adminGroup.GET("/dashboard", handlers.AdminDashboardPlaceholder)

	// Admin Blog
	adminBlog := adminGroup.Group("/blog")
	adminBlog.POST("/",    blogHandler.CreatePost)
	adminBlog.PUT("/:id",  blogHandler.UpdatePost)

	// Admin Peticiones
	adminGroup.GET("/petitions",          petitionHandler.GetAllPetitions)
	adminGroup.PUT("/petitions/:id/read", petitionHandler.MarkAsRead)
}

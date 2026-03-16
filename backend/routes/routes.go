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

func Register(e *echo.Echo, db *gorm.DB, cfg *config.Config) {

	// ── Instanciar handlers ───────────────────────────────────────────────────
	authHandler     := auth.NewHandler(db)
	blogHandler     := handlers.NewBlogHandler(db)
	petitionHandler := handlers.NewPetitionHandler(db)
	donationHandler := handlers.NewDonationHandler(db)
	eventHandler    := handlers.NewEventHandler(db)
	cellReportHandler := handlers.NewCellReportHandler(db)
	adminHandler    := handlers.NewAdminHandler(db)
	uploadHandler   := handlers.NewUploadHandler()

	// ── Middlewares ───────────────────────────────────────────────────────────
	authMW  := middleware.NewAuthMiddleware(cfg.JWTSecret)
	adminMW := middleware.AdminMiddleware()

	// ── Health check ──────────────────────────────────────────────────────────
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "CasaDelRey Backend",
			"version": "2.0.0",
		})
	})

	// Servir archivos subidos desde /uploads
	e.Static("/uploads", "./uploads")

	// ── API v1 ────────────────────────────────────────────────────────────────
	api := e.Group("/api/v1")

	// Auth (público)
	authGroup := api.Group("/auth")
	authGroup.POST("/register",        authHandler.Register)
	authGroup.POST("/login",           authHandler.Login)
	authGroup.POST("/forgot-password", authHandler.ForgotPassword)
	authGroup.POST("/reset-password",  authHandler.ResetPassword)

	// Blog (público: lectura)
	blogGroup := api.Group("/blog")
	blogGroup.GET("/",      blogHandler.GetPublishedPosts)
	blogGroup.GET("/:slug", blogHandler.GetPostBySlug)

	// Peticiones de oración (público: solo escritura)
	contactGroup := api.Group("/contact")
	contactGroup.POST("/petition", petitionHandler.CreatePetition)

	// Donaciones (público: crear payment intent y webhook)
	donationsGroup := api.Group("/donations")
	donationsGroup.POST("/create-payment-intent", donationHandler.CreatePaymentIntent)
	donationsGroup.POST("/create-paypal-order",   donationHandler.CreatePayPalOrder)
	donationsGroup.POST("/capture-paypal-order",  donationHandler.CapturePayPalOrder)
	donationsGroup.POST("/webhook",               donationHandler.HandleWebhook) // firmado por Stripe, sin authMW
	donationsGroup.POST("/simulate",              donationHandler.SimulateDonation)

	// Eventos (público: solo lectura)
	eventsGroup := api.Group("/events")
	eventsGroup.GET("/", eventHandler.GetEvents)

	// Reportes de células (público: solo escritura)
	cellsGroup := api.Group("/cells")
	cellsGroup.POST("/report", cellReportHandler.CreateCellReport)

	// Upload (requiere login)
	uploadGroup := api.Group("/upload", authMW)
	uploadGroup.POST("", uploadHandler.UploadFile)

	// ── Admin (requiere auth + rol admin) ─────────────────────────────────────
	adminGroup := api.Group("/admin", authMW, adminMW)

	// Dashboard KPIs y donaciones
	adminGroup.GET("/kpis",      adminHandler.GetKPIs)
	adminGroup.GET("/donations", adminHandler.GetDonations)

	// Blog admin
	adminBlog := adminGroup.Group("/blog")
	adminBlog.GET("/",        blogHandler.GetAllPosts)
	adminBlog.POST("/",       blogHandler.CreatePost)
	adminBlog.PUT("/:id",     blogHandler.UpdatePost)
	adminBlog.DELETE("/:id",  blogHandler.DeletePost)

	// Peticiones admin
	adminGroup.GET("/petitions",           petitionHandler.GetAllPetitions)
	adminGroup.PUT("/petitions/:id/read",  petitionHandler.MarkAsRead)

	// Reportes de células admin
	adminGroup.GET("/cell-reports", cellReportHandler.GetAllCellReports)

	// Eventos admin
	adminEvents := adminGroup.Group("/events")
	adminEvents.POST("/",    eventHandler.CreateEvent)
	adminEvents.PUT("/:id",  eventHandler.UpdateEvent)
	adminEvents.DELETE("/:id", eventHandler.DeleteEvent)
}

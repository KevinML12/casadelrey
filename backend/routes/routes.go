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
	socialHandler    := handlers.NewSocialHandler(db)
	adminHandler     := handlers.NewAdminHandler(db)
	profileHandler   := handlers.NewProfileHandler(db)
	volunteerHandler := handlers.NewVolunteerHandler(db)
	uploadHandler   := handlers.NewUploadHandler()

	// ── Middlewares ───────────────────────────────────────────────────────────
	authMW           := middleware.NewAuthMiddleware(cfg.JWTSecret)
	adminMW          := middleware.AdminMiddleware()
	adminOrLeaderMW  := middleware.AdminOrLeaderMiddleware()

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

	// Voluntariado (público: inscripción de interés)
	api.POST("/volunteer/register", volunteerHandler.Register)

	// Auth (público; registro desactivado: solo admin/líder crean usuarios)
	authGroup := api.Group("/auth")
	authGroup.POST("/register",        authHandler.RegisterDisabled)
	authGroup.POST("/login",           authHandler.Login)
	authGroup.GET("/verify-email",     authHandler.VerifyEmail)
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

	// Feed social (público)
	api.GET("/social/feed", socialHandler.GetSocialFeed)

	// Reportes de células (público: solo escritura)
	cellsGroup := api.Group("/cells")
	cellsGroup.POST("/report", cellReportHandler.CreateCellReport)

	// Perfil y metas (cualquier usuario autenticado)
	profileGroup := api.Group("/profile", authMW)
	profileGroup.GET("/goals",    profileHandler.GetGoals)
	profileGroup.POST("/goals",   profileHandler.CreateGoal)
	profileGroup.PUT("/goals/:id", profileHandler.UpdateGoal)
	profileGroup.DELETE("/goals/:id", profileHandler.DeleteGoal)

	// Upload (requiere login)
	uploadGroup := api.Group("/upload", authMW)
	uploadGroup.POST("", uploadHandler.UploadFile)

	// ── Admin (requiere auth + rol admin) ─────────────────────────────────────
	adminGroup := api.Group("/admin", authMW, adminMW)

	// Dashboard KPIs y donaciones
	adminGroup.GET("/kpis",      adminHandler.GetKPIs)
	adminGroup.GET("/donations", adminHandler.GetDonations)
	adminGroup.PUT("/users/:id/role", adminHandler.UpdateUserRole)
	adminGroup.GET("/leaders",       adminHandler.GetLeaders)
	adminGroup.PUT("/volunteers/:id/assign", volunteerHandler.Assign)

	// Blog admin
	adminBlog := adminGroup.Group("/blog")
	adminBlog.GET("/",        blogHandler.GetAllPosts)
	adminBlog.POST("/",       blogHandler.CreatePost)
	adminBlog.PUT("/:id",     blogHandler.UpdatePost)
	adminBlog.DELETE("/:id",  blogHandler.DeletePost)

	// Peticiones admin
	adminGroup.GET("/petitions",           petitionHandler.GetAllPetitions)
	adminGroup.PUT("/petitions/:id/read",  petitionHandler.MarkAsRead)

	// Admin o líder: crear usuarios, voluntarios, células
	adminOrLeader := api.Group("/admin", authMW, adminOrLeaderMW)
	adminOrLeader.POST("/users", adminHandler.CreateUser)
	adminOrLeader.GET("/volunteers", volunteerHandler.GetAll)
	adminOrLeader.POST("/volunteers/:id/create-user", volunteerHandler.CreateUserFromVolunteer)
	adminOrLeader.POST("/cell-report", cellReportHandler.CreateCellReport)
	adminOrLeader.POST("/cell-reports/bulk", cellReportHandler.BulkCreateCellReports)
	adminOrLeader.POST("/cell-reports/import", cellReportHandler.ImportCellReportsCSV)
	adminOrLeader.GET("/cell-reports", cellReportHandler.GetAllCellReports)
	adminOrLeader.GET("/cell-reports/stats", cellReportHandler.GetCellStats)

	// Eventos admin
	adminEvents := adminGroup.Group("/events")
	adminEvents.POST("/",    eventHandler.CreateEvent)
	adminEvents.PUT("/:id",  eventHandler.UpdateEvent)
	adminEvents.DELETE("/:id", eventHandler.DeleteEvent)

	// Social (admin)
	adminSocial := adminGroup.Group("/social")
	adminSocial.GET("/",    socialHandler.GetAllSocialPosts)
	adminSocial.POST("/",   socialHandler.CreateSocialPost)
	adminSocial.PUT("/:id", socialHandler.UpdateSocialPost)
	adminSocial.DELETE("/:id", socialHandler.DeleteSocialPost)
}

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

	// ── Handlers ─────────────────────────────────────────────────────────────────
	authHandler       := auth.NewHandler(db)
	blogHandler       := handlers.NewBlogHandler(db)
	petitionHandler   := handlers.NewPetitionHandler(db)
	donationHandler   := handlers.NewDonationHandler(db)
	eventHandler      := handlers.NewEventHandler(db)
	cellReportHandler := handlers.NewCellReportHandler(db)
	socialHandler     := handlers.NewSocialHandler(db)
	adminHandler      := handlers.NewAdminHandler(db)
	profileHandler    := handlers.NewProfileHandler(db)
	volunteerHandler  := handlers.NewVolunteerHandler(db)
	boletaHandler     := handlers.NewBoletaHandler(db)
	uploadHandler     := handlers.NewUploadHandler()

	// ── Middlewares ───────────────────────────────────────────────────────────────
	authMW          := middleware.NewAuthMiddleware(cfg.JWTSecret)
	adminMW         := middleware.AdminMiddleware()
	adminOrLeaderMW := middleware.AdminOrLeaderMiddleware()

	// ── Health check ──────────────────────────────────────────────────────────────
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "CasaDelRey Backend",
			"version": "3.0.0",
		})
	})

	e.Static("/uploads", "./uploads")

	// ── API v1 ────────────────────────────────────────────────────────────────────
	api := e.Group("/api/v1")

	// Voluntariado
	api.POST("/volunteer/register",      volunteerHandler.Register)
	api.GET("/volunteer/departments",    volunteerHandler.GetDepartments)

	// Auth
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

	// Peticiones de oración
	contactGroup := api.Group("/contact")
	contactGroup.POST("/petition", petitionHandler.CreatePetition)

	// Donaciones (sistema de pago local)
	donationsGroup := api.Group("/donations")
	donationsGroup.POST("/register", donationHandler.RegisterDonation)

	// Eventos (público: solo lectura)
	eventsGroup := api.Group("/events")
	eventsGroup.GET("/", eventHandler.GetEvents)

	// Feed social
	api.GET("/social/feed", socialHandler.GetSocialFeed)

	// Perfil y metas (usuario autenticado)
	profileGroup := api.Group("/profile", authMW)
	profileGroup.GET("/goals",        profileHandler.GetGoals)
	profileGroup.POST("/goals",       profileHandler.CreateGoal)
	profileGroup.PUT("/goals/:id",    profileHandler.UpdateGoal)
	profileGroup.DELETE("/goals/:id", profileHandler.DeleteGoal)

	// Upload (requiere login)
	uploadGroup := api.Group("/upload", authMW)
	uploadGroup.POST("", uploadHandler.UploadFile)

	// ── Admin (requiere auth + rol admin) ─────────────────────────────────────────
	adminGroup := api.Group("/admin", authMW, adminMW)

	// Dashboard
	adminGroup.GET("/kpis",               adminHandler.GetKPIs)
	adminGroup.GET("/donations",          adminHandler.GetDonations)
	adminGroup.PUT("/users/:id/role",     adminHandler.UpdateUserRole)
	adminGroup.GET("/leaders",            adminHandler.GetLeaders)
	adminGroup.PUT("/volunteers/:id/assign", volunteerHandler.Assign)

	// Aprobación de reportes de células (solo admin)
	adminGroup.PUT("/cell-reports/:id/approve", cellReportHandler.ApproveReport)

	// Blog admin
	adminBlog := adminGroup.Group("/blog")
	adminBlog.GET("/",       blogHandler.GetAllPosts)
	adminBlog.POST("/",      blogHandler.CreatePost)
	adminBlog.PUT("/:id",    blogHandler.UpdatePost)
	adminBlog.DELETE("/:id", blogHandler.DeletePost)

	// Peticiones admin
	adminGroup.GET("/petitions",          petitionHandler.GetAllPetitions)
	adminGroup.PUT("/petitions/:id/read", petitionHandler.MarkAsRead)

	// Eventos admin
	adminEvents := adminGroup.Group("/events")
	adminEvents.POST("/",      eventHandler.CreateEvent)
	adminEvents.PUT("/:id",    eventHandler.UpdateEvent)
	adminEvents.DELETE("/:id", eventHandler.DeleteEvent)

	// Social admin
	adminSocial := adminGroup.Group("/social")
	adminSocial.GET("/",       socialHandler.GetAllSocialPosts)
	adminSocial.POST("/",      socialHandler.CreateSocialPost)
	adminSocial.PUT("/:id",    socialHandler.UpdateSocialPost)
	adminSocial.DELETE("/:id", socialHandler.DeleteSocialPost)

	// Boletas (admin: eliminar)
	adminGroup.DELETE("/boletas/:id", boletaHandler.DeleteBoleta)

	// ── Admin o Líder ─────────────────────────────────────────────────────────────
	adminOrLeader := api.Group("/admin", authMW, adminOrLeaderMW)

	// Usuarios
	adminOrLeader.POST("/users", adminHandler.CreateUser)

	// Voluntarios
	adminOrLeader.GET("/volunteers",                         volunteerHandler.GetAll)
	adminOrLeader.POST("/volunteers/:id/create-user",        volunteerHandler.CreateUserFromVolunteer)

	// Reportes de células
	adminOrLeader.POST("/cell-reports",        cellReportHandler.CreateCellReport)
	adminOrLeader.GET("/cell-reports",         cellReportHandler.GetAllCellReports)
	adminOrLeader.GET("/cell-reports/stats",   cellReportHandler.GetCellStats)

	// Boletas de nuevos miembros
	adminOrLeader.POST("/boletas",     boletaHandler.CreateBoleta)
	adminOrLeader.GET("/boletas",      boletaHandler.GetBoletas)
	adminOrLeader.PUT("/boletas/:id",  boletaHandler.UpdateBoleta)
}

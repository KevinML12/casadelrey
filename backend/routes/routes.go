package routes

import (
	"net/http"

	"casadelrey/backend/auth"
	"casadelrey/backend/config"
	"casadelrey/backend/handlers"
	"casadelrey/backend/middleware"
	"casadelrey/backend/storage"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func Register(e *echo.Echo, db *gorm.DB, cfg *config.Config, store storage.Store) {

	// ── Handlers ─────────────────────────────────────────────────────────────────
	authHandler          := auth.NewHandler(db)
	blogHandler          := handlers.NewBlogHandler(db)
	petitionHandler      := handlers.NewPetitionHandler(db)
	donationHandler      := handlers.NewDonationHandler(db)
	eventHandler         := handlers.NewEventHandler(db)
	cellReportHandler    := handlers.NewCellReportHandler(db)
	socialHandler        := handlers.NewSocialHandler(db)
	adminHandler         := handlers.NewAdminHandler(db)
	profileHandler       := handlers.NewProfileHandler(db)
	volunteerHandler     := handlers.NewVolunteerHandler(db)
	boletaHandler        := handlers.NewBoletaHandler(db)
	uploadHandler        := handlers.NewUploadHandler(store)
	announcementHandler  := handlers.NewAnnouncementHandler(db)
	notificationHandler  := handlers.NewNotificationHandler(db)
	galleryHandler       := handlers.NewGalleryHandler(db)
	rsvpHandler          := handlers.NewRSVPHandler(db)
	leaderDashHandler    := handlers.NewLeaderDashboardHandler(db)
	activityLogHandler   := handlers.NewActivityLogHandler(db)

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
	api.POST("/volunteer/register",   volunteerHandler.Register)
	api.GET("/volunteer/departments", volunteerHandler.GetDepartments)
	api.GET("/volunteer/me",          volunteerHandler.GetMyInfo, authMW)

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

	// Donaciones (registro local + PayPal)
	donationsGroup := api.Group("/donations")
	donationsGroup.POST("/register",             donationHandler.RegisterDonation)
	donationsGroup.POST("/create-paypal-order",  donationHandler.CreatePayPalOrder)
	donationsGroup.POST("/capture-paypal-order", donationHandler.CapturePayPalOrder)

	// Eventos (público: lectura + RSVP)
	eventsGroup := api.Group("/events")
	eventsGroup.GET("/",              eventHandler.GetEvents)
	eventsGroup.POST("/:id/rsvp",    rsvpHandler.RegisterRSVP)

	// Feed social
	api.GET("/social/feed", socialHandler.GetSocialFeed)

	// Anuncios (público — authMW opcional para filtrar por rol)
	api.GET("/announcements", announcementHandler.GetAnnouncements)

	// Galería pública
	galleryGroup := api.Group("/gallery")
	galleryGroup.GET("/", galleryHandler.GetPhotos)

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

	// Dashboard y KPIs
	adminGroup.GET("/kpis",               adminHandler.GetKPIs)
	adminGroup.GET("/donations",          adminHandler.GetDonations)
	adminGroup.GET("/users",              adminHandler.GetUsers)
	adminGroup.PUT("/users/:id/role",     adminHandler.UpdateUserRole)
	adminGroup.PUT("/users/:id/cell",     adminHandler.UpdateUserCell)
	adminGroup.GET("/leaders",            adminHandler.GetLeaders)
	adminGroup.PUT("/volunteers/:id/assign", volunteerHandler.Assign)

	// Notificaciones
	adminGroup.GET("/notifications/counts", notificationHandler.GetCounts)

	// Directorio de células
	adminGroup.GET("/cell-directory", leaderDashHandler.GetCellDirectory)

	// Historial de actividad
	adminGroup.GET("/activity-log", activityLogHandler.GetActivityLog)

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
	adminGroup.GET("/petitions/weekly",   petitionHandler.GetWeeklyPetitions)

	// Eventos admin
	adminEvents := adminGroup.Group("/events")
	adminEvents.POST("/",       eventHandler.CreateEvent)
	adminEvents.PUT("/:id",     eventHandler.UpdateEvent)
	adminEvents.DELETE("/:id",  eventHandler.DeleteEvent)
	adminEvents.GET("/:id/rsvps", rsvpHandler.GetEventRSVPs)

	// RSVP admin
	adminGroup.DELETE("/rsvps/:id", rsvpHandler.DeleteRSVP)

	// Social admin
	adminSocial := adminGroup.Group("/social")
	adminSocial.GET("/",       socialHandler.GetAllSocialPosts)
	adminSocial.POST("/",      socialHandler.CreateSocialPost)
	adminSocial.PUT("/:id",    socialHandler.UpdateSocialPost)
	adminSocial.DELETE("/:id", socialHandler.DeleteSocialPost)

	// Anuncios admin
	adminAnnouncements := adminGroup.Group("/announcements")
	adminAnnouncements.GET("/",       announcementHandler.GetAllAnnouncements)
	adminAnnouncements.POST("/",      announcementHandler.CreateAnnouncement)
	adminAnnouncements.PUT("/:id",    announcementHandler.UpdateAnnouncement)
	adminAnnouncements.DELETE("/:id", announcementHandler.DeleteAnnouncement)

	// Galería admin
	adminGallery := adminGroup.Group("/gallery")
	adminGallery.GET("/",       galleryHandler.GetAllPhotos)
	adminGallery.POST("/",      galleryHandler.CreatePhoto)
	adminGallery.PUT("/:id",    galleryHandler.UpdatePhoto)
	adminGallery.DELETE("/:id", galleryHandler.DeletePhoto)

	// Boletas (admin: eliminar)
	adminGroup.DELETE("/boletas/:id", boletaHandler.DeleteBoleta)

	// ── Admin o Líder ─────────────────────────────────────────────────────────────
	adminOrLeader := api.Group("/admin", authMW, adminOrLeaderMW)

	// Usuarios
	adminOrLeader.POST("/users", adminHandler.CreateUser)

	// Voluntarios
	adminOrLeader.GET("/volunteers",                      volunteerHandler.GetAll)
	adminOrLeader.POST("/volunteers/:id/create-user",     volunteerHandler.CreateUserFromVolunteer)

	// Reportes de células
	adminOrLeader.POST("/cell-reports",      cellReportHandler.CreateCellReport)
	adminOrLeader.GET("/cell-reports",       cellReportHandler.GetAllCellReports)
	adminOrLeader.GET("/cell-reports/stats", cellReportHandler.GetCellStats)

	// Boletas de nuevos miembros
	adminOrLeader.POST("/boletas",    boletaHandler.CreateBoleta)
	adminOrLeader.GET("/boletas",     boletaHandler.GetBoletas)
	adminOrLeader.PUT("/boletas/:id", boletaHandler.UpdateBoleta)

	// ── Panel Líder ───────────────────────────────────────────────────────────────
	leaderGroup := api.Group("/leader", authMW)

	leaderGroup.GET("/kpis",            leaderDashHandler.GetLeaderKPIs)
	leaderGroup.GET("/cell-directory",  leaderDashHandler.GetCellDirectory)
	leaderGroup.GET("/notifications/counts", notificationHandler.GetCounts)
}

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
	cellCategoryHandler  := handlers.NewCellCategoryHandler(db)
	cellReportHandler    := handlers.NewCellReportHandler(db)
	socialHandler        := handlers.NewSocialHandler(db)
	adminHandler         := handlers.NewAdminHandler(db)
	profileHandler       := handlers.NewProfileHandler(db)
	volunteerHandler     := handlers.NewVolunteerHandler(db)
	boletaHandler        := handlers.NewBoletaHandler(db)
	uploadHandler        := handlers.NewUploadHandler(store)
	receiptHandler       := handlers.NewPaymentReceiptHandler(db)
	heroHandler          := handlers.NewHeroHandler(db)
	sitePhotoHandler     := handlers.NewSitePhotoHandler(db)
	siteSettingHandler   := handlers.NewSiteSettingHandler(db)
	announcementHandler  := handlers.NewAnnouncementHandler(db)
	notificationHandler  := handlers.NewNotificationHandler(db)
	galleryHandler       := handlers.NewGalleryHandler(db)
	faqHandler           := handlers.NewFAQHandler(db)
	leaderDirHandler     := handlers.NewLeaderDirectoryHandler(db)
	rsvpHandler          := handlers.NewRSVPHandler(db)
	leaderDashHandler    := handlers.NewLeaderDashboardHandler(db)
	activityLogHandler   := handlers.NewActivityLogHandler(db)
	connectCardHandler   := handlers.NewConnectCardHandler(db)

	// ── Middlewares ───────────────────────────────────────────────────────────────
	authMW          := middleware.NewAuthMiddleware(cfg.JWTSecret)
	adminMW         := middleware.AdminMiddleware()
	adminOrLeaderMW := middleware.AdminOrLeaderMiddleware()
	globalRateLimit := middleware.GlobalRateLimit()
	authRateLimit   := middleware.AuthRateLimit()
	// Cache-Control por tipo de contenido: lo que cambia poco (categorías de
	// células) cachea más tiempo que lo que el admin edita seguido (hero, feed)
	cacheShort := middleware.PublicCache(20)  // hero, eventos, feed, anuncios
	cacheMed   := middleware.PublicCache(60)  // blog, galería
	cacheLong  := middleware.PublicCache(300) // categorías de células (casi estáticas)

	// Aplicar Rate Limiter Global a todo el servidor
	e.Use(globalRateLimit)

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

	// Comprobantes bancarios — público: enviar el registro + subir la foto.
	// La subida es pública a propósito (un donante/asistente anónimo no
	// tiene cuenta) pero con carpeta FIJA "comprobantes" y rate-limit; el
	// /upload general sigue exigiendo login. Antes ambos formularios
	// públicos subían a /upload (auth) → un anónimo recibía 401 y NO podía
	// donar por transferencia ni subir su boleta.
	api.POST("/receipts", receiptHandler.Submit)
	api.POST("/receipts/upload", uploadHandler.UploadReceipt, middleware.AuthRateLimit())

	// Hero del home — público: obtener el activo
	api.GET("/hero/active", heroHandler.GetActive, cacheShort)

	// Fotos del sitio — público: solo los slots con foto subida
	api.GET("/site-photos", sitePhotoHandler.GetSitePhotos, cacheLong)

	// Configuración pública (datos bancarios, contacto) — administrable
	api.GET("/settings", siteSettingHandler.GetPublic, cacheShort)

	// Voluntariado
	api.POST("/volunteer/register",   volunteerHandler.Register)
	api.GET("/volunteer/departments", volunteerHandler.GetDepartments)
	api.GET("/volunteer/me",          volunteerHandler.GetMyInfo, authMW)

	// Auth
	authGroup := api.Group("/auth", authRateLimit)
	authGroup.POST("/register",        authHandler.RegisterDisabled)
	authGroup.POST("/login",           authHandler.Login)
	authGroup.GET("/verify-email",     authHandler.VerifyEmail)
	authGroup.POST("/forgot-password", authHandler.ForgotPassword)
	authGroup.POST("/reset-password",  authHandler.ResetPassword)

	// Blog (público: lectura)
	blogGroup := api.Group("/blog")
	blogGroup.GET("/",      blogHandler.GetPublishedPosts, cacheMed)
	blogGroup.GET("/:slug", blogHandler.GetPostBySlug, cacheMed)

	// Peticiones de oración
	contactGroup := api.Group("/contact")
	contactGroup.POST("/petition", petitionHandler.CreatePetition)

	// Tarjeta de conexión — visitante nuevo se registra él mismo
	api.POST("/connect-cards", connectCardHandler.Create)

	// Donaciones (registro local). PayPal fue removido (may-2026): sus
	// rutas se quitaron para no ocupar el router ni el rate-limit; los
	// handlers 410 Gone quedan solo por si un cliente viejo los llama.
	donationsGroup := api.Group("/donations")
	donationsGroup.POST("/register", donationHandler.RegisterDonation)

	// Eventos (público: lectura + RSVP) — con y sin slash final:
	// Echo no redirige entre ambos y el frontend histórico usa /events
	eventsGroup := api.Group("/events")
	eventsGroup.GET("",               eventHandler.GetEvents, cacheShort)
	eventsGroup.GET("/",              eventHandler.GetEvents, cacheShort)
	eventsGroup.POST("/:id/rsvp",    rsvpHandler.RegisterRSVP)

	// Células (público: lectura de categorías + listado seguro de células)
	cellsGroup := api.Group("/cell-categories")
	cellsGroup.GET("", cellCategoryHandler.GetCellCategories, cacheLong)
	cellsGroup.GET("/", cellCategoryHandler.GetCellCategories, cacheLong)
	api.GET("/cells", cellCategoryHandler.GetPublicCells, cacheLong)

	// Feed social
	api.GET("/social/feed", socialHandler.GetSocialFeed, cacheShort)

	// Anuncios (público — authMW opcional para filtrar por rol)
	api.GET("/announcements", announcementHandler.GetAnnouncements, cacheShort)

	// Galería pública
	galleryGroup := api.Group("/gallery")
	galleryGroup.GET("/", galleryHandler.GetPhotos, cacheMed)

	// FAQs públicas
	faqGroup := api.Group("/faqs")
	faqGroup.GET("/", faqHandler.GetFAQs, cacheLong)

	// Directorio de líderes (foto + contacto) — público solo activos
	api.GET("/leaders", leaderDirHandler.GetPublic, cacheShort)

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
	adminGroup.GET("/kpis/trend",         adminHandler.GetKPIsTrend)
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

	// Comprobantes bancarios — admin
	adminGroup.GET("/receipts",              receiptHandler.GetAll)
	adminGroup.PUT("/receipts/:id/verify",   receiptHandler.Verify)
	adminGroup.PUT("/receipts/:id/revert",   receiptHandler.Revert)
	adminGroup.GET("/receipts/count",        receiptHandler.GetPendingCount)

	// Hero CMS — admin
	adminGroup.GET("/hero",               heroHandler.GetAll)
	adminGroup.POST("/hero",              heroHandler.Create)
	adminGroup.PUT("/hero/:id",           heroHandler.Update)
	adminGroup.PUT("/hero/:id/activate",  heroHandler.Activate)
	adminGroup.DELETE("/hero/:id",        heroHandler.Delete)

	// Fotos del sitio (fondos ambiente de secciones fijas) — admin
	adminGroup.GET("/site-photos",       sitePhotoHandler.GetAllSitePhotos)
	adminGroup.PUT("/site-photos/:key",  sitePhotoHandler.UpdateSitePhoto)

	// Configuración de texto (datos bancarios) — admin
	adminGroup.GET("/settings",          siteSettingHandler.GetAll)
	adminGroup.PUT("/settings/:key",     siteSettingHandler.UpdateSetting)

	// Categorías de células — admin edita la foto de cada tipo
	adminGroup.GET("/cell-categories",      cellCategoryHandler.GetAllCellCategoriesAdmin)
	adminGroup.POST("/cell-categories",     cellCategoryHandler.CreateCellCategory)
	adminGroup.PUT("/cell-categories/:id",  cellCategoryHandler.UpdateCellCategoryImage)

	// Aprobación de reportes de células (solo admin)
	adminGroup.PUT("/cell-reports/:id/approve", cellReportHandler.ApproveReport)

	// Blog admin
	adminBlog := adminGroup.Group("/blog")
	adminBlog.GET("/",       blogHandler.GetAllPosts)
	adminBlog.POST("/",      blogHandler.CreatePost)
	adminBlog.PUT("/:id",    blogHandler.UpdatePost)
	adminBlog.DELETE("/:id", blogHandler.DeletePost)

	// Directorio de líderes (foto + contacto) — CRUD admin. Ruta DISTINTA
	// de GET /admin/leaders (arriba), que devuelve los USUARIOS con rol
	// líder para los selects de asignación de voluntarios/connect-cards.
	// Antes ambos usaban /admin/leaders: Echo dejaba ganar al último y
	// rompía silenciosamente esos selects.
	adminGroup.GET("/leader-directory",        leaderDirHandler.GetAll)
	adminGroup.POST("/leader-directory",       leaderDirHandler.Create)
	adminGroup.PUT("/leader-directory/:id",    leaderDirHandler.Update)
	adminGroup.DELETE("/leader-directory/:id", leaderDirHandler.Delete)

	// Peticiones admin
	adminGroup.GET("/petitions",          petitionHandler.GetAllPetitions)
	adminGroup.PUT("/petitions/:id/read", petitionHandler.MarkAsRead)
	adminGroup.DELETE("/petitions/:id",   petitionHandler.DeletePetition)

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

	// FAQs admin
	adminFAQs := adminGroup.Group("/faqs")
	adminFAQs.GET("/",       faqHandler.GetAllFAQs)
	adminFAQs.POST("/",      faqHandler.CreateFAQ)
	adminFAQs.PUT("/:id",    faqHandler.UpdateFAQ)
	adminFAQs.DELETE("/:id", faqHandler.DeleteFAQ)

	// Boletas (admin: eliminar)
	adminGroup.DELETE("/boletas/:id", boletaHandler.DeleteBoleta)

	// Tarjetas de conexión — admin elimina
	adminGroup.DELETE("/connect-cards/:id", connectCardHandler.Delete)

	// ── Admin o Líder ─────────────────────────────────────────────────────────────
	adminOrLeader := api.Group("/admin", authMW, adminOrLeaderMW)

	// PDF semanal de peticiones (admin Y líder lo usan para distribuir a intercessores)
	adminOrLeader.GET("/petitions/weekly", petitionHandler.GetWeeklyPetitions)

	// Usuarios
	adminOrLeader.POST("/users", adminHandler.CreateUser)

	// Voluntarios
	adminOrLeader.GET("/volunteers",                      volunteerHandler.GetAll)
	adminOrLeader.POST("/volunteers/:id/create-user",     volunteerHandler.CreateUserFromVolunteer)

	// Reportes de células
	adminOrLeader.POST("/cell-reports",      cellReportHandler.CreateCellReport)
	adminOrLeader.GET("/cell-reports",       cellReportHandler.GetAllCellReports)
	adminOrLeader.GET("/cell-reports/stats", cellReportHandler.GetCellStats)

	// Tarjetas de conexión — admin y líder ven la lista y dan seguimiento
	adminOrLeader.GET("/connect-cards",     connectCardHandler.GetAll)
	adminOrLeader.PUT("/connect-cards/:id", connectCardHandler.Update)

	// Boletas de nuevos miembros
	adminOrLeader.POST("/boletas",    boletaHandler.CreateBoleta)
	adminOrLeader.GET("/boletas",     boletaHandler.GetBoletas)
	adminOrLeader.PUT("/boletas/:id", boletaHandler.UpdateBoleta)

	// ── Panel Líder ───────────────────────────────────────────────────────────────
	// adminOrLeaderMW: sin él, cualquier usuario autenticado (incluido un
	// voluntario o miembro) podía leer /leader/kpis y /leader/cell-directory
	// (roster de líderes + conteos). Ahora exige rol líder o admin.
	leaderGroup := api.Group("/leader", authMW, adminOrLeaderMW)

	leaderGroup.GET("/kpis",            leaderDashHandler.GetLeaderKPIs)
	leaderGroup.GET("/cell-directory",  leaderDashHandler.GetCellDirectory)
	leaderGroup.GET("/notifications/counts", notificationHandler.GetCounts)
}

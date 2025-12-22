package routes

import (
	"casadelrey/backend/auth"
	"casadelrey/backend/handlers"
	"casadelrey/backend/middleware"

	"github.com/gofiber/fiber/v2"
)

// Handlers contiene todas las instancias de los handlers de la aplicación.
type Handlers struct {
	Auth     *auth.Handler
	Blog     *handlers.BlogHandler
	Petition *handlers.PetitionHandler
	Donation *handlers.DonationHandler
}

// SetupRoutes configura todas las rutas modulares del backend.
func SetupRoutes(app *fiber.App, h *Handlers, supabaseAuth fiber.Handler) {
	// Ruta de Salud (Health Check)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":  "ok",
			"service": "CasaDelRey Backend",
			"version": "MVP",
		})
	})

	// Grupo de API v1
	api := app.Group("/api/v1")

	// --- Public Routes ---

	// 1. Auth
	authRoutes := api.Group("/auth")
	authRoutes.Post("/register", h.Auth.Register)
	authRoutes.Post("/login", h.Auth.Login)
	authRoutes.Post("/forgot-password", h.Auth.ForgotPassword)
	authRoutes.Post("/reset-password", h.Auth.ResetPassword)


	// 2. Blog
	blog := api.Group("/blog")
	blog.Get("/", h.Blog.GetPublishedPosts)
	blog.Get("/:slug", h.Blog.GetPostBySlug)

	// 3. Contact/Petitions
	contact := api.Group("/contact")
	contact.Post("/petition", h.Petition.CreatePetition)

	// 4. Donations
	donations := api.Group("/donations")
	donations.Post("/simulate", h.Donation.SimulateDonation)

	// 5. Events
	events := api.Group("/events")
	events.Get("/", handlers.GetEventsPlaceholder)

	// --- Protected/Admin Routes ---
	admin := api.Group("/admin", supabaseAuth, middleware.AdminMiddleware())

	// 6. Admin Dashboard
	admin.Get("/dashboard", handlers.AdminDashboardPlaceholder)

	// 7. Admin Blog
	adminBlog := admin.Group("/blog")
	adminBlog.Post("/", h.Blog.CreatePost)
	adminBlog.Put("/:id", h.Blog.UpdatePost)

	// 8. Admin Petitions
	admin.Get("/petitions", h.Petition.GetAllPetitions)
	admin.Put("/petitions/:id/read", h.Petition.MarkAsRead)
}
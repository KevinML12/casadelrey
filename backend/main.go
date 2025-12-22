package main

import (
	"fmt"
	"log"
	"os"

	"casadelrey/backend/auth"
	"casadelrey/backend/config"
	"casadelrey/backend/handlers"
	"casadelrey/backend/middleware"
	"casadelrey/backend/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Cargar Configuración y Variables de Entorno
	config.LoadConfig()
	err := godotenv.Load()
	if err != nil {
		log.Println("Advertencia: no se pudo cargar el archivo .env")
	}

	// 2. Conectar a la Base de Datos
	db, err := config.InitDB()
	if err != nil {
		log.Fatalf("Error fatal: no se pudo conectar a la base de datos: %v", err)
	}

	// 3. Inicializar Fiber
	app := fiber.New()

	// 4. Configurar Middleware Global (CORS)
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173, https://casadelreyhue.org",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// 5. Inyección de Dependencias: Crear Instancias de Handlers y Middleware
	authHandler := auth.NewHandler(db)
	blogHandler := handlers.NewBlogHandler(db)
	petitionHandler := handlers.NewPetitionHandler(db)
	donationHandler := handlers.NewDonationHandler(db)
	
	supabaseAuth := middleware.NewSupabaseAuthMiddleware(db, config.AppConfig.JWTSecret)

	// 6. Configurar Rutas Modulares
	routes.SetupRoutes(app, &routes.Handlers{
		Auth:     authHandler,
		Blog:     blogHandler,
		Petition: petitionHandler,
		Donation: donationHandler,
	}, supabaseAuth)


	// 7. Iniciar Servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Servidor Go Fiber iniciado en http://localhost:%s\n", port)
	log.Fatal(app.Listen(fmt.Sprintf(":%s", port)))
}

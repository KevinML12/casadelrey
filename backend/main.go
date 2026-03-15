// Punto de entrada del servidor backend de Casa del Rey.
// Usa el framework Echo v4 con middlewares de Logger, Recover y CORS.
package main

import (
	"fmt"
	"log"
	"os"

	"casadelrey/backend/config"
	"casadelrey/backend/database"
	"casadelrey/backend/routes"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// 1. Cargar .env solo en desarrollo.
	//    En producción (Dokploy/Docker), las vars se inyectan directamente.
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("[Config] Archivo .env no encontrado — usando variables del sistema.")
		}
	}

	// 2. Cargar y validar la configuración desde variables de entorno.
	//    Termina con log.Fatal si DATABASE_URL o JWT_SECRET están ausentes.
	cfg := config.Load()

	// 3. Conectar a PostgreSQL (singleton GORM) y ejecutar AutoMigrate.
	//    Solo se abre UNA conexión durante todo el ciclo de vida del servidor.
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[DB] Error fatal al conectar: %v", err)
	}

	// 4. Crear la instancia de Echo.
	e := echo.New()
	e.HideBanner = true // Silenciar el banner ASCII en producción

	// 5. ─── Middlewares Globales ────────────────────────────────────────────

	// Logger: registra cada petición HTTP con método, ruta, status y latencia.
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "${time_rfc3339} | ${status} | ${latency_human} | ${remote_ip} | ${method} ${uri}\n",
	}))

	// Recover: captura panics inesperados y responde 500 en lugar de crashear.
	e.Use(middleware.Recover())

	// CORS: permite peticiones desde el frontend (local y producción).
	//       AllowOrigins acepta la URL del frontend configurada en CLIENT_URL.
	allowedOrigins := []string{
		"http://localhost:5173",        // Vite dev server
		"http://localhost:3000",        // Alternativa local
		"https://casadelreyhue.org",    // Producción
	}
	if cfg.ClientURL != "" {
		allowedOrigins = append(allowedOrigins, cfg.ClientURL)
	}
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: allowedOrigins,
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))

	// 6. Registrar todas las rutas (públicas y protegidas).
	routes.Register(e, db, cfg)

	// 7. Iniciar el servidor en el puerto configurado.
	port := cfg.Port
	fmt.Printf("\n✓ CasaDelRey Backend iniciado → http://0.0.0.0:%s\n\n", port)
	log.Fatal(e.Start(fmt.Sprintf(":%s", port)))
}

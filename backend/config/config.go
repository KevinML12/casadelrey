package config

import (
	"log"
	"os"

	"casadelrey/backend/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Config almacena toda la configuración de la aplicación
type Config struct {
	DatabaseURL  string
	JWTSecret    string
	StripeKey    string
	SendGridKey  string
	ClientURL    string
	Port         string
	SupabaseURL  string
	SupabaseKey  string
}

// AppConfig es la instancia global de configuración
var AppConfig *Config

// LoadConfig carga las variables de entorno y devuelve la configuración
func LoadConfig() *Config {
	// Cargar .env solo en desarrollo (no en producción)
	if os.Getenv("ENV") != "production" {
		err := godotenv.Load()
		if err != nil {
			log.Println("Advertencia: No se pudo cargar el archivo .env")
		}
	}

	config := &Config{
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		JWTSecret:    os.Getenv("JWT_SECRET"),
		StripeKey:    os.Getenv("STRIPE_SECRET_KEY"),
		SendGridKey:  os.Getenv("SENDGRID_API_KEY"),
		ClientURL:    os.Getenv("CLIENT_URL"),
		Port:         getEnvWithDefault("PORT", "8080"),
		SupabaseURL:  os.Getenv("SUPABASE_URL"),
		SupabaseKey:  os.Getenv("SUPABASE_KEY"),
	}

	// Validar configuraciones críticas
	if config.DatabaseURL == "" {
		log.Fatal("Error: DATABASE_URL no está configurada")
	}
	if config.JWTSecret == "" {
		log.Fatal("Error: JWT_SECRET no está configurada")
	}
	if config.SupabaseURL == "" {
		log.Fatal("Error: SUPABASE_URL no está configurada")
	}
	if config.SupabaseKey == "" {
		log.Fatal("Error: SUPABASE_KEY no está configurada")
	}

	// Guardar en variable global para acceso desde otros paquetes
	AppConfig = config

	log.Println("Configuración cargada exitosamente")
	return config
}

// getEnvWithDefault obtiene una variable de entorno o devuelve un valor por defecto
func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// InitDB inicializa la conexión a la base de datos y ejecuta las migraciones
func InitDB() (*gorm.DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("Error: DATABASE_URL no está configurada. ¡Requerida para seguridad!")
	}

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Migración: Crea las tablas si no existen
	log.Println("Iniciando migración de la base de datos...")
	err = db.AutoMigrate(&models.User{}, &models.Post{}, &models.Petition{}, &models.Donation{})
	if err != nil {
		return nil, err
	}
	log.Println("Migración completada con éxito.")
	return db, nil
}

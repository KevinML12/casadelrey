package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config almacena toda la configuración de la aplicación
type Config struct {
	DatabaseURL string
	JWTSecret   string
	StripeKey   string
	SendGridKey string
	ClientURL   string
	Port        string
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
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		StripeKey:   os.Getenv("STRIPE_SECRET_KEY"),
		SendGridKey: os.Getenv("SENDGRID_API_KEY"),
		ClientURL:   os.Getenv("CLIENT_URL"),
		Port:        getEnvWithDefault("PORT", "8080"),
	}

	// Validar configuraciones críticas
	if config.DatabaseURL == "" {
		log.Fatal("Error: DATABASE_URL no está configurada")
	}
	if config.JWTSecret == "" {
		log.Fatal("Error: JWT_SECRET no está configurada")
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

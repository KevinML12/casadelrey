// Package config gestiona la carga y validación de variables de entorno.
// Expone AppConfig como singleton global para compatibilidad con paquetes
// que lo referencian directamente (ej: auth.service.go).
package config

import (
	"log"
	"os"
)

// Config agrupa toda la configuración de la aplicación, cargada
// desde variables de entorno o desde un archivo .env en desarrollo.
type Config struct {
	DatabaseURL string // Requerida: URL de conexión a PostgreSQL
	JWTSecret   string // Requerida: clave secreta para firmar tokens JWT
	ClientURL   string // URL del frontend (para CORS dinámico)
	StripeKey   string // Clave secreta de Stripe (pagos, opcional en MVP)
	SendGridKey string // Clave de SendGrid (envío de emails)
	SupabaseURL string // URL de Supabase (si se usa como proveedor de auth)
	SupabaseKey string // Clave de Supabase
	Port        string // Puerto HTTP del servidor (default: 8080)
}

// AppConfig es la instancia global de configuración.
// Se inicializa llamando a Load() en main.go.
var AppConfig *Config

// Load carga las variables de entorno y retorna la configuración validada.
// Termina la aplicación (log.Fatal) si alguna variable crítica está ausente.
// También asigna la instancia a AppConfig para acceso global.
func Load() *Config {
	cfg := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		ClientURL:   os.Getenv("CLIENT_URL"),
		StripeKey:   os.Getenv("STRIPE_SECRET_KEY"),
		SendGridKey: os.Getenv("SENDGRID_API_KEY"),
		SupabaseURL: os.Getenv("SUPABASE_URL"),
		SupabaseKey: os.Getenv("SUPABASE_KEY"),
		Port:        getEnvOrDefault("PORT", "8080"),
	}

	// Variables críticas sin las cuales la aplicación no puede funcionar.
	if cfg.DatabaseURL == "" {
		log.Fatal("FATAL: DATABASE_URL no está configurada. Es requerida.")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("FATAL: JWT_SECRET no está configurada. Es requerida.")
	}

	// Asignar singleton global para retrocompatibilidad con otros paquetes.
	AppConfig = cfg

	log.Println("[Config] Variables de entorno cargadas correctamente.")
	return cfg
}

// getEnvOrDefault retorna el valor de una variable de entorno
// o el valor por defecto si la variable no está definida.
func getEnvOrDefault(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

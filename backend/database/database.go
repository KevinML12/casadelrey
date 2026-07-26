// Package database gestiona la conexión singleton a PostgreSQL mediante GORM.
// Garantiza que solo exista una instancia de la conexión durante todo el
// ciclo de vida de la aplicación, usando el patrón sync.Once.
package database

import (
	"log"
	"sync"
	"time"

	"casadelrey/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// instance es la única conexión activa a la base de datos.
// Se inicializa una sola vez gracias a sync.Once.
var (
	instance *gorm.DB
	once     sync.Once
)

// Connect establece la conexión a PostgreSQL y ejecuta las migraciones
// automáticas. Implementa el patrón Singleton: si la función ya fue llamada,
// devuelve la misma instancia sin abrir una nueva conexión.
//
// Parámetros:
//   - databaseURL: cadena de conexión obtenida de os.Getenv("DATABASE_URL")
//
// Retorna la instancia compartida de *gorm.DB o un error si la conexión falla.
func Connect(databaseURL string) (*gorm.DB, error) {
	var connectErr error

	once.Do(func() {
		log.Println("[DB] Iniciando conexión a PostgreSQL...")

		db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
			// En producción: Logger en modo Warn (solo consultas lentas + errores).
			// Cambiar a logger.Info en desarrollo para ver todas las queries SQL.
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err != nil {
			connectErr = err
			return
		}

		// Obtener el pool de conexiones subyacente para tunearlo.
		sqlDB, err := db.DB()
		if err != nil {
			connectErr = err
			return
		}

		// Pool de conexiones: ajustar según la carga esperada del servidor.
		// CORRECCIÓN (jul-2026): el valor anterior (40) asumía que el pooler
		// de Supabase soportaba ~60 conexiones -- FALSO, confirmado con el
		// error real en logs de producción: "max clients reached in session
		// mode - max clients are limited to pool_size: 15". Con 40 aquí, un
		// pico de tráfico normal (varios requests concurrentes) agotaba el
		// límite REAL de Supabase (15) mucho antes que el límite configurado
		// en este pool, causando errores intermitentes reales en endpoints
		// públicos (ej. GetEvents fallando con "failed to connect"). Bajado
		// a 10 -- deja margen para el dashboard de Supabase y otras conexiones.
		sqlDB.SetMaxIdleConns(5)               // Conexiones inactivas en el pool
		sqlDB.SetMaxOpenConns(10)              // Conexiones simultáneas máximas
		sqlDB.SetConnMaxLifetime(time.Hour)    // Tiempo máximo de vida de una conexión

		// AutoMigrate crea o altera las tablas para que coincidan con los modelos.
		// Es idempotente: seguro de ejecutar en cada arranque del servidor.
		log.Println("[DB] Ejecutando AutoMigrate...")
		if err := db.AutoMigrate(
			// Core
			&models.User{},
			&models.Cell{},             // NUEVA — normaliza células
			// Contenido
			&models.Post{},
			&models.Announcement{},
			&models.GalleryPhoto{},
			&models.SocialPost{},
			&models.FAQ{},
			// Células
			&models.CellCategory{},     // categorías públicas (Grupos de Vida)
			&models.CellReport{},
			&models.MemberBoleta{},
			// Eventos
			&models.Event{},
			&models.EventRegistration{},
			// Pagos
			&models.PaymentReceipt{},   // NUEVA — verifica comprobantes bancarios
			&models.Donation{},
			&models.DonationPurpose{},  // NUEVA — destinos de donación editables desde el admin
			// Personas
			&models.Leader{},           // directorio de líderes (foto + contacto)
			&models.Volunteer{},
			&models.VolunteerArea{},    // NUEVA — departamentos editables desde el admin
			&models.Petition{},
			&models.ConnectCard{}, // NUEVA — tarjeta de conexión para visitantes nuevos
			// CMS
			&models.HeroSetting{},
			&models.SitePhoto{},
			&models.SiteSetting{}, // config texto administrable (datos bancarios)
			// Sistema
			&models.UserGoal{},
			&models.ActivityLog{},
		); err != nil {
			connectErr = err
			return
		}

		log.Println("[DB] Conexión y migraciones completadas exitosamente.")
		instance = db
	})

	return instance, connectErr
}

// GetDB devuelve la instancia singleton de la base de datos.
// Útil para acceder a la DB desde cualquier paquete sin reinicializar.
// Llama a Connect() primero; de lo contrario, retorna nil.
func GetDB() *gorm.DB {
	return instance
}

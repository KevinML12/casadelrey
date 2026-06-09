package testutils

import (
	"log"

	"casadelrey/backend/models"

	"github.com/glebarez/sqlite"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// SetupTestDB inicializa una base de datos SQLite en memoria
// y migra todos los modelos para poder hacer pruebas unitarias y E2E
// sin afectar la base de datos de Supabase.
func SetupTestDB() *gorm.DB {
	// Usamos file::memory:?cache=shared para mantener la DB viva en memoria durante el test
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), // Silenciar logs para no ensuciar la consola de tests
	})
	if err != nil {
		log.Fatalf("Error inicializando la base de datos SQLite de pruebas: %v", err)
	}

	// Migramos los esquemas principales que usaremos en los tests
	err = db.AutoMigrate(
		&models.User{},
		&models.Cell{},
		&models.Donation{},
		&models.Event{},
		&models.CellReport{},
		&models.Petition{},
		&models.UserGoal{},
	)
	if err != nil {
		log.Fatalf("Error migrando base de datos de prueba: %v", err)
	}

	return db
}

// SetupTestServer inicializa un servidor Echo básico para pruebas
func SetupTestServer() *echo.Echo {
	e := echo.New()
	// Aquí se pueden inyectar middlewares de validación genéricos si es necesario
	return e
}

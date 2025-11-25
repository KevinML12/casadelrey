package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB inicializa la conexión a la base de datos y ejecuta las migraciones
func InitDB(databaseURL string, models ...interface{}) {
	if databaseURL == "" {
		log.Fatal("Error: DATABASE_URL no está configurada. ¡Requerida para seguridad!")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error al conectar a la base de datos: %v", err)
	}

	// Migración: Crea las tablas si no existen
	log.Println("Iniciando migración de la base de datos...")
	err = DB.AutoMigrate(models...)
	if err != nil {
		log.Fatalf("Error durante la migración: %v", err)
	}
	log.Println("Migración completada con éxito.")
}

// Seed de usuarios desde CSV. Ejecutar: go run ./cmd/seed
package main

import (
	"encoding/csv"
	"log"
	"os"
	"path/filepath"

	"casadelrey/backend/auth"
	"casadelrey/backend/config"
	"casadelrey/backend/database"
	"casadelrey/backend/models"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[Seed] .env no encontrado, usando variables del sistema")
	}
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[Seed] Error conectando a DB: %v", err)
	}

	// Ruta al CSV (relativa al directorio backend)
	csvPath := filepath.Join("scripts", "users_seed.csv")
	if _, err := os.Stat(csvPath); os.IsNotExist(err) {
		log.Fatalf("[Seed] No se encontró %s", csvPath)
	}

	f, err := os.Open(csvPath)
	if err != nil {
		log.Fatalf("[Seed] Error abriendo CSV: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	rows, err := r.ReadAll()
	if err != nil {
		log.Fatalf("[Seed] Error leyendo CSV: %v", err)
	}

	if len(rows) < 2 {
		log.Fatal("[Seed] CSV vacío o solo encabezados")
	}

	header := rows[0]
	// Validar columnas esperadas: email, name, role, password
	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[h] = i
	}
	for _, k := range []string{"email", "name", "role", "password"} {
		if _, ok := colIdx[k]; !ok {
			log.Fatalf("[Seed] Falta columna requerida: %s", k)
		}
	}

	created := 0
	for _, row := range rows[1:] {
		if len(row) < 4 {
			continue
		}
		email := row[colIdx["email"]]
		name := row[colIdx["name"]]
		role := row[colIdx["role"]]
		password := row[colIdx["password"]]

		if email == "" || name == "" || password == "" {
			log.Printf("[Seed] Fila incompleta, saltando: %v", row)
			continue
		}
		if role == "" {
			role = "member"
		}

		var existing models.User
		if db.Where("email = ?", email).First(&existing).Error == nil {
			log.Printf("[Seed] Usuario ya existe: %s", email)
			continue
		}

		hashed, err := auth.HashPassword(password)
		if err != nil {
			log.Printf("[Seed] Error hasheando contraseña para %s: %v", email, err)
			continue
		}

		u := models.User{
			Name:          name,
			Email:         email,
			Password:      hashed,
			Role:          role,
			EmailVerified: true, // Seed users: verificación pre-aprobada
		}
		if err := db.Create(&u).Error; err != nil {
			log.Printf("[Seed] Error creando usuario %s: %v", email, err)
			continue
		}
		log.Printf("[Seed] Creado: %s (%s) rol=%s", email, name, role)
		created++
	}

	log.Printf("[Seed] Listo. Usuarios creados: %d", created)
}

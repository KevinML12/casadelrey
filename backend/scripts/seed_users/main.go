package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"casadelrey/backend/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func hash(pw string) string {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	return string(b)
}

func main() {
	_ = godotenv.Load("../../.env")
	
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL no configurada. Por favor, exporta DATABASE_URL antes de ejecutar.")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		log.Fatalf("Error BD: %v", err)
	}

	fmt.Println("Conexión establecida. Iniciando semilla de usuarios...")
	fmt.Println("====================================================")

	defaultPassword := "CasaDelRey2026!"
	hashedPw := hash(defaultPassword)

	// 1. Crear a los administradores
	admins := []models.User{
		{Name: "Leonel de León", Email: "leonel@casadelrey.org", Role: "admin"},
		{Name: "Cristian de León", Email: "cristian@casadelrey.org", Role: "admin"},
		{Name: "Ismeina Castillo", Email: "ismeina@casadelrey.org", Role: "admin"},
	}

	for _, admin := range admins {
		var ex models.User
		if db.Where("email = ?", admin.Email).First(&ex).Error == nil {
			ex.Role = "admin" // Asegurar que sea admin
			db.Save(&ex)
			fmt.Printf(" [~] Admin actualizado: %s (%s)\n", admin.Name, admin.Email)
		} else {
			admin.Password = hashedPw
			admin.EmailVerified = true
			db.Create(&admin)
			fmt.Printf(" [+] Admin creado: %s (%s)\n", admin.Name, admin.Email)
		}
	}

	// 2. Crear cuentas para líderes de célula (a partir de la tabla de directorio de líderes o reportes si es necesario)
	fmt.Println("\nBuscando líderes sin cuenta de usuario asociada...")

	var leaders []models.Leader
	db.Find(&leaders)

	creados := 0
	for _, l := range leaders {
		if l.UserID == nil || *l.UserID == 0 {
			// No tiene cuenta, generamos un email genérico si no tiene
			email := l.Email
			if email == "" {
				cleanName := strings.ReplaceAll(strings.ToLower(l.Name), " ", ".")
				email = fmt.Sprintf("%s@casadelrey.org", cleanName)
			}

			// Revisar si ese correo ya está en la base de datos de usuarios
			var ex models.User
			if db.Where("email = ?", email).First(&ex).Error == nil {
				// Ya existe un usuario con ese correo, solo lo enlazamos y nos aseguramos de que sea líder o admin
				if ex.Role != "admin" {
					ex.Role = "leader"
					db.Save(&ex)
				}
				l.UserID = &ex.ID
				db.Save(&l)
				fmt.Printf(" [~] Líder enlazado a usuario existente: %s (%s)\n", l.Name, email)
			} else {
				// Crear usuario nuevo
				newUser := models.User{
					Name:          l.Name,
					Email:         email,
					Password:      hashedPw,
					Role:          "leader",
					EmailVerified: true,
				}
				db.Create(&newUser)
				
				// Enlazar líder con el nuevo usuario
				l.UserID = &newUser.ID
				db.Save(&l)
				
				fmt.Printf(" [+] Líder creado: %s (Email: %s)\n", l.Name, email)
				creados++
			}
		}
	}

	fmt.Println("====================================================")
	fmt.Println("Semilla completada.")
	fmt.Printf("Nuevos líderes creados: %d\n", creados)
	fmt.Println("Contraseña por defecto para todas las cuentas nuevas: " + defaultPassword)
}

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

	// 2. Crear cuentas para líderes específicos (basado en capturas)
	explicitLeaders := []models.User{
		{Name: "Hugo Maldonado", Email: "hugo.maldonado@casadelrey.org", Role: "leader"},
		{Name: "Paula Ríos", Email: "paula.rios@casadelrey.org", Role: "leader"},
		{Name: "Sucely Rivas", Email: "sucely.rivas@casadelrey.org", Role: "leader"},
	}

	creados := 0
	for _, l := range explicitLeaders {
		var ex models.User
		if db.Where("email = ?", l.Email).First(&ex).Error == nil {
			if ex.Role != "admin" {
				ex.Role = "leader"
				db.Save(&ex)
			}
			fmt.Printf(" [~] Líder actualizado: %s (%s)\n", l.Name, l.Email)
		} else {
			l.Password = hashedPw
			l.EmailVerified = true
			db.Create(&l)
			fmt.Printf(" [+] Líder creado: %s (%s)\n", l.Name, l.Email)
			creados++
		}
	}

	fmt.Println("====================================================")
	fmt.Println("Semilla completada.")
	fmt.Printf("Nuevos líderes creados: %d\n", creados)
	fmt.Println("Contraseña por defecto para todas las cuentas nuevas: " + defaultPassword)
}

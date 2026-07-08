package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"casadelrey/backend/config"
	"casadelrey/backend/database"
	"casadelrey/backend/models"
	"casadelrey/backend/storage"

	"github.com/joho/godotenv"
)

func main() {
	// Cargar variables de entorno del root del backend
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Println("[Warning] No se pudo cargar .env, usando variables del sistema")
	}

	cfg := config.Load()
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Error al conectar a DB: %v", err)
	}

	store := storage.New()
	if store.ActiveBackend() != storage.BackendR2 {
		log.Println("[Warning] El backend activo no es R2. Revisa tus variables CF_R2_*")
	} else {
		log.Println("[OK] Conectado a Cloudflare R2")
	}

	// Rutas a procesar
	baseDirs := []string{
		`../../../frontend/DOMINGOS 2026`,
		`../../../frontend/WILD YOUTH FOTOGRAFRÍAS`,
	}

	ctx := context.Background()

	// Obtener el ID del admin genérico o crearlo para asociarlo a la foto
	var adminUser models.User
	if err := db.Where("role = ?", "admin").First(&adminUser).Error; err != nil {
		log.Fatalf("No se encontró ningún usuario admin para asociar las fotos: %v", err)
	}

	for _, baseDir := range baseDirs {
		log.Printf("\n--- Procesando base dir: %s ---\n", baseDir)
		
		if _, err := os.Stat(baseDir); os.IsNotExist(err) {
			log.Printf("El directorio %s no existe, saltando...", baseDir)
			continue
		}

		err = filepath.Walk(baseDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			
			// Si es directorio o archivo oculto, saltar
			if info.IsDir() || strings.HasPrefix(info.Name(), ".") {
				return nil
			}

			// Validar extensión
			ext := strings.ToLower(filepath.Ext(path))
			if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
				return nil
			}

			// Obtener nombre de la carpeta contenedora como título
			parentDir := filepath.Base(filepath.Dir(path))
			
			// Si la foto está directamente en la raíz del baseDir, usar el nombre del baseDir
			if filepath.Clean(filepath.Dir(path)) == filepath.Clean(baseDir) {
				parentDir = filepath.Base(baseDir)
			}
			
			// Limpiar un poco el nombre para que sea bonito (por el caracter raro en Wild Youth)
			parentDir = strings.TrimSpace(strings.ReplaceAll(parentDir, "", ""))
			title := fmt.Sprintf("%s - %s", parentDir, strings.TrimSuffix(info.Name(), ext))

			log.Printf("Subiendo: %s (Título: %s)", info.Name(), title)

			// Abrir archivo
			file, err := os.Open(path)
			if err != nil {
				log.Printf("Error al abrir archivo %s: %v", path, err)
				return nil
			}
			defer file.Close()

			// Subir a R2 en la carpeta "galeria"
			uniqueName := storage.UniqueFilename(info.Name())
			contentType := "image/jpeg"
			if ext == ".png" {
				contentType = "image/png"
			} else if ext == ".webp" {
				contentType = "image/webp"
			}

			url, err := store.Upload(ctx, "galeria", uniqueName, file, info.Size(), contentType)
			if err != nil {
				log.Printf("Error al subir archivo a R2 %s: %v", path, err)
				return nil
			}

			// Insertar en Base de Datos
			photo := models.GalleryPhoto{
				Title:        title,
				URL:          url,
				UploadedByID: adminUser.ID,
				IsActive:     true,
			}

			if result := db.Create(&photo); result.Error != nil {
				log.Printf("Error al guardar %s en base de datos: %v", info.Name(), result.Error)
			} else {
				log.Printf("✓ Guardado en DB exitosamente: %s", url)
			}
			
			// Pequeño delay para no saturar la red (opcional)
			time.Sleep(200 * time.Millisecond)

			return nil
		})

		if err != nil {
			log.Printf("Error recorriendo el directorio %s: %v", baseDir, err)
		}
	}
	
	log.Println("\n--- Subida Masiva Completada ---")
}

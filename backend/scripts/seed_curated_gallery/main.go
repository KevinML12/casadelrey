// Sube los 55 apartados curados de Galería (ya optimizados en
// frontend/public/images/gallery/<slug>/N.jpg) a Cloudflare R2 y los
// registra como GalleryPhoto reales — reemplaza el hack de fotos
// hardcodeadas en el frontend por el flujo correcto: R2 + DB, igual
// que cualquier foto que suba el admin desde el panel.
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"casadelrey/backend/config"
	"casadelrey/backend/database"
	"casadelrey/backend/models"
	"casadelrey/backend/storage"

	"github.com/joho/godotenv"
)

type album struct {
	name  string // título visible — el frontend agrupa por "Nombre - N"
	slug  string // carpeta en frontend/public/images/gallery/<slug>/
	count int
}

var albums = []album{
	{"Alabanza", "alabanza", 8},
	{"Danza", "danza", 8},
	{"Niños", "ninos", 8},
	{"Miembros", "miembros", 8},
	{"Jóvenes", "jovenes", 8},
	{"Mujeres", "mujeres", 8},
	{"Liderazgo", "liderazgo", 7},
}

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("[Warning] No se pudo cargar .env, usando variables del sistema")
	}

	cfg := config.Load()
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Error al conectar a DB: %v", err)
	}

	store := storage.New()
	if store.ActiveBackend() != storage.BackendR2 {
		log.Fatal("El backend activo NO es R2 (revisa CF_R2_* en .env) — abortando para no guardar URLs locales.")
	}
	log.Println("[OK] Conectado a Cloudflare R2")

	var adminUser models.User
	if err := db.Where("role = ?", "admin").First(&adminUser).Error; err != nil {
		log.Fatalf("No se encontró ningún usuario admin para asociar las fotos: %v", err)
	}

	ctx := context.Background()
	srcRoot := `../../../frontend/public/images/gallery`
	total := 0

	for _, a := range albums {
		for i := 1; i <= a.count; i++ {
			path := filepath.Join(srcRoot, a.slug, fmt.Sprintf("%d.jpg", i))
			file, err := os.Open(path)
			if err != nil {
				log.Printf("✗ No se pudo abrir %s: %v", path, err)
				continue
			}
			info, _ := file.Stat()

			uniqueName := storage.UniqueFilename(fmt.Sprintf("%s_%d.jpg", a.slug, i))
			url, err := store.Upload(ctx, "galeria", uniqueName, file, info.Size(), "image/jpeg")
			file.Close()
			if err != nil {
				log.Printf("✗ Error al subir %s a R2: %v", path, err)
				continue
			}

			photo := models.GalleryPhoto{
				Title:        fmt.Sprintf("%s - %d", a.name, i),
				URL:          url,
				UploadedByID: adminUser.ID,
				IsActive:     true,
			}
			if result := db.Create(&photo); result.Error != nil {
				log.Printf("✗ Error al guardar en DB %s: %v", photo.Title, result.Error)
				continue
			}
			log.Printf("✓ %s -> %s", photo.Title, url)
			total++
		}
	}

	log.Printf("\n--- Listo: %d/%d fotos subidas a R2 y registradas ---\n", total, 55)
}

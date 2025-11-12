package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Modelo de la Petición
type Petition struct {
	gorm.Model        // Campos automáticos: ID, CreatedAt, UpdatedAt, DeletedAt
	Name       string `json:"name" validate:"required"`
	Email      string `json:"email" validate:"required,email"`
	Phone      string `json:"phone"` // Opcional
	Message    string `json:"message" validate:"required"`
	IsPrayer   bool   `json:"is_prayer"` // Indica si es una petición de oración o contacto
}

// Modelo de Donación
type Donation struct {
	gorm.Model
	Name          string  `json:"name"`
	Email         string  `json:"email" validate:"required,email"`
	Amount        float64 `json:"amount" validate:"required,gt=0"`
	PaymentMethod string  `json:"payment_method"`
	Message       string  `json:"message"`
	Status        string  `json:"status"`         // Pending, Completed, Failed
	TransactionID string  `json:"transaction_id"` // ID de la transacción de la pasarela
}

var DB *gorm.DB

func initDB() {
	// Cargar .env para desarrollo local
	if os.Getenv("ENV") != "production" {
		err := godotenv.Load()
		if err != nil {
			log.Println("Advertencia: No se pudo cargar el archivo .env")
		}
	}

	// DATABASE_URL es la variable de entorno para ElephantSQL
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("Error: DATABASE_URL no está configurada. ¡Requerida para seguridad!")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error al conectar a la base de datos: %v", err)
	}

	// Migración: Crea las tablas 'petitions' y 'donations' si no existen
	log.Println("Iniciando migración de la base de datos...")
	err = DB.AutoMigrate(&Petition{}, &Donation{})
	if err != nil {
		log.Fatalf("Error durante la migración: %v", err)
	}
	log.Println("Migración completada con éxito.")
}

func createPetition(c echo.Context) error {
	p := new(Petition)
	if err := c.Bind(p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos"})
	}

	// Validación básica
	if p.Name == "" || p.Message == "" || p.Email == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre, correo y mensaje son requeridos."})
	}

	if result := DB.Create(&p); result.Error != nil {
		log.Printf("Error al guardar petición: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Fallo al guardar la petición."})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Petición guardada con éxito",
		"id":      p.ID,
	})
}

// Handler para CREAR LA ORDEN DE DONACIÓN (preparado para integración real)
func createDonationOrder(c echo.Context) error {
	d := new(Donation)
	if err := c.Bind(d); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos"})
	}

	// Validaciones mínimas
	if d.Email == "" || d.Amount <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Email y Monto mayor a 0 son requeridos."})
	}

	// Lógica REAL de Pasarela de Pago (SIMULADA para MVP):
	// 1. Aquí se llamaría a la API de Ebi Pay/PayPal/Stripe para crear la orden.

	// Registramos la donación con estado PENDIENTE
	d.Status = "Pending"
	d.TransactionID = "ORD-CDR-" + d.Email[:4] // ID de Orden Ficticio
	if d.PaymentMethod == "" {
		d.PaymentMethod = "Ebi Pay" // Establecemos el método por defecto para este MVP
	}

	if result := DB.Create(&d); result.Error != nil {
		log.Printf("Error al registrar orden de donación: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Fallo al crear la orden de donación."})
	}

	// 2. Devolvemos la URL de redirección (ficticia) al frontend
	// NOTA: Esta URL de redirección es la que enviaría Ebi Pay
	redirectURL := "https://ebi.pay.simulated/checkout?order_id=" + d.TransactionID

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":      "Orden de donación creada con éxito. Redirigiendo a Ebi Pay...",
		"order_id":     d.TransactionID,
		"redirect_url": redirectURL, // CLAVE para la integración
	})
}

func main() {
	initDB() // Inicializar la DB al inicio

	e := echo.New()

	// Middleware de Seguridad Básico y Logs
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Configuración CORS simple (Permitir todo temporalmente)
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"}, // Se refinará en el prompt de despliegue
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
		AllowMethods: []string{"GET", "POST"},
	}))

	// --- RUTAS API ---
	e.GET("/api/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "CasaDelRey Backend API",
		})
	})

	// RUTA: Recibir peticiones de contacto/oración
	e.POST("/api/contact/petition", createPetition)

	// RUTA: Crear orden de donación (preparado para integración con pasarela)
	e.POST("/api/donations/order", createDonationOrder)

	// -------------------------------------------------------------------
	// CONFIGURACIÓN DE DESPLIEGUE HÍBRIDO (Fly.io sirve el build de React)
	// -------------------------------------------------------------------

	// Determinar el modo de ejecución
	isProduction := os.Getenv("ENV") == "production"

	if isProduction {
		// 1. Servir archivos estáticos (el build de React)
		// Se asume que la carpeta 'dist' de React estará en la raíz del backend al final del build de Go.
		e.Static("/", "../frontend/dist")

		// 2. Fallback para rutas de frontend (Historial API)
		e.GET("/*", func(c echo.Context) error {
			return c.File("../frontend/dist/index.html")
		})
		log.Println("Modo Producción activado: Sirviendo frontend desde el build.")
	} else {
		log.Println("Modo Desarrollo activado: Frontend servido por Vite (puerto 3000).")
	}

	// --- INICIO DEL SERVIDOR ---
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Iniciando servidor en el puerto: %s", port)
	if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}

// Dependencias requeridas:
// go get github.com/labstack/echo/v4
// go get github.com/labstack/echo/v4/middleware
// go get gorm.io/gorm
// go get gorm.io/driver/postgres
// go get github.com/joho/godotenv

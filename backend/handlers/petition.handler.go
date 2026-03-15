package handlers

import (
	"log"
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// PetitionHandler maneja las peticiones de oración de los visitantes.
type PetitionHandler struct {
	DB *gorm.DB
}

// NewPetitionHandler crea una nueva instancia del handler de peticiones.
func NewPetitionHandler(db *gorm.DB) *PetitionHandler {
	return &PetitionHandler{DB: db}
}

// CreatePetition godoc
// POST /api/v1/contact/petition
// Recibe y guarda una petición de oración pública (no requiere autenticación).
func (h *PetitionHandler) CreatePetition(c echo.Context) error {
	p := new(models.Petition)
	if err := c.Bind(p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	// Validar campos mínimos requeridos
	if p.Name == "" || p.Subject == "" || p.Message == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Nombre, asunto y mensaje son obligatorios.",
		})
	}

	if result := h.DB.Create(p); result.Error != nil {
		log.Printf("[Petition] Error al guardar petición: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo guardar la petición. Inténtalo de nuevo.",
		})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "¡Petición recibida! Te incluiremos en nuestras oraciones.",
		"id":      p.ID,
	})
}

// GetAllPetitions godoc
// GET /api/v1/admin/petitions  [Requiere auth + rol admin]
// Lista todas las peticiones, ordenadas por más recientes primero.
func (h *PetitionHandler) GetAllPetitions(c echo.Context) error {
	var petitions []models.Petition
	if result := h.DB.Order("created_at DESC").Find(&petitions); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener las peticiones.",
		})
	}
	return c.JSON(http.StatusOK, petitions)
}

// MarkAsRead godoc
// PUT /api/v1/admin/petitions/:id/read  [Requiere auth + rol admin]
// Marca una petición como respondida/leída por el equipo pastoral.
func (h *PetitionHandler) MarkAsRead(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "ID de petición inválido.",
		})
	}

	var petition models.Petition
	if result := h.DB.First(&petition, id); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Petición no encontrada.",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al buscar la petición.",
		})
	}

	petition.IsAnswered = true
	if result := h.DB.Save(&petition); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo actualizar el estado de la petición.",
		})
	}

	return c.JSON(http.StatusOK, petition)
}

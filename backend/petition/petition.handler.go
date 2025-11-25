package petition

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Handler maneja las peticiones
type Handler struct {
	DB *gorm.DB
}

// NewHandler crea un nuevo handler de peticiones
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

// CreatePetition crea una nueva petición
func (h *Handler) CreatePetition(c echo.Context) error {
	p := new(Petition)
	if err := c.Bind(p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos"})
	}

	// Validar con el validador registrado
	if err := c.Validate(p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
	}

	if result := h.DB.Create(&p); result.Error != nil {
		log.Printf("Error al guardar petición: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Fallo al guardar la petición."})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Petición guardada con éxito",
		"id":      p.ID,
	})
}

// GetAllPetitions obtiene todas las peticiones (solo admin)
func (h *Handler) GetAllPetitions(c echo.Context) error {
	var petitions []Petition

	// Ordenar por fecha de creación descendente (más recientes primero)
	if result := h.DB.Order("created_at DESC").Find(&petitions); result.Error != nil {
		log.Printf("Error al obtener peticiones: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener las peticiones",
		})
	}

	return c.JSON(http.StatusOK, petitions)
}

// MarkAsRead marca una petición como leída
func (h *Handler) MarkAsRead(c echo.Context) error {
	id := c.Param("id")

	var petition Petition
	if result := h.DB.First(&petition, id); result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Petición no encontrada",
		})
	}

	// Actualizar el campo is_read
	petition.IsRead = true
	if result := h.DB.Save(&petition); result.Error != nil {
		log.Printf("Error al actualizar petición: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al actualizar la petición",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":  "Petición marcada como leída",
		"petition": petition,
	})
}

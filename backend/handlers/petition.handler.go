package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

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
// Lista todas las peticiones con búsqueda y paginación.
func (h *PetitionHandler) GetAllPetitions(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Model(&models.Petition{})
	if search := c.QueryParam("q"); search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ? OR subject ILIKE ? OR message ILIKE ?", like, like, like)
	}
	if isRead := c.QueryParam("is_read"); isRead != "" {
		q = q.Where("is_read = ?", isRead == "true")
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var petitions []models.Petition
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&petitions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener las peticiones.",
		})
	}
	return c.JSON(http.StatusOK, PagedResponse{Data: petitions, Meta: newMeta(total, page, limit)})
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

// DeletePetition godoc
// DELETE /api/v1/admin/petitions/:id  [Requiere auth + rol admin]
// Elimina una petición (soft-delete de GORM — conserva el registro con
// deleted_at para auditoría). Lo usa el panel pastoral y la limpieza de
// los tests E2E (regla del repo: todo test borra los datos que crea).
func (h *PetitionHandler) DeletePetition(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "ID de petición inválido.",
		})
	}

	result := h.DB.Delete(&models.Petition{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo eliminar la petición.",
		})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Petición no encontrada.",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Petición eliminada correctamente.",
	})
}

// GetWeeklyPetitions godoc
// GET /api/v1/admin/petitions/weekly  [Requiere auth + rol admin o leader]
// Retorna todas las peticiones de la semana en curso (lunes–domingo)
// para ser impresas y distribuidas a los intercesores.
func (h *PetitionHandler) GetWeeklyPetitions(c echo.Context) error {
	now := time.Now()

	// Calcular lunes de la semana actual
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // domingo = 7
	}
	startOfWeek := time.Date(now.Year(), now.Month(), now.Day()-(weekday-1), 0, 0, 0, 0, now.Location())
	endOfWeek := startOfWeek.AddDate(0, 0, 7)

	var petitions []models.Petition
	if err := h.DB.
		Where("created_at >= ? AND created_at < ?", startOfWeek, endOfWeek).
		Order("created_at ASC").
		Find(&petitions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener las peticiones de la semana.",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"petitions":  petitions,
		"week_start": startOfWeek.Format("2006-01-02"),
		"week_end":   startOfWeek.AddDate(0, 0, 6).Format("2006-01-02"),
		"count":      len(petitions),
	})
}

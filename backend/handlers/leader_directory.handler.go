package handlers

// Directorio de líderes — foto + contacto, curado por admins.
// Público: GET /leaders (solo activos) — lo consumen el módulo de
// Células ("comunícate con tu líder") y el dashboard de voluntarios.
// Admin: CRUD completo bajo /admin/leaders.

import (
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type LeaderDirectoryHandler struct {
	DB *gorm.DB
}

func NewLeaderDirectoryHandler(db *gorm.DB) *LeaderDirectoryHandler {
	return &LeaderDirectoryHandler{DB: db}
}

// GetPublic GET /api/v1/leaders — solo líderes activos, para el sitio público.
func (h *LeaderDirectoryHandler) GetPublic(c echo.Context) error {
	var leaders []models.Leader
	if err := h.DB.Where("is_active = ?", true).Order("name ASC").Find(&leaders).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener el directorio."})
	}
	return c.JSON(http.StatusOK, leaders)
}

// GetAll GET /api/v1/admin/leaders — todos (incluye inactivos), para el panel.
func (h *LeaderDirectoryHandler) GetAll(c echo.Context) error {
	var leaders []models.Leader
	if err := h.DB.Order("name ASC").Find(&leaders).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener el directorio."})
	}
	return c.JSON(http.StatusOK, leaders)
}

// Create POST /api/v1/admin/leaders
func (h *LeaderDirectoryHandler) Create(c echo.Context) error {
	l := new(models.Leader)
	if err := c.Bind(l); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if l.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El nombre es obligatorio."})
	}
	if err := h.DB.Create(l).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo crear el líder."})
	}
	return c.JSON(http.StatusCreated, l)
}

// Update PUT /api/v1/admin/leaders/:id
func (h *LeaderDirectoryHandler) Update(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}

	var leader models.Leader
	if result := h.DB.First(&leader, id); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Líder no encontrado."})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al buscar el líder."})
	}

	// Bind sobre un struct aparte para poder actualizar booleanos en falso
	var req struct {
		Name     *string `json:"name"`
		PhotoURL *string `json:"photo_url"`
		Phone    *string `json:"phone"`
		Email    *string `json:"email"`
		Area     *string `json:"area"`
		IsActive *bool   `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Name != nil {
		if *req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "El nombre no puede quedar vacío."})
		}
		leader.Name = *req.Name
	}
	if req.PhotoURL != nil { leader.PhotoURL = *req.PhotoURL }
	if req.Phone != nil    { leader.Phone = *req.Phone }
	if req.Email != nil    { leader.Email = *req.Email }
	if req.Area != nil     { leader.Area = *req.Area }
	if req.IsActive != nil { leader.IsActive = *req.IsActive }

	if err := h.DB.Save(&leader).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo actualizar."})
	}
	return c.JSON(http.StatusOK, leader)
}

// Delete DELETE /api/v1/admin/leaders/:id — soft-delete de GORM.
func (h *LeaderDirectoryHandler) Delete(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}
	result := h.DB.Delete(&models.Leader{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo eliminar."})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Líder no encontrado."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Líder eliminado."})
}

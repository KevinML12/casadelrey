package handlers

import (
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// VolunteerAreaHandler administra los departamentos de voluntariado
// (Alabanza, Danza, Servidores...). Antes vivían hardcodeados en el
// frontend (volunteerAreas.js) -- esto es lo que permite al admin
// editarlos sin tocar código, siguiendo el mismo patrón que
// CellCategoryHandler para las células.
type VolunteerAreaHandler struct {
	DB *gorm.DB
}

func NewVolunteerAreaHandler(db *gorm.DB) *VolunteerAreaHandler {
	return &VolunteerAreaHandler{DB: db}
}

// GetPublicVolunteerAreas GET /api/v1/volunteer-areas — público, solo
// departamentos activos, ordenados como el admin los definió.
func (h *VolunteerAreaHandler) GetPublicVolunteerAreas(c echo.Context) error {
	var areas []models.VolunteerArea
	if err := h.DB.Where("is_active = ?", true).Order("sort_order, title").Find(&areas).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener departamentos."})
	}
	return c.JSON(http.StatusOK, areas)
}

// GetAllVolunteerAreasAdmin GET /api/v1/admin/volunteer-areas — admin ve
// todos, incluidos los inactivos.
func (h *VolunteerAreaHandler) GetAllVolunteerAreasAdmin(c echo.Context) error {
	var areas []models.VolunteerArea
	if err := h.DB.Order("sort_order, title").Find(&areas).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener departamentos."})
	}
	return c.JSON(http.StatusOK, areas)
}

// CreateVolunteerArea POST /api/v1/admin/volunteer-areas — admin.
func (h *VolunteerAreaHandler) CreateVolunteerArea(c echo.Context) error {
	var area models.VolunteerArea
	if err := c.Bind(&area); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if area.Value == "" || area.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Value y título son obligatorios."})
	}
	area.IsActive = true
	if err := h.DB.Create(&area).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear. ¿Ya existe ese value?"})
	}
	return c.JSON(http.StatusCreated, area)
}

// UpdateVolunteerArea PUT /api/v1/admin/volunteer-areas/:id — admin.
func (h *VolunteerAreaHandler) UpdateVolunteerArea(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}
	var area models.VolunteerArea
	if err := h.DB.First(&area, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Departamento no encontrado."})
	}

	var req struct {
		Value       string `json:"value"`
		Icon        string `json:"icon"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Why         string `json:"why"`
		SortOrder   *int   `json:"sort_order"`
		IsActive    *bool  `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Value != "" {
		area.Value = req.Value
	}
	if req.Title != "" {
		area.Title = req.Title
	}
	area.Icon = req.Icon
	area.Description = req.Description
	area.Why = req.Why
	if req.SortOrder != nil {
		area.SortOrder = *req.SortOrder
	}
	if req.IsActive != nil {
		area.IsActive = *req.IsActive
	}

	if err := h.DB.Save(&area).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar."})
	}
	return c.JSON(http.StatusOK, area)
}

// DeleteVolunteerArea DELETE /api/v1/admin/volunteer-areas/:id — admin,
// soft-delete (is_active=false) -- igual que las células, no se borra
// de verdad para no romper inscripciones ya guardadas con ese Department.
func (h *VolunteerAreaHandler) DeleteVolunteerArea(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}
	if err := h.DB.Model(&models.VolunteerArea{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Departamento eliminado."})
}

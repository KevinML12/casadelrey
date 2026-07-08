package handlers

import (
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type CellCategoryHandler struct {
	db *gorm.DB
}

func NewCellCategoryHandler(db *gorm.DB) *CellCategoryHandler {
	return &CellCategoryHandler{db: db}
}

// GetCellCategories retrieves all active cell categories
func (h *CellCategoryHandler) GetCellCategories(c echo.Context) error {
	var categories []models.CellCategory

	// Solo devolvemos las categorías activas
	if err := h.db.Where("is_active = ?", true).Find(&categories).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener categorías de células"})
	}

	return c.JSON(http.StatusOK, categories)
}

// GetAllCellCategoriesAdmin GET /api/v1/admin/cell-categories — admin ve
// todas las categorías, incluidas las inactivas.
func (h *CellCategoryHandler) GetAllCellCategoriesAdmin(c echo.Context) error {
	var categories []models.CellCategory
	if err := h.db.Order("name").Find(&categories).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener categorías de células"})
	}
	return c.JSON(http.StatusOK, categories)
}

// CreateCellCategory POST /api/v1/admin/cell-categories — admin crea una
// categoría nueva (las 5 reales ya vienen sembradas; esto es para el día
// que se agregue una nueva clasificación de células).
func (h *CellCategoryHandler) CreateCellCategory(c echo.Context) error {
	var cat models.CellCategory
	if err := c.Bind(&cat); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if cat.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El nombre es obligatorio."})
	}
	if err := h.db.Create(&cat).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear. ¿Ya existe ese nombre?"})
	}
	return c.JSON(http.StatusCreated, cat)
}

type updateCellCategoryReq struct {
	ImageURL string `json:"image_url"`
}

// UpdateCellCategoryImage PUT /api/v1/admin/cell-categories/:id — admin
// reemplaza la foto de una categoría existente (sube vía /upload y
// pega la URL resultante aquí).
func (h *CellCategoryHandler) UpdateCellCategoryImage(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}

	var cat models.CellCategory
	if err := h.db.First(&cat, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Categoría no encontrada."})
	}

	var req updateCellCategoryReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}

	cat.ImageURL = req.ImageURL
	if err := h.db.Save(&cat).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar."})
	}
	return c.JSON(http.StatusOK, cat)
}

// GetPublicCells GET /api/v1/cells — listado público de células activas.
// PRIVACIDAD: solo código, nombre, tipo, nombre del líder y zona aproximada.
// NUNCA dirección ni teléfono (el directorio completo es solo interno).
func (h *CellCategoryHandler) GetPublicCells(c echo.Context) error {
	var cells []models.Cell
	if err := h.db.Where("is_active = ?", true).Preload("Leader").Order("type, name").Find(&cells).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener células"})
	}

	type publicCell struct {
		Code   string `json:"code"`
		Name   string `json:"name"`
		Type   string `json:"type"`
		Leader string `json:"leader"`
		Zone   string `json:"zone"`
	}
	out := make([]publicCell, 0, len(cells))
	for _, cl := range cells {
		out = append(out, publicCell{
			Code:   cl.Code,
			Name:   cl.Name,
			Type:   cl.Type,
			Leader: cl.Leader.Name,
			Zone:   cl.Zone,
		})
	}
	return c.JSON(http.StatusOK, out)
}

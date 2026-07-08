package handlers

import (
	"net/http"

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

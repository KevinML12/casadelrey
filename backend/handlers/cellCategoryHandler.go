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

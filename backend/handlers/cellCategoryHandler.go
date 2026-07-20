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
	if err := h.db.Where("is_active = ?", true).Order("sort_order, name").Find(&categories).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener categorías de células"})
	}

	return c.JSON(http.StatusOK, categories)
}

// GetAllCellCategoriesAdmin GET /api/v1/admin/cell-categories — admin ve
// todas las categorías, incluidas las inactivas.
func (h *CellCategoryHandler) GetAllCellCategoriesAdmin(c echo.Context) error {
	var categories []models.CellCategory
	if err := h.db.Order("sort_order, name").Find(&categories).Error; err != nil {
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

// UpdateCellCategory PUT /api/v1/admin/cell-categories/:id — admin edita
// cualquier campo (nombre, grupo de edad, descripción, type_key, orden,
// foto, activo/inactivo). Solo se sobrescriben los campos presentes en el
// body -- así /admin/site-photos puede seguir mandando solo {image_url}
// sin tocar el resto, y el nuevo panel de categorías manda el resto sin
// tocar la foto.
func (h *CellCategoryHandler) UpdateCellCategory(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}

	var cat models.CellCategory
	if err := h.db.First(&cat, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Categoría no encontrada."})
	}

	if err := c.Bind(&cat); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if cat.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El nombre es obligatorio."})
	}

	if err := h.db.Save(&cat).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar. ¿Ya existe ese nombre?"})
	}
	return c.JSON(http.StatusOK, cat)
}

// DeleteCellCategory DELETE /api/v1/admin/cell-categories/:id — soft-delete
// (is_active=false), mismo patrón que Cell/VolunteerArea. Las células que
// apuntaban a este type_key no se borran ni se reasignan -- si ninguna otra
// categoría activa comparte su type_key, esas células caen en el bucket
// "Otros" en la página pública en vez de desaparecer.
func (h *CellCategoryHandler) DeleteCellCategory(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}
	if err := h.db.Model(&models.CellCategory{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Categoría eliminada."})
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
		Code        string `json:"code"`
		Name        string `json:"name"`
		Type        string `json:"type"`
		Description string `json:"description"`
		Leader      string `json:"leader"`
		Zone        string `json:"zone"`
	}
	out := make([]publicCell, 0, len(cells))
	for _, cl := range cells {
		out = append(out, publicCell{
			Code:        cl.Code,
			Name:        cl.Name,
			Type:        cl.Type,
			Description: cl.Description,
			Leader:      cl.Leader.Name,
			Zone:        cl.Zone,
		})
	}
	return c.JSON(http.StatusOK, out)
}

// ── CRUD de células individuales (admin) ────────────────────────────────
// Antes no existía forma de editar una célula sin tocar código del
// frontend (vivían hardcodeadas como fallback) -- esto es lo que permite
// gestionarlas de verdad desde el panel.

// GetAllCellsAdmin GET /api/v1/admin/cells — admin ve todas (activas e inactivas).
func (h *CellCategoryHandler) GetAllCellsAdmin(c echo.Context) error {
	var cells []models.Cell
	if err := h.db.Preload("Leader").Order("type, name").Find(&cells).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener células."})
	}
	return c.JSON(http.StatusOK, cells)
}

// CreateCell POST /api/v1/admin/cells — admin.
func (h *CellCategoryHandler) CreateCell(c echo.Context) error {
	var cell models.Cell
	if err := c.Bind(&cell); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if cell.Code == "" || cell.Name == "" || cell.Type == "" || cell.LeaderID == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Código, nombre, tipo y líder son obligatorios."})
	}
	cell.IsActive = true
	if err := h.db.Create(&cell).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear. ¿Ya existe ese código?"})
	}
	h.db.Preload("Leader").First(&cell, cell.ID)
	return c.JSON(http.StatusCreated, cell)
}

// UpdateCell PUT /api/v1/admin/cells/:id — admin.
func (h *CellCategoryHandler) UpdateCell(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}
	var cell models.Cell
	if err := h.db.First(&cell, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Célula no encontrada."})
	}

	var req struct {
		Code        string `json:"code"`
		Name        string `json:"name"`
		Type        string `json:"type"`
		Description string `json:"description"`
		LeaderID    uint   `json:"leader_id"`
		Zone        string `json:"zone"`
		IsActive    *bool  `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Code != "" {
		cell.Code = req.Code
	}
	if req.Name != "" {
		cell.Name = req.Name
	}
	if req.Type != "" {
		cell.Type = req.Type
	}
	cell.Description = req.Description
	if req.LeaderID != 0 {
		cell.LeaderID = req.LeaderID
	}
	cell.Zone = req.Zone
	if req.IsActive != nil {
		cell.IsActive = *req.IsActive
	}

	if err := h.db.Save(&cell).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar."})
	}
	h.db.Preload("Leader").First(&cell, cell.ID)
	return c.JSON(http.StatusOK, cell)
}

// DeleteCell DELETE /api/v1/admin/cells/:id — admin, soft-delete (is_active=false).
func (h *CellCategoryHandler) DeleteCell(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}
	if err := h.db.Model(&models.Cell{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Célula eliminada."})
}

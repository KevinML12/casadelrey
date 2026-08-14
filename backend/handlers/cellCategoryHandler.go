package handlers

import (
	"net/http"
	"regexp"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// cellCodePattern valida el formato [Tipo][Número]: H1, M2, J3, P1, N2 --
// mismo alfabeto que genera CellCodePicker.jsx (hombres/mujeres/jovenes/
// prejuveniles/ninos).
var cellCodePattern = regexp.MustCompile(`^[HMJPN][0-9]+$`)

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

	// Bind sobre un struct aparte -- el update parcial (solo se tocan los
	// campos presentes, ver comentario de la funcion) seguia siendo
	// posible con punteros, pero sin el riesgo de c.Bind(&cat) directo:
	// pisar ID/CreatedAt/DeletedAt via el body y que Save() actualizara
	// otra fila en vez de la de :id.
	var req struct {
		Name        *string `json:"name"`
		AgeGroup    *string `json:"age_group"`
		Description *string `json:"description"`
		ImageURL    *string `json:"image_url"`
		TypeKey     *string `json:"type_key"`
		SortOrder   *int    `json:"sort_order"`
		IsActive    *bool   `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Name != nil {
		cat.Name = *req.Name
	}
	if req.AgeGroup != nil {
		cat.AgeGroup = *req.AgeGroup
	}
	if req.Description != nil {
		cat.Description = *req.Description
	}
	if req.ImageURL != nil {
		cat.ImageURL = *req.ImageURL
	}
	if req.TypeKey != nil {
		cat.TypeKey = *req.TypeKey
	}
	if req.SortOrder != nil {
		cat.SortOrder = *req.SortOrder
	}
	if req.IsActive != nil {
		cat.IsActive = *req.IsActive
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

	// El ID va publico a proposito (ago-2026): sin el, el formulario de
	// "quiero unirme" no puede decir a QUE celula se refiere, y la
	// solicitud llegaba al panel sin celula y sin lider asignado. No es
	// dato sensible -- es la misma llave que ya viaja en cualquier URL de
	// admin -- y sin el la pagina publica no puede enlazar con nada.
	type publicCell struct {
		ID           uint   `json:"id"`
		Code         string `json:"code"`
		Name         string `json:"name"`
		Type         string `json:"type"`
		Description  string `json:"description"`
		Leader       string `json:"leader"`
		LeaderPhoto  string `json:"leader_photo"`
		Zone         string `json:"zone"`
		Day          string `json:"day"`
		Time         string `json:"time"`
		WhatToExpect string `json:"what_to_expect"`
	}
	
	// Buscar fotos de los perfiles de líderes para las células
	var leaderProfiles []models.Leader
	if err := h.db.Where("is_active = ?", true).Find(&leaderProfiles).Error; err == nil {
		// Mapa de UserID -> PhotoURL
		photos := make(map[uint]string)
		for _, lp := range leaderProfiles {
			if lp.UserID != nil && lp.PhotoURL != "" {
				photos[*lp.UserID] = lp.PhotoURL
			}
		}

		out := make([]publicCell, 0, len(cells))
		for _, cl := range cells {
			out = append(out, publicCell{
				ID:           cl.ID,
				Code:         cl.Code,
				Name:         cl.Name,
				Type:         cl.Type,
				Description:  cl.Description,
				Leader:       cl.Leader.Name,
				LeaderPhoto:  photos[cl.LeaderID],
				Zone:         cl.Zone,
				Day:          cl.Day,
				Time:         cl.Time,
				WhatToExpect: cl.WhatToExpect,
			})
		}
		return c.JSON(http.StatusOK, out)
	}

	out := make([]publicCell, 0, len(cells))
	for _, cl := range cells {
		out = append(out, publicCell{
			ID:           cl.ID,
			Code:         cl.Code,
			Name:         cl.Name,
			Type:         cl.Type,
			Description:  cl.Description,
			Leader:       cl.Leader.Name,
			Zone:         cl.Zone,
			Day:          cl.Day,
			Time:         cl.Time,
			WhatToExpect: cl.WhatToExpect,
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
	if !cellCodePattern.MatchString(cell.Code) {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El código debe tener el formato [H|M|J|P|N] seguido de un número, ej. H1, M2."})
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

		Day          *string `json:"day"`
		Time         *string `json:"time"`
		WhatToExpect *string `json:"what_to_expect"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Code != "" {
		if !cellCodePattern.MatchString(req.Code) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "El código debe tener el formato [H|M|J|P|N] seguido de un número, ej. H1, M2."})
		}
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
	// Punteros, no strings: estos tres los edita tambien el lider desde su
	// panel, que manda solo lo suyo. Con string plano, un PUT que no los
	// incluyera los habria borrado en silencio.
	if req.Day != nil {
		cell.Day = *req.Day
	}
	if req.Time != nil {
		cell.Time = *req.Time
	}
	if req.WhatToExpect != nil {
		cell.WhatToExpect = *req.WhatToExpect
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

// ── La célula del propio líder ──────────────────────────────────────────
// El día, la hora y el "qué esperar" los sabe el líder, no un admin: si
// esta semana la reunión se movió, él es quien se entera primero.
// Obligarlo a pedirle el cambio a un admin es exactamente lo que hace que
// un dato así se quede viejo y el sitio publique una hora que ya no es.
//
// Alcance deliberadamente estrecho: el líder toca SOLO lo suyo y solo los
// campos de la reunión. Nombre, código, tipo, zona, líder asignado y
// is_active siguen siendo de admin -- son estructura de la iglesia, no
// operación semanal de un grupo.

// GetMyCell GET /api/v1/leader/my-cell
func (h *CellCategoryHandler) GetMyCell(c echo.Context) error {
	uid, ok := c.Get("user_id").(uint)
	if !ok || uid == 0 {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Sesión inválida."})
	}
	var cell models.Cell
	if err := h.db.Preload("Leader").Where("leader_id = ?", uid).First(&cell).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Todavía no tienes una célula asignada. Un administrador te la asigna desde el panel."})
	}
	return c.JSON(http.StatusOK, cell)
}

// UpdateMyCell PUT /api/v1/leader/my-cell
func (h *CellCategoryHandler) UpdateMyCell(c echo.Context) error {
	uid, ok := c.Get("user_id").(uint)
	if !ok || uid == 0 {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Sesión inválida."})
	}
	// Se busca POR leader_id, no por un :id del body: así un líder no
	// puede editar la célula de otro ni aunque mande su ID a mano.
	var cell models.Cell
	if err := h.db.Where("leader_id = ?", uid).First(&cell).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Todavía no tienes una célula asignada."})
	}

	var req struct {
		Day          *string `json:"day"`
		Time         *string `json:"time"`
		Description  *string `json:"description"`
		WhatToExpect *string `json:"what_to_expect"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Day != nil {
		cell.Day = *req.Day
	}
	if req.Time != nil {
		cell.Time = *req.Time
	}
	if req.Description != nil {
		cell.Description = *req.Description
	}
	if req.WhatToExpect != nil {
		cell.WhatToExpect = *req.WhatToExpect
	}

	if err := h.db.Save(&cell).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo guardar."})
	}
	h.db.Preload("Leader").First(&cell, cell.ID)
	return c.JSON(http.StatusOK, cell)
}

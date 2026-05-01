package handlers

import (
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// BoletaHandler maneja las fichas de registro de nuevos miembros.
type BoletaHandler struct {
	DB *gorm.DB
}

func NewBoletaHandler(db *gorm.DB) *BoletaHandler {
	return &BoletaHandler{DB: db}
}

var validCategories = map[string]bool{
	"reconciliado": true,
	"convertido":   true,
	"nuevo":        true,
}

// CreateBoleta POST /api/v1/admin/boletas — admin o líder.
func (h *BoletaHandler) CreateBoleta(c echo.Context) error {
	var req struct {
		Date         string `json:"date"`
		InviterName  string `json:"inviter_name"`
		InviterPhone string `json:"inviter_phone"`
		GuestName    string `json:"guest_name"`
		GuestPhone   string `json:"guest_phone"`
		Address      string `json:"address"`
		Category     string `json:"category"`
		CellReportID *uint  `json:"cell_report_id"`
		Notes        string `json:"notes"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos."})
	}
	if req.GuestName == "" || req.Date == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre del invitado y fecha son obligatorios."})
	}
	if !validCategories[req.Category] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Categoría debe ser: reconciliado, convertido o nuevo."})
	}

	leaderID, _ := c.Get("user_id").(uint)

	b := models.MemberBoleta{
		Date:         req.Date,
		InviterName:  req.InviterName,
		InviterPhone: req.InviterPhone,
		GuestName:    req.GuestName,
		GuestPhone:   req.GuestPhone,
		Address:      req.Address,
		Category:     req.Category,
		LeaderID:     &leaderID,
		CellReportID: req.CellReportID,
		Notes:        req.Notes,
	}

	if err := h.DB.Create(&b).Error; err != nil {
		log.Printf("[Boleta] Error al guardar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo guardar la boleta."})
	}

	log.Printf("[Boleta] Registrada: %s — %s", b.GuestName, b.Category)
	return c.JSON(http.StatusCreated, b)
}

// GetBoletas GET /api/v1/admin/boletas — admin ve todas, leader las suyas.
func (h *BoletaHandler) GetBoletas(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Model(&models.MemberBoleta{})
	if role, _ := c.Get("user_role").(string); role == "leader" {
		uid, _ := c.Get("user_id").(uint)
		q = q.Where("leader_id = ?", uid)
	}
	if cat := c.QueryParam("category"); cat != "" {
		q = q.Where("category = ?", cat)
	}
	if search := c.QueryParam("q"); search != "" {
		like := "%" + search + "%"
		q = q.Where("guest_name ILIKE ? OR inviter_name ILIKE ?", like, like)
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var list []models.MemberBoleta
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&list).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener las boletas."})
	}
	return c.JSON(http.StatusOK, PagedResponse{Data: list, Meta: newMeta(total, page, limit)})
}

// UpdateBoleta PUT /api/v1/admin/boletas/:id — admin o el líder que la creó.
func (h *BoletaHandler) UpdateBoleta(c echo.Context) error {
	id := c.Param("id")
	var b models.MemberBoleta
	if err := h.DB.First(&b, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Boleta no encontrada."})
	}

	if role, _ := c.Get("user_role").(string); role == "leader" {
		uid, _ := c.Get("user_id").(uint)
		if b.LeaderID == nil || *b.LeaderID != uid {
			return c.JSON(http.StatusForbidden, map[string]string{"error": "No tienes permiso para editar esta boleta."})
		}
	}

	if err := c.Bind(&b); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if b.Category != "" && !validCategories[b.Category] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Categoría inválida."})
	}

	h.DB.Save(&b)
	return c.JSON(http.StatusOK, b)
}

// DeleteBoleta DELETE /api/v1/admin/boletas/:id — solo admin.
func (h *BoletaHandler) DeleteBoleta(c echo.Context) error {
	id := c.Param("id")
	if err := h.DB.Delete(&models.MemberBoleta{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar la boleta."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Boleta eliminada."})
}

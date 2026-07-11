package handlers

import (
	"log"
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// ConnectCardHandler maneja la tarjeta de conexión de visitantes nuevos:
// un visitante se registra él mismo (público, sin auth) y el equipo de
// seguimiento (líderes/admins) lo contacta y marca su avance.
type ConnectCardHandler struct {
	DB *gorm.DB
}

func NewConnectCardHandler(db *gorm.DB) *ConnectCardHandler {
	return &ConnectCardHandler{DB: db}
}

var connectCardCategories = map[string]bool{"primera_vez": true, "reconciliado": true, "busco_celula": true}
var connectCardHowFound = map[string]bool{"invitacion": true, "redes": true, "publicidad": true, "otro": true}
var connectCardStatus = map[string]bool{"nuevo": true, "contactado": true, "integrado": true}

// Create godoc
// POST /api/v1/connect-cards — público, sin autenticación.
func (h *ConnectCardHandler) Create(c echo.Context) error {
	var req struct {
		Name     string `json:"name"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
		HowFound string `json:"how_found"`
		Category string `json:"category"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Name == "" || req.Phone == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre y teléfono son obligatorios."})
	}
	if req.Category == "" || !connectCardCategories[req.Category] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Categoría inválida."})
	}
	if req.HowFound != "" && !connectCardHowFound[req.HowFound] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Valor de '¿cómo nos conociste?' inválido."})
	}

	card := models.ConnectCard{
		Name: req.Name, Phone: req.Phone, Email: req.Email,
		HowFound: req.HowFound, Category: req.Category, Status: "nuevo",
	}
	if err := h.DB.Create(&card).Error; err != nil {
		log.Printf("[ConnectCard] Error al guardar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo guardar. Inténtalo de nuevo."})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "¡Gracias por registrarte! Alguien de nuestro equipo te contactará pronto.",
		"id":      card.ID,
	})
}

// GetAll godoc
// GET /api/v1/admin/connect-cards — admin y líder. Filtro opcional ?status=
func (h *ConnectCardHandler) GetAll(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Model(&models.ConnectCard{}).Preload("LeaderAssigned")
	if status := c.QueryParam("status"); status != "" {
		q = q.Where("status = ?", status)
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var cards []models.ConnectCard
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&cards).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener las tarjetas."})
	}
	return c.JSON(http.StatusOK, PagedResponse{Data: cards, Meta: newMeta(total, page, limit)})
}

// Update godoc
// PUT /api/v1/admin/connect-cards/:id — admin y líder: cambiar estado,
// asignar líder de seguimiento, agregar notas.
func (h *ConnectCardHandler) Update(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido."})
	}

	var card models.ConnectCard
	if err := h.DB.First(&card, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Tarjeta no encontrada."})
	}

	var req struct {
		Status           *string `json:"status"`
		LeaderAssignedID *uint   `json:"leader_assigned_id"`
		Notes            *string `json:"notes"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}

	if req.Status != nil {
		if !connectCardStatus[*req.Status] {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Estado inválido."})
		}
		card.Status = *req.Status
	}
	if req.LeaderAssignedID != nil {
		card.LeaderAssignedID = req.LeaderAssignedID
	}
	if req.Notes != nil {
		card.Notes = *req.Notes
	}

	if err := h.DB.Save(&card).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo actualizar."})
	}
	h.DB.Preload("LeaderAssigned").First(&card, card.ID)
	return c.JSON(http.StatusOK, card)
}

// Delete godoc
// DELETE /api/v1/admin/connect-cards/:id — solo admin.
func (h *ConnectCardHandler) Delete(c echo.Context) error {
	id := c.Param("id")
	if err := h.DB.Delete(&models.ConnectCard{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Tarjeta eliminada."})
}

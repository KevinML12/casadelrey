package handlers

import (
	"log"
	"net/http"
	"time"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// AnnouncementHandler gestiona los anuncios de la iglesia.
type AnnouncementHandler struct {
	DB *gorm.DB
}

func NewAnnouncementHandler(db *gorm.DB) *AnnouncementHandler {
	return &AnnouncementHandler{DB: db}
}

// GetAnnouncements GET /api/v1/announcements — público, filtra por rol y activos.
func (h *AnnouncementHandler) GetAnnouncements(c echo.Context) error {
	role, _ := c.Get("user_role").(string)

	q := h.DB.Where("is_active = ?", true).Order("published_at DESC, created_at DESC")

	if role == "" || role == "member" {
		q = q.Where("role_target IN ?", []string{"all", "member"})
	} else if role == "leader" {
		q = q.Where("role_target IN ?", []string{"all", "member", "leader"})
	}
	// admin ve todos

	var list []models.Announcement
	if err := q.Preload("Author").Find(&list).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener anuncios."})
	}
	return c.JSON(http.StatusOK, list)
}

// GetAllAnnouncements GET /api/v1/admin/announcements — admin ve todos.
func (h *AnnouncementHandler) GetAllAnnouncements(c echo.Context) error {
	page, limit := parsePage(c)

	var total int64
	h.DB.Model(&models.Announcement{}).Count(&total)

	var list []models.Announcement
	offset := (page - 1) * limit
	if err := h.DB.Order("created_at DESC").Offset(offset).Limit(limit).Preload("Author").Find(&list).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener anuncios."})
	}

	return c.JSON(http.StatusOK, PagedResponse{Data: list, Meta: newMeta(total, page, limit)})
}

// CreateAnnouncement POST /api/v1/admin/announcements — admin.
func (h *AnnouncementHandler) CreateAnnouncement(c echo.Context) error {
	var req struct {
		Title      string `json:"title"`
		Content    string `json:"content"`
		RoleTarget string `json:"role_target"`
		IsActive   *bool  `json:"is_active"`
		PublishNow bool   `json:"publish_now"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Title == "" || req.Content == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Título y contenido son obligatorios."})
	}

	validTargets := map[string]bool{"all": true, "member": true, "leader": true, "admin": true}
	if req.RoleTarget == "" {
		req.RoleTarget = "all"
	}
	if !validTargets[req.RoleTarget] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "role_target debe ser all, member, leader o admin."})
	}

	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}

	userID, _ := c.Get("user_id").(uint)

	a := models.Announcement{
		Title:       req.Title,
		Content:     req.Content,
		RoleTarget:  req.RoleTarget,
		IsActive:    active,
		CreatedByID: userID,
	}
	if req.PublishNow {
		now := time.Now()
		a.PublishedAt = &now
	}

	if err := h.DB.Create(&a).Error; err != nil {
		log.Printf("[Announcement] Error al crear: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear el anuncio."})
	}
	return c.JSON(http.StatusCreated, a)
}

// UpdateAnnouncement PUT /api/v1/admin/announcements/:id — admin.
func (h *AnnouncementHandler) UpdateAnnouncement(c echo.Context) error {
	id := c.Param("id")
	var a models.Announcement
	if err := h.DB.First(&a, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Anuncio no encontrado."})
	}

	var req struct {
		Title      string `json:"title"`
		Content    string `json:"content"`
		RoleTarget string `json:"role_target"`
		IsActive   *bool  `json:"is_active"`
		PublishNow bool   `json:"publish_now"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}

	if req.Title != "" {
		a.Title = req.Title
	}
	if req.Content != "" {
		a.Content = req.Content
	}
	if req.RoleTarget != "" {
		a.RoleTarget = req.RoleTarget
	}
	if req.IsActive != nil {
		a.IsActive = *req.IsActive
	}
	if req.PublishNow && a.PublishedAt == nil {
		now := time.Now()
		a.PublishedAt = &now
	}

	h.DB.Save(&a)
	return c.JSON(http.StatusOK, a)
}

// DeleteAnnouncement DELETE /api/v1/admin/announcements/:id — admin.
func (h *AnnouncementHandler) DeleteAnnouncement(c echo.Context) error {
	id := c.Param("id")
	if err := h.DB.Delete(&models.Announcement{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Anuncio eliminado."})
}

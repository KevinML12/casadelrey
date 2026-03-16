package handlers

import (
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// SocialHandler maneja el feed de publicaciones FB/IG.
type SocialHandler struct {
	DB *gorm.DB
}

// NewSocialHandler crea una nueva instancia.
func NewSocialHandler(db *gorm.DB) *SocialHandler {
	return &SocialHandler{DB: db}
}

// GetSocialFeed GET /api/v1/social/feed — público, publicaciones activas.
func (h *SocialHandler) GetSocialFeed(c echo.Context) error {
	var posts []models.SocialPost
	if result := h.DB.Where("is_active = ?", true).Order("sort_order ASC, created_at DESC").Find(&posts); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener el feed."})
	}
	return c.JSON(http.StatusOK, posts)
}

// GetAllSocialPosts GET /api/v1/admin/social — admin, todas las publicaciones.
func (h *SocialHandler) GetAllSocialPosts(c echo.Context) error {
	var posts []models.SocialPost
	if result := h.DB.Order("sort_order ASC, created_at DESC").Find(&posts); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener."})
	}
	return c.JSON(http.StatusOK, posts)
}

// CreateSocialPost POST /api/v1/admin/social — admin, crear.
func (h *SocialHandler) CreateSocialPost(c echo.Context) error {
	p := new(models.SocialPost)
	if err := c.Bind(p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if p.Platform == "" || p.PostURL == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "platform y post_url son obligatorios."})
	}
	if p.Platform != "facebook" && p.Platform != "instagram" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "platform debe ser facebook o instagram."})
	}
	if result := h.DB.Create(p); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar."})
	}
	return c.JSON(http.StatusCreated, p)
}

// UpdateSocialPost PUT /api/v1/admin/social/:id — admin, actualizar.
func (h *SocialHandler) UpdateSocialPost(c echo.Context) error {
	id := c.Param("id")
	var p models.SocialPost
	if result := h.DB.First(&p, id); result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "No encontrado."})
	}
	var upd struct {
		Platform string `json:"platform"`
		PostURL  string `json:"post_url"`
		Caption  string `json:"caption"`
		IsActive *bool  `json:"is_active"`
	}
	if err := c.Bind(&upd); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if upd.Platform != "" {
		p.Platform = upd.Platform
	}
	if upd.PostURL != "" {
		p.PostURL = upd.PostURL
	}
	p.Caption = upd.Caption
	if upd.IsActive != nil {
		p.IsActive = *upd.IsActive
	}
	h.DB.Save(&p)
	return c.JSON(http.StatusOK, p)
}

// DeleteSocialPost DELETE /api/v1/admin/social/:id — admin, eliminar.
func (h *SocialHandler) DeleteSocialPost(c echo.Context) error {
	id := c.Param("id")
	if result := h.DB.Delete(&models.SocialPost{}, id); result.Error != nil || result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "No encontrado."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Eliminado."})
}

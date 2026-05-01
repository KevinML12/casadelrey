package handlers

import (
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GalleryHandler gestiona la galería de fotos de la iglesia.
type GalleryHandler struct {
	DB *gorm.DB
}

func NewGalleryHandler(db *gorm.DB) *GalleryHandler {
	return &GalleryHandler{DB: db}
}

// GetPhotos GET /api/v1/gallery — público, solo fotos activas.
func (h *GalleryHandler) GetPhotos(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Where("is_active = ?", true)
	if evID := c.QueryParam("event_id"); evID != "" {
		q = q.Where("event_id = ?", evID)
	}

	var total int64
	q.Model(&models.GalleryPhoto{}).Count(&total)

	offset := (page - 1) * limit
	var photos []models.GalleryPhoto
	if err := q.Order("sort_order ASC, created_at DESC").Offset(offset).Limit(limit).Find(&photos).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener las fotos."})
	}

	return c.JSON(http.StatusOK, PagedResponse{Data: photos, Meta: newMeta(total, page, limit)})
}

// GetAllPhotos GET /api/v1/admin/gallery — admin ve todas incluyendo inactivas.
func (h *GalleryHandler) GetAllPhotos(c echo.Context) error {
	page, limit := parsePage(c)

	var total int64
	h.DB.Model(&models.GalleryPhoto{}).Count(&total)

	offset := (page - 1) * limit
	var photos []models.GalleryPhoto
	if err := h.DB.Order("sort_order ASC, created_at DESC").Offset(offset).Limit(limit).Find(&photos).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener las fotos."})
	}

	return c.JSON(http.StatusOK, PagedResponse{Data: photos, Meta: newMeta(total, page, limit)})
}

// CreatePhoto POST /api/v1/admin/gallery — admin.
func (h *GalleryHandler) CreatePhoto(c echo.Context) error {
	var req struct {
		Title        string `json:"title"`
		Description  string `json:"description"`
		URL          string `json:"url"`
		ThumbnailURL string `json:"thumbnail_url"`
		EventID      *uint  `json:"event_id"`
		SortOrder    int    `json:"sort_order"`
		IsActive     *bool  `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.URL == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "La URL de la foto es obligatoria."})
	}

	userID, _ := c.Get("user_id").(uint)
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}

	photo := models.GalleryPhoto{
		Title:        req.Title,
		Description:  req.Description,
		URL:          req.URL,
		ThumbnailURL: req.ThumbnailURL,
		EventID:      req.EventID,
		UploadedByID: userID,
		SortOrder:    req.SortOrder,
		IsActive:     active,
	}

	if err := h.DB.Create(&photo).Error; err != nil {
		log.Printf("[Gallery] Error al crear foto: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar la foto."})
	}
	return c.JSON(http.StatusCreated, photo)
}

// UpdatePhoto PUT /api/v1/admin/gallery/:id — admin.
func (h *GalleryHandler) UpdatePhoto(c echo.Context) error {
	id := c.Param("id")
	var photo models.GalleryPhoto
	if err := h.DB.First(&photo, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Foto no encontrada."})
	}

	if err := c.Bind(&photo); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	h.DB.Save(&photo)
	return c.JSON(http.StatusOK, photo)
}

// DeletePhoto DELETE /api/v1/admin/gallery/:id — admin.
func (h *GalleryHandler) DeletePhoto(c echo.Context) error {
	id := c.Param("id")
	if err := h.DB.Delete(&models.GalleryPhoto{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar la foto."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Foto eliminada."})
}

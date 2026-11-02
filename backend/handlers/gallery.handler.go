package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"sort"
	"strings"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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
		Album        string `json:"album"`
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
	if len(req.Album) > 150 {
		return c.JSON(400, map[string]string{"error": "El álbum admite hasta 150 caracteres."})
	}

	userID, _ := c.Get("user_id").(uint)
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}

	photo := models.GalleryPhoto{
		Album:        strings.TrimSpace(req.Album),
		Title:        req.Title,
		Description:  req.Description,
		URL:          req.URL,
		ThumbnailURL: req.ThumbnailURL,
		EventID:      req.EventID,
		UploadedByID: userID,
		SortOrder:    req.SortOrder,
		IsActive:     active,
	}

	if key := c.Request().Header.Get("Idempotency-Key"); key != "" {
		if !donationKeyPattern.MatchString(key) {
			return c.JSON(400, map[string]string{"error": "Identificador de carga inválido."})
		}
		sum := sha256.Sum256([]byte(key))
		stored := hex.EncodeToString(sum[:])
		photo.SubmissionKey = &stored
	}
	result := h.DB.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "submission_key"}}, DoNothing: true}).Create(&photo)
	if err := result.Error; err != nil {
		log.Printf("[Gallery] Error al crear foto: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar la foto."})
	}
	if result.RowsAffected == 0 && photo.SubmissionKey != nil {
		var previous models.GalleryPhoto
		if err := h.DB.Where("submission_key = ?", *photo.SubmissionKey).First(&previous).Error; err != nil {
			return receiptWriteError(c, err)
		}
		if previous.URL != photo.URL || previous.Album != photo.Album || previous.Title != photo.Title || previous.UploadedByID != userID {
			return c.JSON(409, map[string]string{"error": "La carga ya se utilizó con otros datos."})
		}
		return c.JSON(200, previous)
	}

	userName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, userID, userName, "create", "gallery", photo.ID, photo.Title, c.RealIP())

	return c.JSON(http.StatusCreated, photo)
}

// UpdatePhoto PUT /api/v1/admin/gallery/:id — admin.
func (h *GalleryHandler) UpdatePhoto(c echo.Context) error {
	id := c.Param("id")
	var photo models.GalleryPhoto
	if err := h.DB.Where("id = ?", id).First(&photo).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Foto no encontrada."})
	}

	// Bind sobre un struct aparte -- ver nota en faq.handler.go UpdateFAQ:
	// c.Bind(&photo) directo permitia pisar ID/CreatedAt/DeletedAt via el
	// body (el panel manda {...photo, is_active: !photo.is_active}, que
	// incluye el ID completo) y arriesgaba que Save() tocara otra fila.
	// UploadedByID tampoco es editable -- se fija en CreatePhoto.
	var req struct {
		Album        *string `json:"album"`
		Title        *string `json:"title"`
		Description  *string `json:"description"`
		URL          *string `json:"url"`
		ThumbnailURL *string `json:"thumbnail_url"`
		EventID      *uint   `json:"event_id"`
		IsActive     *bool   `json:"is_active"`
		SortOrder    *int    `json:"sort_order"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if req.Title != nil {
		photo.Title = *req.Title
	}
	if req.Album != nil {
		if len(*req.Album) > 150 {
			return c.JSON(400, map[string]string{"error": "El álbum admite hasta 150 caracteres."})
		}
		photo.Album = strings.TrimSpace(*req.Album)
	}
	if req.Description != nil {
		photo.Description = *req.Description
	}
	if req.URL != nil {
		photo.URL = *req.URL
	}
	if req.ThumbnailURL != nil {
		photo.ThumbnailURL = *req.ThumbnailURL
	}
	if req.EventID != nil {
		photo.EventID = req.EventID
	}
	if req.IsActive != nil {
		photo.IsActive = *req.IsActive
	}
	if req.SortOrder != nil {
		photo.SortOrder = *req.SortOrder
	}

	h.DB.Save(&photo)

	editorID, _ := c.Get("user_id").(uint)
	editorName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, editorID, editorName, "update", "gallery", photo.ID, photo.Title, c.RealIP())

	return c.JSON(http.StatusOK, photo)
}

// DeletePhoto DELETE /api/v1/admin/gallery/:id — admin.
func (h *GalleryHandler) DeletePhoto(c echo.Context) error {
	id := c.Param("id")
	var photo models.GalleryPhoto
	h.DB.Where("id = ?", id).First(&photo)
	if err := h.DB.Where("id = ?", id).Delete(&models.GalleryPhoto{}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar la foto."})
	}

	userID, _ := c.Get("user_id").(uint)
	userName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, userID, userName, "delete", "gallery", photo.ID, photo.Title, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{"message": "Foto eliminada."})
}

// GetAlbums includes existing title-based albums without altering old records.
func (h *GalleryHandler) GetAlbums(c echo.Context) error {
	var rows []models.GalleryPhoto
	if err := h.DB.Select("album", "title").Find(&rows).Error; err != nil {
		return c.JSON(503, map[string]string{"error": "No se pudieron consultar los álbumes."})
	}
	set := map[string]bool{}
	for _, row := range rows {
		name := strings.TrimSpace(row.Album)
		if name == "" {
			if parts := strings.SplitN(row.Title, " - ", 2); len(parts) == 2 {
				name = strings.TrimSpace(parts[0])
			} else {
				name = "Otros"
			}
		}
		set[name] = true
	}
	names := make([]string, 0, len(set))
	for name := range set {
		names = append(names, name)
	}
	sort.Strings(names)
	return c.JSON(200, names)
}

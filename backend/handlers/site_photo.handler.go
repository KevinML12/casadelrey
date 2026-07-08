package handlers

import (
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type SitePhotoHandler struct {
	DB *gorm.DB
}

func NewSitePhotoHandler(db *gorm.DB) *SitePhotoHandler {
	return &SitePhotoHandler{DB: db}
}

// knownSlots es la fuente de verdad de qué slots existen y su label.
// Agregar un slot nuevo aquí es todo lo que hace falta — el admin lo
// verá automáticamente en el panel, con image_url vacío hasta que
// alguien suba una foto.
var knownSlots = []struct{ Key, Label string }{
	{"about_pastores", "Nosotros — Nuestra historia (fundadores y pastores)"},
	{"about_servidores", "Nosotros — Misión y visión"},
	{"about_comunidad", "Nosotros — Comunidad"},
	{"about_lideres", "Nosotros — Encuentra tu célula"},
}

// GetSitePhotos GET /api/v1/site-photos — público, solo los slots con foto.
func (h *SitePhotoHandler) GetSitePhotos(c echo.Context) error {
	var photos []models.SitePhoto
	if err := h.DB.Where("image_url != ''").Find(&photos).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener fotos."})
	}
	out := make(map[string]string, len(photos))
	for _, p := range photos {
		out[p.Key] = p.ImageURL
	}
	return c.JSON(http.StatusOK, out)
}

// GetAllSitePhotos GET /api/v1/admin/site-photos — admin ve TODOS los
// slots conocidos, incluso los que aún no tienen foto subida.
func (h *SitePhotoHandler) GetAllSitePhotos(c echo.Context) error {
	var existing []models.SitePhoto
	if err := h.DB.Find(&existing).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener fotos."})
	}
	byKey := make(map[string]models.SitePhoto, len(existing))
	for _, p := range existing {
		byKey[p.Key] = p
	}

	out := make([]models.SitePhoto, 0, len(knownSlots))
	for _, slot := range knownSlots {
		if p, ok := byKey[slot.Key]; ok {
			out = append(out, p)
		} else {
			out = append(out, models.SitePhoto{Key: slot.Key, Label: slot.Label})
		}
	}
	return c.JSON(http.StatusOK, out)
}

type updateSitePhotoReq struct {
	ImageURL string `json:"image_url"`
}

// UpdateSitePhoto PUT /api/v1/admin/site-photos/:key — crea o actualiza
// (upsert) la foto de un slot conocido.
func (h *SitePhotoHandler) UpdateSitePhoto(c echo.Context) error {
	key := c.Param("key")
	label := ""
	found := false
	for _, slot := range knownSlots {
		if slot.Key == key {
			label = slot.Label
			found = true
			break
		}
	}
	if !found {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Slot de foto desconocido."})
	}

	var req updateSitePhotoReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}

	var photo models.SitePhoto
	err := h.DB.Where("key = ?", key).First(&photo).Error
	if err != nil {
		photo = models.SitePhoto{Key: key, Label: label, ImageURL: req.ImageURL}
		if err := h.DB.Create(&photo).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar."})
		}
	} else {
		photo.ImageURL = req.ImageURL
		if err := h.DB.Save(&photo).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar."})
		}
	}
	return c.JSON(http.StatusOK, photo)
}

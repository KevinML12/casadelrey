package handlers

import (
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type HeroHandler struct {
	DB *gorm.DB
}

func NewHeroHandler(db *gorm.DB) *HeroHandler {
	return &HeroHandler{DB: db}
}

// GetActive GET /api/v1/hero/active — público. Devuelve TODOS los heroes
// activos (array, más reciente primero) para el carrusel del Home; si no
// hay ninguno configurado responde el hero default como única slide.
// Nota: el panel hoy activa uno a la vez (Activate desactiva el resto);
// el array deja listo el carrusel para cuando se permitan varios.
func (h *HeroHandler) GetActive(c echo.Context) error {
	var heroes []models.HeroSetting
	if err := h.DB.Where("is_active = ?", true).Order("updated_at DESC").Find(&heroes).Error; err != nil || len(heroes) == 0 {
		return c.JSON(http.StatusOK, []models.HeroSetting{defaultHero()})
	}
	return c.JSON(http.StatusOK, heroes)
}

// GetAll GET /api/v1/admin/hero — admin lista todos los heroes (campañas guardadas).
func (h *HeroHandler) GetAll(c echo.Context) error {
	var heroes []models.HeroSetting
	if err := h.DB.Order("is_active DESC, updated_at DESC").Find(&heroes).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener heroes."})
	}
	return c.JSON(http.StatusOK, heroes)
}

// Create POST /api/v1/admin/hero — admin crea un nuevo hero.
func (h *HeroHandler) Create(c echo.Context) error {
	var hero models.HeroSetting
	if err := c.Bind(&hero); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}
	if hero.TitleLine1 == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El título es obligatorio."})
	}
	// Defaults
	if hero.OverlayColor == "" {
		hero.OverlayColor = "#060D24"
	}
	if hero.OverlayOpacity == 0 {
		hero.OverlayOpacity = 50
	}

	if err := h.DB.Create(&hero).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al guardar."})
	}
	return c.JSON(http.StatusCreated, hero)
}

// Update PUT /api/v1/admin/hero/:id — admin actualiza un hero.
func (h *HeroHandler) Update(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))

	var hero models.HeroSetting
	if err := h.DB.First(&hero, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Hero no encontrado."})
	}

	var req models.HeroSetting
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}

	hero.LabelTop = req.LabelTop
	hero.TitleLine1 = req.TitleLine1
	hero.TitleLine2 = req.TitleLine2
	hero.VerseReference = req.VerseReference
	hero.Subtitle = req.Subtitle
	hero.ScheduleText = req.ScheduleText
	hero.CTAPrimaryText = req.CTAPrimaryText
	hero.CTAPrimaryURL = req.CTAPrimaryURL
	hero.CTASecondaryText = req.CTASecondaryText
	hero.CTASecondaryURL = req.CTASecondaryURL
	hero.BackgroundImageURL = req.BackgroundImageURL
	hero.OverlayColor = req.OverlayColor
	hero.OverlayOpacity = req.OverlayOpacity

	h.DB.Save(&hero)
	return c.JSON(http.StatusOK, hero)
}

// Activate PUT /api/v1/admin/hero/:id/activate — activa este hero y desactiva los demás.
func (h *HeroHandler) Activate(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))

	// Transacción: desactivar todos, activar este
	tx := h.DB.Begin()
	if err := tx.Model(&models.HeroSetting{}).Where("1 = 1").Update("is_active", false).Error; err != nil {
		tx.Rollback()
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al desactivar."})
	}
	if err := tx.Model(&models.HeroSetting{}).Where("id = ?", id).Update("is_active", true).Error; err != nil {
		tx.Rollback()
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al activar."})
	}
	tx.Commit()

	var hero models.HeroSetting
	h.DB.First(&hero, id)
	return c.JSON(http.StatusOK, hero)
}

// Delete DELETE /api/v1/admin/hero/:id
func (h *HeroHandler) Delete(c echo.Context) error {
	id := c.Param("id")
	if err := h.DB.Delete(&models.HeroSetting{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Hero eliminado."})
}

// defaultHero retorna el hero por defecto cuando no hay ninguno configurado.
func defaultHero() models.HeroSetting {
	return models.HeroSetting{
		LabelTop:         "● IGLESIA CRISTIANA · HUEHUETENANGO · DESDE 2016",
		TitleLine1:       "LUZ PARA",
		TitleLine2:       "LAS NACIONES",
		VerseReference:   "MATEO 5:14",
		Subtitle:         "Empieza tu propósito aquí.",
		ScheduleText:     "Domingos · 10am · Zona 1, Huehuetenango",
		CTAPrimaryText:   "Ver próximos eventos",
		CTAPrimaryURL:    "/events",
		CTASecondaryText: "Conócenos",
		CTASecondaryURL:  "/about",
		OverlayColor:     "#060D24",
		OverlayOpacity:   50,
		IsActive:         true,
	}
}

package handlers

import (
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type FAQHandler struct {
	DB *gorm.DB
}

func NewFAQHandler(db *gorm.DB) *FAQHandler {
	return &FAQHandler{DB: db}
}

// GetFAQs obtiene todas las FAQs activas (público)
func (h *FAQHandler) GetFAQs(c echo.Context) error {
	var faqs []models.FAQ
	if err := h.DB.Where("is_active = ?", true).Order("sort_order asc").Find(&faqs).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener preguntas frecuentes"})
	}
	return c.JSON(http.StatusOK, faqs)
}

// GetAllFAQs obtiene todas las FAQs, incluyendo inactivas (admin)
func (h *FAQHandler) GetAllFAQs(c echo.Context) error {
	var faqs []models.FAQ
	if err := h.DB.Order("sort_order asc").Find(&faqs).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener preguntas frecuentes"})
	}
	return c.JSON(http.StatusOK, faqs)
}

// CreateFAQ crea una nueva FAQ
func (h *FAQHandler) CreateFAQ(c echo.Context) error {
	var faq models.FAQ
	if err := c.Bind(&faq); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos"})
	}

	if err := h.DB.Create(&faq).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al crear la pregunta frecuente"})
	}

	return c.JSON(http.StatusCreated, faq)
}

// UpdateFAQ actualiza una FAQ existente
func (h *FAQHandler) UpdateFAQ(c echo.Context) error {
	id := c.Param("id")
	var faq models.FAQ

	if err := h.DB.First(&faq, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Pregunta frecuente no encontrada"})
	}

	if err := c.Bind(&faq); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos"})
	}

	if err := h.DB.Save(&faq).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al actualizar la pregunta frecuente"})
	}

	return c.JSON(http.StatusOK, faq)
}

// DeleteFAQ elimina una FAQ
func (h *FAQHandler) DeleteFAQ(c echo.Context) error {
	id := c.Param("id")
	var faq models.FAQ

	if err := h.DB.First(&faq, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Pregunta frecuente no encontrada"})
	}

	if err := h.DB.Delete(&faq).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al eliminar la pregunta frecuente"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Pregunta frecuente eliminada exitosamente"})
}

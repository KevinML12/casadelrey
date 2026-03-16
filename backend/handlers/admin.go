package handlers

import (
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// AdminHandler centraliza los endpoints del panel de administración.
type AdminHandler struct {
	DB *gorm.DB
}

// NewAdminHandler crea una nueva instancia del handler admin.
func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{DB: db}
}

// GetKPIs godoc
// GET /api/v1/admin/kpis  [Requiere auth + rol admin]
// Devuelve métricas clave del dashboard: totales de usuarios, donaciones, peticiones
// y el total monetario recaudado.
func (h *AdminHandler) GetKPIs(c echo.Context) error {
	var (
		totalUsers     int64
		totalDonations int64
		totalPetitions int64
		totalRevenue   float64
	)

	if err := h.DB.Model(&models.User{}).Count(&totalUsers).Error; err != nil {
		log.Printf("[Admin] Error al contar usuarios: %v", err)
	}
	if err := h.DB.Model(&models.Donation{}).Where("is_successful = ?", true).Count(&totalDonations).Error; err != nil {
		log.Printf("[Admin] Error al contar donaciones: %v", err)
	}
	if err := h.DB.Model(&models.Petition{}).Count(&totalPetitions).Error; err != nil {
		log.Printf("[Admin] Error al contar peticiones: %v", err)
	}
	if err := h.DB.Model(&models.Donation{}).
		Where("is_successful = ?", true).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRevenue).Error; err != nil {
		log.Printf("[Admin] Error al calcular ingresos: %v", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"total_users":     totalUsers,
		"total_donations": totalDonations,
		"total_petitions": totalPetitions,
		"total_revenue":   totalRevenue,
	})
}

// GetDonations godoc
// GET /api/v1/admin/donations  [Requiere auth + rol admin]
// Lista las últimas 50 donaciones exitosas, ordenadas por más recientes.
func (h *AdminHandler) GetDonations(c echo.Context) error {
	var donations []models.Donation
	result := h.DB.
		Where("is_successful = ?", true).
		Order("created_at DESC").
		Limit(50).
		Find(&donations)

	if result.Error != nil {
		log.Printf("[Admin] Error al obtener donaciones: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener las donaciones.",
		})
	}

	return c.JSON(http.StatusOK, donations)
}

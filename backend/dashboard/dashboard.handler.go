package dashboard

import (
	"net/http"

	"casa-del-rey/backend/auth"
	"casa-del-rey/backend/donation"
	"casa-del-rey/backend/petition"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type Handler struct {
	DB *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

// GetKPIs - GET /api/admin/kpis
// Obtiene las estadísticas clave del dashboard (solo admin)
func (h *Handler) GetKPIs(c echo.Context) error {
	var stats struct {
		TotalDonations      int64   `json:"total_donations"`
		TotalDonationAmount float64 `json:"total_donation_amount"`
		CompletedDonations  int64   `json:"completed_donations"`
		TotalUsers          int64   `json:"total_users"`
		TotalPetitions      int64   `json:"total_petitions"`
		TotalPrayerRequests int64   `json:"total_prayer_requests"`
	}

	// Contar donaciones completadas y sumar el monto total
	var completedAmount float64
	h.DB.Model(&donation.Donation{}).
		Where("status = ?", "Completed").
		Count(&stats.CompletedDonations)

	h.DB.Model(&donation.Donation{}).
		Where("status = ?", "Completed").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&completedAmount)

	stats.TotalDonationAmount = completedAmount

	// Contar todas las donaciones
	h.DB.Model(&donation.Donation{}).Count(&stats.TotalDonations)

	// Contar usuarios registrados
	h.DB.Model(&auth.User{}).Count(&stats.TotalUsers)

	// Contar peticiones totales
	h.DB.Model(&petition.Petition{}).Count(&stats.TotalPetitions)

	// Contar peticiones de oración (is_prayer = true)
	h.DB.Model(&petition.Petition{}).
		Where("is_prayer = ?", true).
		Count(&stats.TotalPrayerRequests)

	return c.JSON(http.StatusOK, stats)
}

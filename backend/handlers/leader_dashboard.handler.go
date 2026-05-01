package handlers

import (
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// LeaderDashboardHandler sirve KPIs específicos para el panel del líder.
type LeaderDashboardHandler struct {
	DB *gorm.DB
}

func NewLeaderDashboardHandler(db *gorm.DB) *LeaderDashboardHandler {
	return &LeaderDashboardHandler{DB: db}
}

// GetLeaderKPIs GET /api/v1/leader/kpis — líder autenticado.
func (h *LeaderDashboardHandler) GetLeaderKPIs(c echo.Context) error {
	uid, _ := c.Get("user_id").(uint)

	var totalReports int64
	if err := h.DB.Model(&models.CellReport{}).Where("leader_id = ?", uid).Count(&totalReports).Error; err != nil {
		log.Printf("[LeaderKPI] Error contar reportes: %v", err)
	}

	var pendingReports int64
	if err := h.DB.Model(&models.CellReport{}).
		Where("leader_id = ? AND status = ?", uid, "pendiente").
		Count(&pendingReports).Error; err != nil {
		log.Printf("[LeaderKPI] Error reportes pendientes: %v", err)
	}

	var approvedReports int64
	if err := h.DB.Model(&models.CellReport{}).
		Where("leader_id = ? AND status = ?", uid, "aprobado").
		Count(&approvedReports).Error; err != nil {
		log.Printf("[LeaderKPI] Error reportes aprobados: %v", err)
	}

	var totalBoletas int64
	if err := h.DB.Model(&models.MemberBoleta{}).Where("leader_id = ?", uid).Count(&totalBoletas).Error; err != nil {
		log.Printf("[LeaderKPI] Error boletas: %v", err)
	}

	var totalVolunteers int64
	if err := h.DB.Model(&models.Volunteer{}).
		Where("assigned_leader_id = ?", uid).
		Count(&totalVolunteers).Error; err != nil {
		log.Printf("[LeaderKPI] Error voluntarios: %v", err)
	}

	// Asistentes totales en todas las células del líder
	var totalAttendees int64
	if err := h.DB.Model(&models.CellReport{}).
		Where("leader_id = ?", uid).
		Select("COALESCE(SUM(total_attendees), 0)").
		Scan(&totalAttendees).Error; err != nil {
		log.Printf("[LeaderKPI] Error asistentes: %v", err)
	}

	// Conversiones totales
	var totalConverts int64
	if err := h.DB.Model(&models.CellReport{}).
		Where("leader_id = ?", uid).
		Select("COALESCE(SUM(converts), 0)").
		Scan(&totalConverts).Error; err != nil {
		log.Printf("[LeaderKPI] Error conversiones: %v", err)
	}

	// Últimos 5 reportes
	var recentReports []models.CellReport
	h.DB.Where("leader_id = ?", uid).Order("created_at DESC").Limit(5).Find(&recentReports)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"total_reports":    totalReports,
		"pending_reports":  pendingReports,
		"approved_reports": approvedReports,
		"total_boletas":    totalBoletas,
		"total_volunteers": totalVolunteers,
		"total_attendees":  totalAttendees,
		"total_converts":   totalConverts,
		"recent_reports":   recentReports,
	})
}

// GetCellDirectory GET /api/v1/admin/cell-directory — admin ve todos los líderes + células.
// GET /api/v1/leader/cell-directory — líder ve su propia célula.
func (h *LeaderDashboardHandler) GetCellDirectory(c echo.Context) error {
	role, _ := c.Get("user_role").(string)
	uid, _ := c.Get("user_id").(uint)

	type LeaderEntry struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Email    string `json:"email"`
		CellCode string `json:"cell_code"`
		CellType string `json:"cell_type"`
		Members  int64  `json:"member_count"`
	}

	q := h.DB.Model(&models.User{}).Where("role = ? AND cell_code != ''", "leader")
	if role == "leader" {
		q = q.Where("id = ?", uid)
	}

	var leaders []models.User
	if err := q.Find(&leaders).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener el directorio."})
	}

	result := make([]LeaderEntry, 0, len(leaders))
	for _, l := range leaders {
		var count int64
		h.DB.Model(&models.User{}).Where("cell_code = ? AND role = ?", l.CellCode, "member").Count(&count)
		result = append(result, LeaderEntry{
			ID:       l.ID,
			Name:     l.Name,
			Email:    l.Email,
			CellCode: l.CellCode,
			CellType: l.CellType,
			Members:  count,
		})
	}

	return c.JSON(http.StatusOK, result)
}

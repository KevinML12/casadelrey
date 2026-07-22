package handlers

import (
	"log"
	"net/http"
	"time"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// CellReportHandler maneja los reportes de células.
type CellReportHandler struct {
	DB *gorm.DB
}

func NewCellReportHandler(db *gorm.DB) *CellReportHandler {
	return &CellReportHandler{DB: db}
}

// CreateCellReport POST /api/v1/admin/cell-reports — admin o líder.
func (h *CellReportHandler) CreateCellReport(c echo.Context) error {
	var req struct {
		CellCode       string  `json:"cell_code"`
		CellName       string  `json:"cell_name"`
		CellType       string  `json:"cell_type"`
		MeetingDate    string  `json:"meeting_date"`
		LeaderName     string  `json:"leader_name"`
		PastorName     string  `json:"pastor_name"`
		HostName       string  `json:"host_name"`
		HostPhone      string  `json:"host_phone"`
		Address        string  `json:"address"`
		Topic          string  `json:"topic"`
		TotalAttendees int     `json:"total_attendees"`
		Converts       int     `json:"converts"`
		Reconciled     int     `json:"reconciled"`
		Offering       float64 `json:"offering"`
		PhotoURL       string  `json:"photo_url"`
		Notes          string  `json:"notes"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos."})
	}
	if req.CellName == "" || req.MeetingDate == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre de célula y fecha son obligatorios."})
	}

	userID, _ := c.Get("user_id").(uint)
	leaderName := req.LeaderName
	if role, _ := c.Get("user_role").(string); role == "leader" {
		if name, ok := c.Get("user_name").(string); ok && name != "" {
			leaderName = name
		}
	}

	r := models.CellReport{
		CellCode:       req.CellCode,
		CellName:       req.CellName,
		CellType:       req.CellType,
		MeetingDate:    req.MeetingDate,
		LeaderID:       &userID,
		LeaderName:     leaderName,
		PastorName:     req.PastorName,
		HostName:       req.HostName,
		HostPhone:      req.HostPhone,
		Address:        req.Address,
		Topic:          req.Topic,
		TotalAttendees: req.TotalAttendees,
		Converts:       req.Converts,
		Reconciled:     req.Reconciled,
		NewMembers:     req.Converts + req.Reconciled,
		Offering:       req.Offering,
		PhotoURL:       req.PhotoURL,
		Notes:          req.Notes,
		Status:         "pendiente",
	}

	if err := h.DB.Create(&r).Error; err != nil {
		log.Printf("[CellReport] Error al guardar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo guardar el reporte."})
	}

	log.Printf("[CellReport] Reporte creado: %s (%s) — %s", r.CellName, r.CellCode, r.MeetingDate)

	LogActivity(h.DB, userID, leaderName, "create", "cell_report", r.ID, r.CellName+" — "+r.MeetingDate, c.RealIP())

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Reporte enviado, pendiente de aprobación.",
		"id":      r.ID,
	})
}

// GetAllCellReports GET /api/v1/admin/cell-reports — admin ve todo, leader solo los suyos.
func (h *CellReportHandler) GetAllCellReports(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Model(&models.CellReport{})
	if role, _ := c.Get("user_role").(string); role == "leader" {
		uid, _ := c.Get("user_id").(uint)
		q = q.Where("leader_id = ?", uid)
	}
	if status := c.QueryParam("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if cellType := c.QueryParam("cell_type"); cellType != "" {
		q = q.Where("cell_type = ?", cellType)
	}
	if search := c.QueryParam("q"); search != "" {
		like := "%" + search + "%"
		q = q.Where("cell_name ILIKE ? OR leader_name ILIKE ?", like, like)
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var reports []models.CellReport
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&reports).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener los reportes."})
	}
	return c.JSON(http.StatusOK, PagedResponse{Data: reports, Meta: newMeta(total, page, limit)})
}

// ApproveReport PUT /api/v1/admin/cell-reports/:id/approve — solo admin.
func (h *CellReportHandler) ApproveReport(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		Status string `json:"status"` // aprobado | rechazado
	}
	if err := c.Bind(&req); err != nil || (req.Status != "aprobado" && req.Status != "rechazado") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Estado debe ser 'aprobado' o 'rechazado'."})
	}

	var r models.CellReport
	if err := h.DB.First(&r, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Reporte no encontrado."})
	}

	adminID, _ := c.Get("user_id").(uint)
	now := time.Now()
	r.Status = req.Status
	r.ApprovedByID = &adminID
	r.ApprovedAt = &now
	h.DB.Save(&r)

	adminName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, adminID, adminName, "approve", "cell_report", r.ID, r.CellName+" → "+req.Status, c.RealIP())

	return c.JSON(http.StatusOK, r)
}

// GetCellStats GET /api/v1/admin/cell-reports/stats
func (h *CellReportHandler) GetCellStats(c echo.Context) error {
	base := h.DB.Model(&models.CellReport{})

	if role, _ := c.Get("user_role").(string); role == "leader" {
		uid, _ := c.Get("user_id").(uint)
		base = base.Where("leader_id = ?", uid)
	}

	var totalReports int64
	var totalAttendees int64
	var totalConverts int64
	var totalReconciled int64
	var totalOffering float64

	base.Count(&totalReports)
	base.Select("COALESCE(SUM(total_attendees), 0)").Scan(&totalAttendees)
	base.Select("COALESCE(SUM(converts), 0)").Scan(&totalConverts)
	base.Select("COALESCE(SUM(reconciled), 0)").Scan(&totalReconciled)
	base.Select("COALESCE(SUM(offering), 0)").Scan(&totalOffering)

	type CellSum struct {
		CellName       string  `gorm:"column:cell_name"`
		CellCode       string  `gorm:"column:cell_code"`
		Reports        int64   `gorm:"column:reports"`
		TotalAttendees int64   `gorm:"column:total_attendees"`
		Converts       int64   `gorm:"column:converts"`
		Reconciled     int64   `gorm:"column:reconciled"`
		TotalOffering  float64 `gorm:"column:total_offering"`
	}
	var byCell []CellSum
	base.Select("cell_name, cell_code, COUNT(*) as reports, COALESCE(SUM(total_attendees), 0) as total_attendees, COALESCE(SUM(converts), 0) as converts, COALESCE(SUM(reconciled), 0) as reconciled, COALESCE(SUM(offering), 0) as total_offering").
		Group("cell_name, cell_code").
		Scan(&byCell)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"total_reports":    totalReports,
		"total_attendees":  totalAttendees,
		"total_converts":   totalConverts,
		"total_reconciled": totalReconciled,
		"total_offering":   totalOffering,
		"by_cell":          byCell,
	})
}

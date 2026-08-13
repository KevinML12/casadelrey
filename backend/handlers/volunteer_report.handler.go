package handlers

import (
	"log"
	"net/http"
	"time"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type VolunteerReportHandler struct {
	DB *gorm.DB
}

func NewVolunteerReportHandler(db *gorm.DB) *VolunteerReportHandler {
	return &VolunteerReportHandler{DB: db}
}

func (h *VolunteerReportHandler) CreateVolunteerReport(c echo.Context) error {
	var req struct {
		VolunteerName  string `json:"volunteer_name"`
		Area           string `json:"area"`
		ServiceDate    string `json:"service_date"`
		LeaderName     string `json:"leader_name"`
		TeamAttendance int    `json:"team_attendance"`
		PhotoURL       string `json:"photo_url"`
		Notes          string `json:"notes"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos de entrada inválidos."})
	}
	if req.VolunteerName == "" || req.Area == "" || req.ServiceDate == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nombre, área y fecha son obligatorios."})
	}

	userID, _ := c.Get("user_id").(uint)

	r := models.VolunteerReport{
		VolunteerID:    &userID,
		VolunteerName:  req.VolunteerName,
		Area:           req.Area,
		ServiceDate:    req.ServiceDate,
		LeaderName:     req.LeaderName,
		TeamAttendance: req.TeamAttendance,
		PhotoURL:       req.PhotoURL,
		Notes:          req.Notes,
		Status:         "pendiente",
	}

	if err := h.DB.Create(&r).Error; err != nil {
		log.Printf("[VolunteerReport] Error al guardar: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo guardar el reporte."})
	}

	log.Printf("[VolunteerReport] Reporte creado: %s — %s (%s)", r.VolunteerName, r.Area, r.ServiceDate)

	userName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, userID, userName, "create", "volunteer_report", r.ID, r.VolunteerName+" — "+r.Area, c.RealIP())

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "Reporte de servicio enviado con éxito.",
		"id":      r.ID,
	})
}

func (h *VolunteerReportHandler) GetAllVolunteerReports(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Model(&models.VolunteerReport{})
	
	// Si no es admin, solo ve los suyos
	if role, _ := c.Get("user_role").(string); role != "admin" {
		uid, _ := c.Get("user_id").(uint)
		q = q.Where("volunteer_id = ?", uid)
	}

	if status := c.QueryParam("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if area := c.QueryParam("area"); area != "" {
		q = q.Where("area = ?", area)
	}
	if search := c.QueryParam("q"); search != "" {
		like := "%" + search + "%"
		q = q.Where("volunteer_name ILIKE ? OR area ILIKE ?", like, like)
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var reports []models.VolunteerReport
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&reports).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener los reportes."})
	}
	return c.JSON(http.StatusOK, PagedResponse{Data: reports, Meta: newMeta(total, page, limit)})
}

func (h *VolunteerReportHandler) ApproveReport(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		Status string `json:"status"`
	}
	if err := c.Bind(&req); err != nil || (req.Status != "aprobado" && req.Status != "rechazado") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Estado debe ser 'aprobado' o 'rechazado'."})
	}

	var r models.VolunteerReport
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
	LogActivity(h.DB, adminID, adminName, "approve", "volunteer_report", r.ID, r.VolunteerName+" → "+req.Status, c.RealIP())

	return c.JSON(http.StatusOK, r)
}

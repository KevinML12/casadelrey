package handlers

import (
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// ActivityLogHandler expone el historial de actividad para el panel admin.
type ActivityLogHandler struct {
	DB *gorm.DB
}

func NewActivityLogHandler(db *gorm.DB) *ActivityLogHandler {
	return &ActivityLogHandler{DB: db}
}

// GetActivityLog GET /api/v1/admin/activity-log — admin.
func (h *ActivityLogHandler) GetActivityLog(c echo.Context) error {
	page, limit := parsePage(c)

	q := h.DB.Model(&models.ActivityLog{})

	if action := c.QueryParam("action"); action != "" {
		q = q.Where("action = ?", action)
	}
	if resource := c.QueryParam("resource"); resource != "" {
		q = q.Where("resource = ?", resource)
	}
	if userID := c.QueryParam("user_id"); userID != "" {
		q = q.Where("user_id = ?", userID)
	}

	var total int64
	q.Count(&total)

	offset := (page - 1) * limit
	var logs []models.ActivityLog
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener el historial."})
	}

	return c.JSON(http.StatusOK, PagedResponse{Data: logs, Meta: newMeta(total, page, limit)})
}

// LogActivity registra una acción en el historial. Llamado internamente por el middleware.
func LogActivity(db *gorm.DB, userID uint, userName, action, resource string, resourceID uint, details, ip string) {
	entry := models.ActivityLog{
		UserID:     userID,
		UserName:   userName,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		Details:    details,
		IPAddress:  ip,
	}
	db.Create(&entry)
}

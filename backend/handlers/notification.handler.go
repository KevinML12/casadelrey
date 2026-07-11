package handlers

import (
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// NotificationHandler sirve contadores de notificaciones para la barra lateral.
type NotificationHandler struct {
	DB *gorm.DB
}

func NewNotificationHandler(db *gorm.DB) *NotificationHandler {
	return &NotificationHandler{DB: db}
}

// GetCounts GET /api/v1/admin/notifications/counts — admin o líder.
// Devuelve el número de peticiones sin leer, reportes pendientes y voluntarios pendientes.
func (h *NotificationHandler) GetCounts(c echo.Context) error {
	role, _ := c.Get("user_role").(string)
	uid, _ := c.Get("user_id").(uint)

	var unreadPetitions int64
	var pendingReports int64
	var pendingVolunteers int64
	var pendingReceipts int64
	var pendingConnectCards int64

	if err := h.DB.Model(&models.Petition{}).Where("is_answered = ?", false).Count(&unreadPetitions).Error; err != nil {
		log.Printf("[Notifications] Error petitions: %v", err)
	}

	reportsQ := h.DB.Model(&models.CellReport{}).Where("status = ?", "pendiente")
	if role == "leader" {
		reportsQ = reportsQ.Where("leader_id = ?", uid)
	}
	if err := reportsQ.Count(&pendingReports).Error; err != nil {
		log.Printf("[Notifications] Error cell reports: %v", err)
	}

	volQ := h.DB.Model(&models.Volunteer{}).Where("status = ?", "pendiente")
	if role == "leader" {
		volQ = volQ.Where("assigned_leader_id = ?", uid)
	}
	if err := volQ.Count(&pendingVolunteers).Error; err != nil {
		log.Printf("[Notifications] Error volunteers: %v", err)
	}

	if role == "admin" {
		if err := h.DB.Model(&models.PaymentReceipt{}).Where("status = ?", "pendiente").Count(&pendingReceipts).Error; err != nil {
			log.Printf("[Notifications] Error receipts: %v", err)
		}
	}

	// Tarjetas de conexión sin contactar aún — visible a admin y líder por
	// igual (nacen sin asignar; cualquiera del equipo puede darles seguimiento).
	if err := h.DB.Model(&models.ConnectCard{}).Where("status = ?", "nuevo").Count(&pendingConnectCards).Error; err != nil {
		log.Printf("[Notifications] Error connect cards: %v", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"unread_petitions":      unreadPetitions,
		"pending_reports":       pendingReports,
		"pending_volunteers":    pendingVolunteers,
		"pending_receipts":      pendingReceipts,
		"pending_connect_cards": pendingConnectCards,
		"total":                 unreadPetitions + pendingReports + pendingVolunteers + pendingReceipts + pendingConnectCards,
	})
}

package handlers

import (
	"casadelrey/backend/config"
	"casadelrey/backend/email"
	"casadelrey/backend/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"net/http"
	"strings"
	"time"
)

type EmailHandler struct {
	DB     *gorm.DB
	Config *config.Config
}

func (h *EmailHandler) Status(c echo.Context) error {
	counts := map[string]int64{}
	var rows []struct {
		Status string
		Count  int64
	}
	if err := h.DB.Model(&models.EmailMessage{}).Select("status, count(*) AS count").Group("status").Scan(&rows).Error; err != nil {
		return c.JSON(500, map[string]string{"error": "No se pudo consultar la cola de correos."})
	}
	for _, r := range rows {
		counts[r.Status] = r.Count
	}
	cfg := h.Config
	return c.JSON(200, map[string]interface{}{"provider": "Brevo", "configured": email.Ready(cfg), "api_key_configured": cfg != nil && cfg.BrevoKey != "", "sender_configured": cfg != nil && email.ValidAddress(cfg.MailFromEmail), "frontend_configured": cfg != nil && cfg.ClientURL != "", "counts": counts, "local_limit_24h": 250})
}
func (h *EmailHandler) List(c echo.Context) error {
	page, limit := parsePage(c)
	q := h.DB.Model(&models.EmailMessage{})
	if status := c.QueryParam("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return c.JSON(500, map[string]string{"error": "No se pudo consultar la cola."})
	}
	var rows []models.EmailMessage
	if err := q.Order("id DESC").Offset((page - 1) * limit).Limit(limit).Find(&rows).Error; err != nil {
		return c.JSON(500, map[string]string{"error": "No se pudieron consultar los correos."})
	}
	out := make([]map[string]interface{}, 0, len(rows))
	for _, r := range rows {
		parts := strings.SplitN(r.Recipient, "@", 2)
		masked := "Correo protegido"
		if len(parts) == 2 && len(parts[0]) > 0 {
			masked = parts[0][:1] + "…@" + parts[1]
		}
		out = append(out, map[string]interface{}{"id": r.ID, "recipient": masked, "subject": r.Subject, "kind": r.Kind, "status": r.Status, "attempts": r.Attempts, "last_error": r.LastError, "created_at": r.CreatedAt, "accepted_at": r.AcceptedAt, "provider_id": r.ProviderID, "expires_at": r.ExpiresAt})
	}
	c.Response().Header().Set("Cache-Control", "private, no-store")
	return c.JSON(200, PagedResponse{Data: out, Meta: newMeta(total, page, limit)})
}
func (h *EmailHandler) Retry(c echo.Context) error {
	if !email.Ready(h.Config) {
		return c.JSON(503, map[string]string{"error": "Conecta primero el remitente y la clave de Brevo en Render."})
	}
	result := h.DB.Model(&models.EmailMessage{}).Where("id = ? AND status = ? AND expires_at > ? AND payload <> ? AND last_error IN ?", c.Param("id"), "failed", time.Now(), "", []string{"provider_400", "provider_401", "provider_403", "provider_429", "provider_422"}).Updates(map[string]interface{}{"status": "pending", "next_attempt_at": time.Now(), "attempts": 0, "last_error": "", "retry_until": nil})
	if result.Error != nil {
		return c.JSON(500, map[string]string{"error": "No se pudo preparar el reintento."})
	}
	if result.RowsAffected != 1 {
		return c.JSON(409, map[string]string{"error": "Este correo no admite reintento automático. Revisa Brevo; un envío incierto podría estar entregado."})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "El correo vuelve a estar en cola."})
}

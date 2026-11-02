package handlers

import (
	"casadelrey/backend/models"
	"encoding/json"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Appended inside the financial transaction; never overwrite a prior decision.
func recordPaymentDecision(tx *gorm.DB, c echo.Context, resource string, id, revision uint, from, to, reason string) error {
	actor, _ := c.Get("user_id").(uint)
	name, _ := c.Get("user_name").(string)
	if actor == 0 {
		name = "Corrección mediante enlace privado"
	}
	details, err := json.Marshal(map[string]interface{}{"revision": revision, "previous_state": from, "state": to, "reason": reason})
	if err != nil {
		return err
	}
	return tx.Create(&models.ActivityLog{UserID: actor, UserName: name, Action: "payment_decision", Resource: resource, ResourceID: id, Details: string(details), IPAddress: c.RealIP()}).Error
}

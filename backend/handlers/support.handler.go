package handlers

import (
	"casadelrey/backend/models"
	"casadelrey/backend/storage"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

type SupportHandler struct {
	DB    *gorm.DB
	Store storage.SupportStore
}

func NewSupportHandler(db *gorm.DB, store storage.Store) *SupportHandler {
	private, _ := store.(storage.SupportStore)
	return &SupportHandler{DB: db.Session(&gorm.Session{Logger: db.Logger.LogMode(logger.Silent)}), Store: private}
}

var supportModules = []struct {
	Value string `json:"value"`
	Label string `json:"label"`
}{
	{"general", "General"}, {"acceso", "Acceso y perfil"}, {"celulas", "Células y reportes"}, {"voluntariado", "Voluntariado"}, {"eventos", "Eventos"}, {"aportes", "Donaciones y comprobantes"}, {"galeria", "Galería"}, {"contenido", "Contenido del sitio"}, {"configuracion", "Configuración"},
}
var supportStates = []struct {
	Value string `json:"value"`
	Label string `json:"label"`
}{{"abierto", "Abierto"}, {"en_revision", "En revisión"}, {"esperando_respuesta", "Esperando respuesta"}, {"resuelto", "Resuelto"}}

func supportState(value string) bool {
	for _, item := range supportStates {
		if value == item.Value {
			return true
		}
	}
	return false
}
func supportActor(c echo.Context) (uint, string, bool) {
	id, _ := c.Get("user_id").(uint)
	name, _ := c.Get("user_name").(string)
	role, _ := c.Get("user_role").(string)
	return id, name, role == "admin"
}
func supportError(c echo.Context, err error) error {
	var httpErr *echo.HTTPError
	if errors.As(err, &httpErr) {
		return c.JSON(httpErr.Code, map[string]interface{}{"error": httpErr.Message})
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(404, map[string]string{"error": "Caso no encontrado."})
	}
	log.Printf("[Support] Operation failed (%T)", err)
	return c.JSON(503, map[string]string{"error": "No se pudo completar la operación de soporte. Tus datos se conservan para reintentar."})
}
func supportHash(value string) string {
	hash := sha256.Sum256([]byte(value))
	return hex.EncodeToString(hash[:])
}
func supportSubmission(c echo.Context, scope string) (string, error) {
	key := c.Request().Header.Get("Idempotency-Key")
	if !donationKeyPattern.MatchString(key) {
		return "", echo.NewHTTPError(400, "No se pudo identificar el envío. Vuelve a intentarlo desde el formulario.")
	}
	id, _, _ := supportActor(c)
	return supportHash(fmt.Sprintf("support:%d:%s:%s", id, scope, key)), nil
}
func supportLock(tx *gorm.DB, key string) error {
	if tx.Dialector.Name() == "postgres" {
		return tx.Exec("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", key).Error
	}
	return nil
}
func supportScope(tx *gorm.DB, c echo.Context) *gorm.DB {
	id, _, admin := supportActor(c)
	if !admin {
		return tx.Where("owner_id = ?", id)
	}
	return tx
}
func supportTicket(tx *gorm.DB, c echo.Context, id string, lock bool) (models.SupportTicket, error) {
	var ticket models.SupportTicket
	parsed, err := strconv.ParseUint(id, 10, 32)
	if err != nil || parsed == 0 {
		return ticket, gorm.ErrRecordNotFound
	}
	q := supportScope(tx, c)
	if lock {
		q = q.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err = q.First(&ticket, uint(parsed)).Error
	return ticket, err
}
func (h *SupportHandler) Options(c echo.Context) error {
	return c.JSON(200, map[string]interface{}{"modules": supportModules, "states": supportStates, "max_attachments": 12, "max_file_size": 5 << 20})
}
func (h *SupportHandler) List(c echo.Context) error {
	page, limit := parsePage(c)
	state := c.QueryParam("status")
	if state != "" && !supportState(state) {
		return c.JSON(400, map[string]string{"error": "Estado no válido."})
	}
	q := supportScope(h.DB.Model(&models.SupportTicket{}), c)
	if state != "" {
		q = q.Where("status = ?", state)
	}
	search := strings.TrimSpace(c.QueryParam("q"))
	if utf8.RuneCountInString(search) > 160 {
		return c.JSON(400, map[string]string{"error": "La búsqueda admite hasta 160 caracteres."})
	}
	if search != "" {
		q = q.Where("LOWER(subject) LIKE ?", "%"+strings.ToLower(search)+"%")
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return supportError(c, err)
	}
	var tickets []models.SupportTicket
	if err := q.Order("updated_at DESC, id DESC").Limit(limit).Offset((page - 1) * limit).Find(&tickets).Error; err != nil {
		return supportError(c, err)
	}
	return c.JSON(200, PagedResponse{Data: tickets, Meta: newMeta(total, page, limit)})
}
func (h *SupportHandler) Create(c echo.Context) error {
	var req struct {
		Subject string `json:"subject"`
		Module  string `json:"module"`
		Body    string `json:"body"`
	}
	if c.Bind(&req) != nil {
		return c.JSON(400, map[string]string{"error": "Revisa los datos del caso."})
	}
	req.Subject = strings.TrimSpace(req.Subject)
	req.Body = strings.TrimSpace(req.Body)
	validModule := false
	for _, item := range supportModules {
		if req.Module == item.Value {
			validModule = true
		}
	}
	if utf8.RuneCountInString(req.Subject) < 5 || utf8.RuneCountInString(req.Subject) > 160 || utf8.RuneCountInString(req.Body) < 10 || utf8.RuneCountInString(req.Body) > 5000 || !validModule {
		return c.JSON(400, map[string]string{"error": "Indica un asunto de 5–160 caracteres, el módulo y una descripción de 10–5000 caracteres."})
	}
	key, err := supportSubmission(c, "ticket")
	if err != nil {
		return supportError(c, err)
	}
	encoded, _ := json.Marshal(req)
	hash := supportHash(string(encoded))
	id, name, _ := supportActor(c)
	var ticket models.SupportTicket
	replayed := false
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := supportLock(tx, key); err != nil {
			return err
		}
		existing := tx.Where("submission_key = ?", key).First(&ticket).Error
		if existing == nil {
			if ticket.RequestHash != hash {
				return echo.NewHTTPError(409, "Este envío ya se utilizó con otros datos.")
			}
			replayed = true
			return nil
		}
		if !errors.Is(existing, gorm.ErrRecordNotFound) {
			return existing
		}
		if err := supportLock(tx, fmt.Sprintf("support-owner:%d", id)); err != nil {
			return err
		}
		var recent int64
		if err := tx.Model(&models.SupportTicket{}).Where("owner_id = ? AND created_at > ?", id, time.Now().Add(-24*time.Hour)).Count(&recent).Error; err != nil {
			return err
		}
		if recent >= 20 {
			return echo.NewHTTPError(429, "Se alcanzó el límite de 20 casos diarios. Continúa en uno de tus casos existentes.")
		}
		ticket = models.SupportTicket{OwnerID: id, OwnerName: name, Subject: req.Subject, Module: req.Module, Status: "abierto", SubmissionKey: key, RequestHash: hash}
		if err := tx.Create(&ticket).Error; err != nil {
			return err
		}
		return tx.Create(&models.SupportMessage{TicketID: ticket.ID, AuthorID: id, AuthorName: name, Kind: "mensaje", Body: req.Body}).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	status := 201
	if replayed {
		status = 200
	}
	return c.JSON(status, ticket)
}
func (h *SupportHandler) Detail(c echo.Context) error {
	ticket, err := supportTicket(h.DB, c, c.Param("id"), false)
	if err != nil {
		return supportError(c, err)
	}
	page, limit := parsePage(c)
	var total int64
	if err := h.DB.Model(&models.SupportMessage{}).Where("ticket_id = ?", ticket.ID).Count(&total).Error; err != nil {
		return supportError(c, err)
	}
	var messages []models.SupportMessage
	if err := h.DB.Where("ticket_id = ?", ticket.ID).Order("id DESC").Limit(limit).Offset((page - 1) * limit).Find(&messages).Error; err != nil {
		return supportError(c, err)
	}
	var attachments []models.SupportAttachment
	if err := h.DB.Where("ticket_id = ? AND status = ?", ticket.ID, "ready").Order("id ASC").Find(&attachments).Error; err != nil {
		return supportError(c, err)
	}
	return c.JSON(200, map[string]interface{}{"ticket": ticket, "messages": messages, "meta": newMeta(total, page, limit), "attachments": attachments})
}
func (h *SupportHandler) Reply(c echo.Context) error {
	var req struct {
		Body string `json:"body"`
	}
	if c.Bind(&req) != nil {
		return c.JSON(400, map[string]string{"error": "Escribe una respuesta."})
	}
	req.Body = strings.TrimSpace(req.Body)
	if utf8.RuneCountInString(req.Body) < 2 || utf8.RuneCountInString(req.Body) > 5000 {
		return c.JSON(400, map[string]string{"error": "La respuesta admite de 2 a 5000 caracteres."})
	}
	key, err := supportSubmission(c, "reply:"+c.Param("id"))
	if err != nil {
		return supportError(c, err)
	}
	id, name, _ := supportActor(c)
	hash := supportHash(req.Body)
	var message models.SupportMessage
	replayed := false
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		ticket, err := supportTicket(tx, c, c.Param("id"), true)
		if err != nil {
			return err
		}
		err = tx.Where("submission_key = ?", key).First(&message).Error
		if err == nil {
			if message.RequestHash != hash {
				return echo.NewHTTPError(409, "Este envío ya se usó con otra respuesta.")
			}
			replayed = true
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if ticket.Status == "resuelto" {
			return echo.NewHTTPError(409, "Reabre el caso para continuar la conversación.")
		}
		message = models.SupportMessage{TicketID: ticket.ID, AuthorID: id, AuthorName: name, Kind: "mensaje", Body: req.Body, SubmissionKey: &key, RequestHash: hash}
		if err := tx.Create(&message).Error; err != nil {
			return err
		}
		// A requester reply puts the case back in the team's queue, in the same history.
		if id == ticket.OwnerID && ticket.Status == "esperando_respuesta" {
			if err := tx.Create(&models.SupportMessage{TicketID: ticket.ID, AuthorID: id, AuthorName: name, Kind: "estado", PreviousStatus: ticket.Status, Status: "abierto", Body: "Respuesta recibida."}).Error; err != nil {
				return err
			}
			ticket.Status = "abierto"
		}
		return tx.Model(&ticket).Updates(map[string]interface{}{"status": ticket.Status, "revision": gorm.Expr("revision + 1")}).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	status := 201
	if replayed {
		status = 200
	}
	return c.JSON(status, message)
}
func (h *SupportHandler) ChangeStatus(c echo.Context) error {
	var req struct {
		Status   string `json:"status"`
		Revision uint   `json:"revision"`
		Note     string `json:"note"`
	}
	if c.Bind(&req) != nil || !supportState(req.Status) {
		return c.JSON(400, map[string]string{"error": "Estado no válido."})
	}
	req.Note = strings.TrimSpace(req.Note)
	if utf8.RuneCountInString(req.Note) > 2000 || ((req.Status == "resuelto" || req.Status == "esperando_respuesta") && utf8.RuneCountInString(req.Note) < 5) {
		return c.JSON(400, map[string]string{"error": "Para resolver o solicitar información, escribe una nota de 5–2000 caracteres."})
	}
	var ticket models.SupportTicket
	id, name, admin := supportActor(c)
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var err error
		ticket, err = supportTicket(tx, c, c.Param("id"), true)
		if err != nil {
			return err
		}
		if !admin && !(ticket.Status == "resuelto" && req.Status == "abierto") {
			return echo.NewHTTPError(403, "Sólo puedes reabrir tus casos resueltos.")
		}
		if ticket.Status == req.Status {
			return nil
		}
		if ticket.Revision != req.Revision {
			return echo.NewHTTPError(409, "El caso cambió. Actualízalo antes de cambiar su estado.")
		}
		if err := tx.Create(&models.SupportMessage{TicketID: ticket.ID, AuthorID: id, AuthorName: name, Kind: "estado", PreviousStatus: ticket.Status, Status: req.Status, Body: req.Note}).Error; err != nil {
			return err
		}
		ticket.Status = req.Status
		ticket.Revision++
		return tx.Save(&ticket).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, ticket)
}

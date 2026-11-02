package handlers

import (
	"log"
	"net/http"
	"strconv"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// EventHandler maneja el CRUD de eventos de la iglesia.
type EventHandler struct {
	DB *gorm.DB
}

// NewEventHandler crea una nueva instancia del handler de eventos.
func NewEventHandler(db *gorm.DB) *EventHandler {
	return &EventHandler{DB: db}
}

// eventWithAvailability agrega el cupo disponible a la respuesta pública sin
// tocar la tabla Event. SpotsRemaining queda nil cuando el evento no tiene
// límite de cupo (Capacity == 0), asi el frontend distingue "sin límite" de
// "cupo lleno" (spots_remaining: 0).
type eventWithAvailability struct {
	models.Event
	AttendeeCount  int64 `json:"attendee_count"`
	SpotsRemaining *int  `json:"spots_remaining"`
	IsFull         bool  `json:"is_full"`
}

func withAvailability(db *gorm.DB, ev models.Event) (eventWithAvailability, error) {
	attendeeCount, err := occupiedSeats(db, ev.ID, 0)
	if err != nil {
		return eventWithAvailability{}, err
	}
	item := eventWithAvailability{Event: ev, AttendeeCount: attendeeCount}
	if ev.Capacity > 0 {
		remaining := ev.Capacity - int(attendeeCount)
		if remaining < 0 {
			remaining = 0
		}
		item.SpotsRemaining = &remaining
		item.IsFull = remaining <= 0
	}
	return item, nil
}

// GetEvents godoc
// GET /api/v1/events/
// Lista todos los eventos activos, ordenados por fecha ascendente.
func (h *EventHandler) GetEvents(c echo.Context) error { return h.listEvents(c, true) }

// GetAdminEvents includes unpublished events so administrators can reactivate them.
func (h *EventHandler) GetAdminEvents(c echo.Context) error { return h.listEvents(c, false) }

func (h *EventHandler) listEvents(c echo.Context, activeOnly bool) error {
	var events []models.Event
	query := h.DB.Order("date ASC")
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}
	result := query.Find(&events)

	if result.Error != nil {
		log.Printf("[Events] Error al obtener eventos: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener los eventos.",
		})
	}

	out := make([]eventWithAvailability, 0, len(events))
	for _, ev := range events {
		item, err := withAvailability(h.DB, ev)
		if err != nil {
			return c.JSON(503, map[string]string{"error": "No se pudo comprobar la disponibilidad. Vuelve a intentarlo."})
		}
		out = append(out, item)
	}

	return c.JSON(http.StatusOK, out)
}

// CreateEvent godoc
// POST /api/v1/admin/events  [Requiere auth + rol admin]
// Crea un nuevo evento.
func (h *EventHandler) CreateEvent(c echo.Context) error {
	event := new(models.Event)
	if err := c.Bind(event); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	if err := validateEvent(event); err != nil {
		return receiptWriteError(c, err)
	}
	event.Model = gorm.Model{}

	event.IsActive = true

	if result := h.DB.Create(event); result.Error != nil {
		log.Printf("[Events] Error al crear evento: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo crear el evento.",
		})
	}

	userID, _ := c.Get("user_id").(uint)
	userName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, userID, userName, "create", "event", event.ID, event.Title, c.RealIP())

	return c.JSON(http.StatusCreated, event)
}

// UpdateEvent godoc
// PUT /api/v1/admin/events/:id  [Requiere auth + rol admin]
// Actualiza un evento existente.
func (h *EventHandler) UpdateEvent(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "ID de evento inválido.",
		})
	}

	var event models.Event
	if result := h.DB.First(&event, id); result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Evento no encontrado.",
		})
	}
	original := event

	// Bind sobre un struct aparte -- ver nota en faq.handler.go UpdateFAQ:
	// c.Bind(&event) directo permitia pisar ID/CreatedAt/DeletedAt via el
	// body (AdminEvents.jsx manda el form completo, que puede incluir el
	// ID) y arriesgaba que Save() tocara otra fila en vez del :id pedido.
	var req struct {
		Title            *string  `json:"title"`
		Date             *string  `json:"date"`
		Time             *string  `json:"time"`
		Location         *string  `json:"location"`
		Description      *string  `json:"description"`
		CoverImage       *string  `json:"cover_image"`
		IsActive         *bool    `json:"is_active"`
		RequiresPayment  *bool    `json:"requires_payment"`
		PriceGTQ         *float64 `json:"price_gtq"`
		PaymentDeadline  *string  `json:"payment_deadline"`
		Capacity         *int     `json:"capacity"`
		ReservationHours *int     `json:"reservation_hours"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}
	if req.Title != nil {
		event.Title = *req.Title
	}
	if req.Date != nil {
		event.Date = *req.Date
	}
	if req.Time != nil {
		event.Time = *req.Time
	}
	if req.Location != nil {
		event.Location = *req.Location
	}
	if req.Description != nil {
		event.Description = *req.Description
	}
	if req.CoverImage != nil {
		event.CoverImage = *req.CoverImage
	}
	if req.IsActive != nil {
		event.IsActive = *req.IsActive
	}
	if req.RequiresPayment != nil {
		event.RequiresPayment = *req.RequiresPayment
	}
	if req.PriceGTQ != nil {
		event.PriceGTQ = *req.PriceGTQ
	}
	if req.PaymentDeadline != nil {
		event.PaymentDeadline = *req.PaymentDeadline
	}
	if req.Capacity != nil {
		event.Capacity = *req.Capacity
	}
	if req.ReservationHours != nil {
		event.ReservationHours = *req.ReservationHours
	}
	if err := validateEvent(&event); err != nil {
		return receiptWriteError(c, err)
	}

	if err := h.DB.Transaction(func(tx *gorm.DB) error {
		var current models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&current, event.ID).Error; err != nil {
			return err
		}
		if !current.UpdatedAt.Equal(original.UpdatedAt) {
			return echo.NewHTTPError(409, "El evento cambió mientras lo editabas. Recarga antes de guardar.")
		}
		if event.RequiresPayment != current.RequiresPayment || event.PriceGTQ != current.PriceGTQ {
			var n int64
			if err := tx.Model(&models.EventRegistration{}).Where("event_id = ?", event.ID).Count(&n).Error; err != nil {
				return err
			}
			if n > 0 {
				return echo.NewHTTPError(409, "Con inscripciones guardadas no se puede cambiar el precio o el método de cobro. Crea otra convocatoria.")
			}
		}
		if event.Capacity > 0 {
			occupied, err := occupiedSeats(tx, event.ID, 0)
			if err != nil {
				return err
			}
			if occupied > int64(event.Capacity) {
				return echo.NewHTTPError(409, "El cupo no puede ser menor que las plazas ya reservadas.")
			}
		}
		return tx.Save(&event).Error
	}); err != nil {
		return receiptWriteError(c, err)
	}

	userID, _ := c.Get("user_id").(uint)
	userName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, userID, userName, "update", "event", event.ID, event.Title, c.RealIP())

	return c.JSON(http.StatusOK, event)
}

// DeleteEvent godoc
// DELETE /api/v1/admin/events/:id  [Requiere auth + rol admin]
// Desactiva un evento (soft-delete lógico: is_active = false).
func (h *EventHandler) DeleteEvent(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "ID de evento inválido.",
		})
	}

	var event models.Event
	h.DB.First(&event, id)

	if result := h.DB.Model(&models.Event{}).Where("id = ?", id).Update("is_active", false); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo eliminar el evento.",
		})
	}

	userID, _ := c.Get("user_id").(uint)
	userName, _ := c.Get("user_name").(string)
	LogActivity(h.DB, userID, userName, "delete", "event", uint(id), event.Title, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Evento eliminado correctamente.",
	})
}

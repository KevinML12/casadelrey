package handlers

import (
	"log"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// CellReportHandler maneja los reportes de células.
type CellReportHandler struct {
	DB *gorm.DB
}

// NewCellReportHandler crea una nueva instancia.
func NewCellReportHandler(db *gorm.DB) *CellReportHandler {
	return &CellReportHandler{DB: db}
}

// CreateCellReport POST /api/v1/cells/report — público, envía reporte de reunión.
func (h *CellReportHandler) CreateCellReport(c echo.Context) error {
	r := new(models.CellReport)
	if err := c.Bind(r); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Datos de entrada inválidos.",
		})
	}

	if r.LeaderName == "" || r.CellName == "" || r.MeetingDate == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Nombre del líder, nombre de la célula y fecha son obligatorios.",
		})
	}

	if result := h.DB.Create(r); result.Error != nil {
		log.Printf("[CellReport] Error al guardar: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo guardar el reporte. Inténtalo de nuevo.",
		})
	}

	log.Printf("[CellReport] Reporte registrado: %s — %s (%s)", r.CellName, r.LeaderName, r.MeetingDate)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message": "¡Reporte enviado! Gracias por tu fidelidad.",
		"id":      r.ID,
	})
}

// GetAllCellReports GET /api/v1/admin/cell-reports — admin, lista todos los reportes.
func (h *CellReportHandler) GetAllCellReports(c echo.Context) error {
	var reports []models.CellReport
	if result := h.DB.Order("created_at DESC").Find(&reports); result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al obtener los reportes.",
		})
	}
	return c.JSON(http.StatusOK, reports)
}

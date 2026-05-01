package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// PDFHandler genera exportaciones descargables en formato CSV/PDF.
type PDFHandler struct {
	DB *gorm.DB
}

func NewPDFHandler(db *gorm.DB) *PDFHandler {
	return &PDFHandler{DB: db}
}

// ExportCellReports GET /api/v1/admin/export/cell-reports — admin.
func (h *PDFHandler) ExportCellReports(c echo.Context) error {
	var reports []models.CellReport
	q := h.DB.Order("meeting_date DESC")
	if status := c.QueryParam("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Find(&reports).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener reportes."})
	}

	c.Response().Header().Set("Content-Type", "text/csv; charset=utf-8")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=cell_reports.csv")
	c.Response().WriteHeader(http.StatusOK)

	w := csv.NewWriter(c.Response().Writer)
	defer w.Flush()

	_ = w.Write([]string{"ID", "Célula", "Tipo", "Fecha", "Líder", "Total Asistentes", "Convertidos", "Reconciliados", "Ofrenda (Q)", "Estado"})
	for _, r := range reports {
		_ = w.Write([]string{
			fmt.Sprintf("%d", r.ID),
			r.CellName,
			r.CellType,
			r.MeetingDate,
			r.LeaderName,
			fmt.Sprintf("%d", r.TotalAttendees),
			fmt.Sprintf("%d", r.Converts),
			fmt.Sprintf("%d", r.Reconciled),
			fmt.Sprintf("%.2f", r.Offering),
			r.Status,
		})
	}
	return nil
}

// ExportDonations GET /api/v1/admin/export/donations — admin.
func (h *PDFHandler) ExportDonations(c echo.Context) error {
	var donations []models.Donation
	if err := h.DB.Where("is_successful = ?", true).Order("created_at DESC").Find(&donations).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener donaciones."})
	}

	c.Response().Header().Set("Content-Type", "text/csv; charset=utf-8")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=donations.csv")
	c.Response().WriteHeader(http.StatusOK)

	w := csv.NewWriter(c.Response().Writer)
	defer w.Flush()

	_ = w.Write([]string{"ID", "Nombre", "Email", "Monto", "Moneda", "Método", "Referencia", "Propósito", "Fecha"})
	for _, d := range donations {
		_ = w.Write([]string{
			fmt.Sprintf("%d", d.ID),
			d.Name,
			d.Email,
			fmt.Sprintf("%.2f", d.Amount),
			d.Currency,
			d.PaymentMethod,
			d.PaymentReference,
			d.DonationPurpose,
			d.CreatedAt.Format("2006-01-02"),
		})
	}
	return nil
}

// ExportBoletas GET /api/v1/admin/export/boletas — admin.
func (h *PDFHandler) ExportBoletas(c echo.Context) error {
	var boletas []models.MemberBoleta
	q := h.DB.Order("date DESC")
	if cat := c.QueryParam("category"); cat != "" {
		q = q.Where("category = ?", cat)
	}
	if err := q.Find(&boletas).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener boletas."})
	}

	c.Response().Header().Set("Content-Type", "text/csv; charset=utf-8")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=boletas.csv")
	c.Response().WriteHeader(http.StatusOK)

	w := csv.NewWriter(c.Response().Writer)
	defer w.Flush()

	_ = w.Write([]string{"ID", "Fecha", "Nombre Invitado", "Teléfono", "Dirección", "Categoría", "Quién invitó", "Teléfono Invitador", "Notas"})
	for _, b := range boletas {
		_ = w.Write([]string{
			fmt.Sprintf("%d", b.ID),
			b.Date,
			b.GuestName,
			b.GuestPhone,
			b.Address,
			b.Category,
			b.InviterName,
			b.InviterPhone,
			b.Notes,
		})
	}
	return nil
}

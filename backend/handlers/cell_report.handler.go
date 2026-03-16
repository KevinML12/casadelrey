package handlers

import (
	"encoding/csv"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

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

// colIndex devuelve el índice de la columna por nombre (flexible: español, inglés, API).
func colIndex(headers []string, names ...string) int {
	lower := func(s string) string { return strings.ToLower(strings.TrimSpace(s)) }
	for i, h := range headers {
		hl := lower(h)
		for _, n := range names {
			if hl == lower(n) {
				return i
			}
		}
	}
	return -1
}

// ImportCellReportsCSV POST /api/v1/admin/cell-reports/import — admin, importa CSV.
// Acepta uno o más archivos CSV. Columnas soportadas:
//   - líder/leader/leader_name
//   - célula/cell/cell_name
//   - fecha/date/meeting_date
//   - asistencia/attendance
//   - visitantes/new_visitors/visitors
//   - notas/notes
func (h *CellReportHandler) ImportCellReportsCSV(c echo.Context) error {
	form, err := c.MultipartForm()
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "No se recibieron archivos."})
	}

	files := form.File["files"]
	if len(files) == 0 {
		files = form.File["file"]
	}
	if len(files) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Sube al menos un archivo CSV."})
	}

	var imported, skipped int
	var errors []string

	for _, fh := range files {
		if !strings.HasSuffix(strings.ToLower(fh.Filename), ".csv") {
			errors = append(errors, fh.Filename+": no es un archivo CSV")
			skipped++
			continue
		}

		file, err := fh.Open()
		if err != nil {
			errors = append(errors, fh.Filename+": "+err.Error())
			continue
		}

		content, err := io.ReadAll(file)
		_ = file.Close()
		if err != nil {
			errors = append(errors, fh.Filename+": "+err.Error())
			continue
		}

		// Detectar separador: ',' o ';' (Excel en español suele usar ;)
		firstLine := strings.SplitN(string(content), "\n", 2)[0]
		comma := rune(',')
		if strings.Count(firstLine, ";") > strings.Count(firstLine, ",") {
			comma = ';'
		}

		reader := csv.NewReader(strings.NewReader(string(content)))
		reader.Comma = comma
		reader.FieldsPerRecord = -1
		reader.TrimLeadingSpace = true

		rows, err := reader.ReadAll()
		if err != nil {
			errors = append(errors, fh.Filename+": error al leer CSV - "+err.Error())
			continue
		}

		if len(rows) < 2 {
			errors = append(errors, fh.Filename+": el CSV debe tener encabezado y al menos una fila de datos")
			continue
		}

		headers := rows[0]
		idxLeader := colIndex(headers, "leader_name", "leader", "líder", "lider")
		idxCell := colIndex(headers, "cell_name", "cell", "célula", "celula")
		idxDate := colIndex(headers, "meeting_date", "date", "fecha")
		idxAtt := colIndex(headers, "attendance", "asistencia")

		if idxLeader < 0 || idxCell < 0 || idxDate < 0 {
			errors = append(errors, fh.Filename+": faltan columnas requeridas (líder, célula, fecha)")
			continue
		}

		idxVisitors := colIndex(headers, "new_visitors", "visitors", "visitantes")
		idxNotes := colIndex(headers, "notes", "notas")

		for i := 1; i < len(rows); i++ {
			row := rows[i]
			if len(row) <= max(idxLeader, idxCell, idxDate) {
				skipped++
				continue
			}

			leader := strings.TrimSpace(row[idxLeader])
			cell := strings.TrimSpace(row[idxCell])
			date := strings.TrimSpace(row[idxDate])
			if leader == "" || cell == "" || date == "" {
				skipped++
				continue
			}

			att := 0
			if idxAtt >= 0 && idxAtt < len(row) {
				att, _ = strconv.Atoi(strings.TrimSpace(row[idxAtt]))
			}
			visitors := 0
			if idxVisitors >= 0 && idxVisitors < len(row) {
				visitors, _ = strconv.Atoi(strings.TrimSpace(row[idxVisitors]))
			}
			notes := ""
			if idxNotes >= 0 && idxNotes < len(row) {
				notes = strings.TrimSpace(row[idxNotes])
			}

			r := models.CellReport{
				LeaderName:  leader,
				CellName:    cell,
				MeetingDate: date,
				Attendance:  att,
				NewVisitors: visitors,
				Notes:       notes,
			}
			if result := h.DB.Create(&r); result.Error != nil {
				errors = append(errors, "fila "+(strconv.Itoa(i+1))+": "+result.Error.Error())
			} else {
				imported++
			}
		}
	}

	log.Printf("[CellReport] Import CSV: %d importados, %d omitidos", imported, skipped)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"imported": imported,
		"skipped":  skipped,
		"errors":   errors,
		"message":  "Importación completada.",
	})
}

func max(a, b, c int) int {
	if a >= b && a >= c {
		return a
	}
	if b >= c {
		return b
	}
	return c
}

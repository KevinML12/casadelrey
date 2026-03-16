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

// normalizar quita acentos, espacios y pasa a minúsculas para matching flexible.
func normalizar(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "_", "")
	s = strings.ReplaceAll(s, "á", "a")
	s = strings.ReplaceAll(s, "é", "e")
	s = strings.ReplaceAll(s, "í", "i")
	s = strings.ReplaceAll(s, "ó", "o")
	s = strings.ReplaceAll(s, "ú", "u")
	return s
}

// colIndex devuelve el índice de la columna por nombre (exacto o contiene).
func colIndex(headers []string, names ...string) int {
	for i, h := range headers {
		hn := normalizar(h)
		for _, n := range names {
			nn := normalizar(n)
			if hn == nn || strings.Contains(hn, nn) || strings.Contains(nn, hn) {
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

		// Detectar separador: ',' ';' o '\t' (según Excel/exportación)
		firstLine := strings.SplitN(string(content), "\n", 2)[0]
		comma := rune(',')
		switch {
		case strings.Count(firstLine, "\t") > strings.Count(firstLine, ";") && strings.Count(firstLine, "\t") > strings.Count(firstLine, ","):
			comma = '\t'
		case strings.Count(firstLine, ";") > strings.Count(firstLine, ","):
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
		// Muchas variaciones: Excel puede exportar con nombres distintos según plantilla/idioma
		idxLeader := colIndex(headers,
			"leader_name", "leader", "líder", "lider", "nombre líder", "nombrelider", "encargado",
			"responsable", "coordinador", "anfitrion", "host", "nombre", "name",
		)
		idxCell := colIndex(headers,
			"cell_name", "cell", "célula", "celula", "grupo", "group", "nombre célula",
			"nombrecelula", "casa", "reunion", "ministerio",
		)
		idxDate := colIndex(headers,
			"meeting_date", "date", "fecha", "fechareunion", "dia", "día", "fechas",
			"meeting date", "fecha de reunion",
		)
		idxAtt := colIndex(headers,
			"attendance", "asistencia", "asistentes", "presentes", "total", "cantidad",
			"numero", "número", "asistieron", "participantes",
		)
		idxVisitors := colIndex(headers,
			"new_visitors", "visitors", "visitantes", "nuevos", "invitados", "nuevos visitantes",
			"first timers", "primera vez",
		)
		idxNotes := colIndex(headers,
			"notes", "notas", "observaciones", "comentarios", "comments", "observacion",
			"nota", "descripcion", "descripción",
		)

		if idxLeader < 0 || idxCell < 0 || idxDate < 0 {
			errors = append(errors, fh.Filename+": faltan columnas (busca: líder/leader, célula/cell, fecha/date). Encontradas: "+strings.Join(headers, ", "))
			continue
		}

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

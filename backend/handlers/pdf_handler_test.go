package handlers_test

import (
	"net/http"
	"strings"
	"testing"
	"time"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── ExportCellReports ────────────────────────────────────────────────────────

func TestExportCellReports_Retorna200ConCSV(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPDFHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "cell_name", "cell_type", "meeting_date",
			"leader_name", "total_attendees", "converts", "reconciled", "offering", "status",
		}).
			AddRow(1, "Célula Norte", "hombres", "2024-01-15", "Carlos", 10, 2, 1, 50.00, "aprobado").
			AddRow(2, "Célula Sur",   "mujeres", "2024-01-20", "Ana",    8, 0, 0, 30.00, "pendiente"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.ExportCellReports(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	assert.Contains(t, body, "Célula Norte")
	assert.Contains(t, body, "Célula Sur")
	assert.Contains(t, body, "Total Asistentes")

	// Debe tener cabecera CSV
	assert.True(t, strings.HasPrefix(body, "ID,Célula"))
}

func TestExportCellReports_ConFiltroStatus_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPDFHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "cell_name", "status"}).
			AddRow(1, "Célula X", "aprobado"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	c.Request().URL.RawQuery = "status=aprobado"
	require.NoError(t, h.ExportCellReports(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "Célula X")
}

// ─── ExportDonations ──────────────────────────────────────────────────────────

func TestExportDonations_Retorna200ConCSV(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPDFHandler(db)

	now := time.Now()
	mock.ExpectQuery(`SELECT .* FROM "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "email", "amount", "currency",
			"payment_method", "payment_reference", "donation_purpose", "created_at",
		}).
			AddRow(1, "Pedro", "p@test.com", 100.50, "GTQ", "transferencia", "REF-001", "Diezmo", now).
			AddRow(2, "María", "m@test.com", 50.00,  "GTQ", "tigo_money",    "REF-002", "Ofrenda", now))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.ExportDonations(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	assert.Contains(t, body, "Pedro")
	assert.Contains(t, body, "María")
	assert.Contains(t, body, "100.50")
	assert.Contains(t, body, "Nombre")
}

func TestExportDonations_SinDatos_RetornaCSVVacio(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPDFHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.ExportDonations(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	// Solo la cabecera
	body := rec.Body.String()
	assert.Contains(t, body, "ID,Nombre")
}

// ─── ExportBoletas ────────────────────────────────────────────────────────────

func TestExportBoletas_Retorna200ConCSV(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPDFHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "date", "guest_name", "guest_phone", "address",
			"category", "inviter_name", "inviter_phone", "notes",
		}).
			AddRow(1, "2024-01-15", "Juan López", "5555-0000", "Zona 1",
				"convertido", "Ana García", "5555-1111", "Primera vez"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.ExportBoletas(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	assert.Contains(t, body, "Juan López")
	assert.Contains(t, body, "convertido")
	assert.Contains(t, body, "Fecha")
}

func TestExportBoletas_ConFiltroCategoria_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPDFHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "guest_name", "category"}).
			AddRow(1, "Luis", "reconciliado"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	c.Request().URL.RawQuery = "category=reconciliado"
	require.NoError(t, h.ExportBoletas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "Luis")
}

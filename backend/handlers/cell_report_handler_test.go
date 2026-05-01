package handlers_test

import (
	"errors"
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// errDB es un error genérico reutilizable para simular fallos de base de datos.
var errDB = errors.New("db error")

// ─── CreateCellReport: validaciones de entrada ───────────────────────────────

func TestCreateCellReport_SinCellName_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"meeting_date": "2024-01-15"},
		userID: 1,
		role:   "leader",
	})
	require.NoError(t, h.CreateCellReport(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "célula")
}

func TestCreateCellReport_SinFecha_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"cell_name": "Célula Norte"},
		userID: 1,
		role:   "leader",
	})
	require.NoError(t, h.CreateCellReport(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateCellReport_DatosCompletos_Retorna201(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(10))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"cell_name":    "Célula Sur",
			"meeting_date": "2024-03-10",
			"leader_name":  "María",
		},
		userID: 5,
		role:   "leader",
	})
	require.NoError(t, h.CreateCellReport(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

// ─── ApproveReport: validaciones de estado ───────────────────────────────────

func TestGetAllCellReports_Leader_SoloVeSuyos_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "cell_name", "leader_id"}).
			AddRow(1, "Célula Test", 9))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "leader", userID: 9})
	require.NoError(t, h.GetAllCellReports(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestGetAllCellReports_ConFiltroStatus_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "cell_name", "status"}).
			AddRow(1, "Célula Norte", "aprobado"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	c.Request().URL.RawQuery = "status=aprobado"
	require.NoError(t, h.GetAllCellReports(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestApproveReport_EstadoInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"status": "pendiente"},
		params: map[string]string{"id": "1"},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.ApproveReport(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestApproveReport_EstadoAprobado_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	// First: buscar el reporte
	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(1, "pendiente"))
	// Save
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "cell_reports"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"status": "aprobado"},
		params: map[string]string{"id": "1"},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.ApproveReport(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

// ─── GetAllCellReports ────────────────────────────────────────────────────────

func TestGetAllCellReports_Admin_VeTodos_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "cell_name", "status"}).
			AddRow(1, "Célula Norte", "pendiente").
			AddRow(2, "Célula Sur", "aprobado"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin", userID: 1})
	require.NoError(t, h.GetAllCellReports(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Len(t, resp["data"].([]interface{}), 2)
}

func TestGetAllCellReports_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).WillReturnError(errDB)

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.GetAllCellReports(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

func TestApproveReport_ReporteNoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewCellReportHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"status": "aprobado"},
		params: map[string]string{"id": "999"},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.ApproveReport(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

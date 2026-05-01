package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── GetLeaderKPIs ────────────────────────────────────────────────────────────

func TestGetLeaderKPIs_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDashboardHandler(db)

	// COUNT total_reports
	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(10))
	// COUNT pending_reports
	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	// COUNT approved_reports
	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(8))
	// COUNT total_boletas
	mock.ExpectQuery(`SELECT count\(\*\) FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(15))
	// COUNT total_volunteers
	mock.ExpectQuery(`SELECT count\(\*\) FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))
	// SUM total_attendees
	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"coalesce"}).AddRow(120))
	// SUM total_converts
	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"coalesce"}).AddRow(5))
	// Últimos 5 reportes
	mock.ExpectQuery(`SELECT .* FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "cell_name"}).
			AddRow(10, "Célula Norte").
			AddRow(9, "Célula Norte"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "leader", userID: 3})
	require.NoError(t, h.GetLeaderKPIs(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Equal(t, float64(10), resp["total_reports"])
	assert.Equal(t, float64(2),  resp["pending_reports"])
}

// ─── GetCellDirectory ─────────────────────────────────────────────────────────

func TestGetCellDirectory_Admin_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDashboardHandler(db)

	// Leaders query
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "cell_code", "cell_type"}).
			AddRow(1, "Carlos", "c@t.com", "H1", "hombres").
			AddRow(2, "Ana",    "a@t.com", "M2", "mujeres"))
	// Member count for each leader (2 calls)
	mock.ExpectQuery(`SELECT count\(\*\) FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))
	mock.ExpectQuery(`SELECT count\(\*\) FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(7))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin", userID: 0})
	require.NoError(t, h.GetCellDirectory(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp []map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Len(t, resp, 2)
}

func TestGetCellDirectory_Leader_SolaPropia_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDashboardHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "cell_code", "cell_type"}).
			AddRow(7, "Pedro", "p@t.com", "J3", "jovenes"))
	mock.ExpectQuery(`SELECT count\(\*\) FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(12))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "leader", userID: 7})
	require.NoError(t, h.GetCellDirectory(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp []map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Len(t, resp, 1)
	assert.Equal(t, float64(12), resp[0]["member_count"])
}

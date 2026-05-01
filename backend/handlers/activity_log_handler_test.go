package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── GetActivityLog ───────────────────────────────────────────────────────────

func TestGetActivityLog_SinFiltros_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewActivityLogHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))
	mock.ExpectQuery(`SELECT .* FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "action", "resource", "user_name"}).
			AddRow(1, "create", "post",  "Admin").
			AddRow(2, "delete", "event", "Admin").
			AddRow(3, "approve", "cell_report", "Admin").
			AddRow(4, "update", "user", "Admin").
			AddRow(5, "create", "boleta", "Leader"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.GetActivityLog(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	data := resp["data"].([]interface{})
	assert.Len(t, data, 5)
	meta := resp["meta"].(map[string]interface{})
	assert.Equal(t, float64(5), meta["total"])
}

func TestGetActivityLog_ConFiltroAction_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewActivityLogHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(`SELECT .* FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "action"}).
			AddRow(1, "delete").
			AddRow(2, "delete"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	c.Request().URL.RawQuery = "action=delete"
	require.NoError(t, h.GetActivityLog(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Equal(t, float64(2), resp["meta"].(map[string]interface{})["total"])
}

func TestGetActivityLog_ConFiltroResource_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewActivityLogHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(`SELECT .* FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "resource"}).AddRow(3, "post"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	c.Request().URL.RawQuery = "resource=post"
	require.NoError(t, h.GetActivityLog(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestGetActivityLog_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewActivityLogHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT .* FROM "activity_logs"`).WillReturnError(errDB)

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.GetActivityLog(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

func TestGetActivityLog_Paginacion_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewActivityLogHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(100))
	mock.ExpectQuery(`SELECT .* FROM "activity_logs"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	c.Request().URL.RawQuery = "page=2&limit=30"
	require.NoError(t, h.GetActivityLog(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	meta := resp["meta"].(map[string]interface{})
	assert.Equal(t, float64(100), meta["total"])
	assert.Equal(t, float64(2), meta["page"])
	assert.Equal(t, float64(30), meta["limit"])
	assert.Equal(t, float64(4), meta["pages"]) // ceil(100/30) = 4
}

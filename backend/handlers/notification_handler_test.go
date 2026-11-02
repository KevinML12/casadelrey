package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetCounts_Admin_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewNotificationHandler(db)

	// Peticiones no respondidas
	mock.ExpectQuery(`SELECT count\(\*\) FROM "petitions"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))
	// Reportes pendientes (admin: sin WHERE leader_id)
	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))
	// Voluntarios pendientes
	mock.ExpectQuery(`SELECT count\(\*\) FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))

	mock.ExpectQuery(`SELECT count\(\*\) FROM "payment_receipts"`).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT count\(\*\) FROM "connect_cards"`).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT count\(\*\) FROM "support_tickets"`).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin", userID: 1})
	require.NoError(t, h.GetCounts(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Equal(t, float64(3), resp["unread_petitions"])
	assert.Equal(t, float64(5), resp["pending_reports"])
	assert.Equal(t, float64(2), resp["pending_volunteers"])
	assert.Equal(t, float64(2), resp["pending_support"])
	assert.Equal(t, float64(12), resp["total"])
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestGetCounts_Leader_SoloPropios_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewNotificationHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "petitions"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(`SELECT count\(\*\) FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	mock.ExpectQuery(`SELECT count\(\*\) FROM "connect_cards"`).WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT count\(\*\) FROM "support_tickets"`).WithArgs(7, "esperando_respuesta").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	c, rec := newCtx(t, ctxOpts{method: "GET", role: "leader", userID: 7})
	require.NoError(t, h.GetCounts(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Equal(t, float64(1), resp["pending_support"])
	assert.Equal(t, float64(2), resp["total"])
	require.NoError(t, mock.ExpectationsWereMet())
}

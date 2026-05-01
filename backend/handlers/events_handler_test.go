package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── GetEvents ────────────────────────────────────────────────────────────────

func TestGetEvents_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "events"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "is_active"}).
			AddRow(1, "Retiro 2024", true).
			AddRow(2, "Culto especial", true))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var events []map[string]interface{}
	decodeBody(t, rec, &events)
	assert.Len(t, events, 2)
}

func TestGetEvents_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "events"`).WillReturnError(errDB)

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetEvents(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── CreateEvent ──────────────────────────────────────────────────────────────

func TestCreateEvent_SinTitulo_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"location": "Auditorio"},
	})
	require.NoError(t, h.CreateEvent(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateEvent_ConTitulo_Retorna201(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "events"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"title":    "Retiro de verano",
			"location": "Centro de retiros",
		},
	})
	require.NoError(t, h.CreateEvent(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

// ─── UpdateEvent ──────────────────────────────────────────────────────────────

func TestUpdateEvent_IDInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo título"},
		params: map[string]string{"id": "no-numero"},
	})
	require.NoError(t, h.UpdateEvent(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestUpdateEvent_NoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "events"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo"},
		params: map[string]string{"id": "999"},
	})
	require.NoError(t, h.UpdateEvent(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestUpdateEvent_OK_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "events"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "is_active"}).
			AddRow(1, "Evento viejo", true))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "events"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Evento actualizado"},
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.UpdateEvent(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

// ─── DeleteEvent ──────────────────────────────────────────────────────────────

func TestDeleteEvent_IDInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "abc"},
	})
	require.NoError(t, h.DeleteEvent(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestDeleteEvent_OK_SoftDelete_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewEventHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "events"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "2"},
	})
	require.NoError(t, h.DeleteEvent(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["message"], "eliminado")
}

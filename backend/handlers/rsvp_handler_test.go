package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── RegisterRSVP ─────────────────────────────────────────────────────────────

func TestRegisterRSVP_EventoNoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewRSVPHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "events"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"name": "Juan", "email": "j@test.com"},
		params: map[string]string{"id": "999"},
	})
	require.NoError(t, h.RegisterRSVP(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestRegisterRSVP_SinNombreOEmail_Retorna400(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewRSVPHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "events"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "is_active"}).AddRow(1, "Culto", true))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"name": ""},
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.RegisterRSVP(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestRegisterRSVP_EmailDuplicado_Retorna409(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewRSVPHandler(db)

	// Evento encontrado
	mock.ExpectQuery(`SELECT .* FROM "events"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "is_active"}).AddRow(1, "Culto", true))
	// Registro existente para ese email
	mock.ExpectQuery(`SELECT .* FROM "event_registrations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "email"}).AddRow(5, "j@test.com"))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"name": "Juan", "email": "j@test.com"},
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.RegisterRSVP(c))
	assert.Equal(t, http.StatusConflict, rec.Code)
}

func TestRegisterRSVP_Completo_Retorna201(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewRSVPHandler(db)

	// Evento activo
	mock.ExpectQuery(`SELECT .* FROM "events"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "is_active"}).AddRow(1, "Culto", true))
	// No hay registro previo
	mock.ExpectQuery(`SELECT .* FROM "event_registrations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))
	// Insert
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "event_registrations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(10))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name":           "María García",
			"email":          "maria@test.com",
			"attendee_count": 2,
		},
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.RegisterRSVP(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

// ─── GetEventRSVPs ────────────────────────────────────────────────────────────

func TestGetEventRSVPs_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewRSVPHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "event_registrations"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(`SELECT .* FROM "event_registrations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email"}).
			AddRow(1, "Juan", "j@test.com").
			AddRow(2, "María", "m@test.com"))
	// total_attendees scan
	mock.ExpectQuery(`SELECT .* FROM "event_registrations"`).
		WillReturnRows(sqlmock.NewRows([]string{"coalesce"}).AddRow(4))

	c, rec := newCtx(t, ctxOpts{
		method: "GET",
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.GetEventRSVPs(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.NotNil(t, resp["data"])
	assert.NotNil(t, resp["total_attendees"])
}

// ─── DeleteRSVP ───────────────────────────────────────────────────────────────

func TestDeleteRSVP_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewRSVPHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "event_registrations"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.DeleteRSVP(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

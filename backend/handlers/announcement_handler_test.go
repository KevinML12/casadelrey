package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── CreateAnnouncement ───────────────────────────────────────────────────────

func TestCreateAnnouncement_SinTitulo_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAnnouncementHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"content": "Contenido sin título"},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.CreateAnnouncement(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateAnnouncement_SinContenido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAnnouncementHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Anuncio sin contenido"},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.CreateAnnouncement(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateAnnouncement_RoleTargetInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAnnouncementHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"title":       "Anuncio",
			"content":     "Contenido",
			"role_target": "invalido",
		},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.CreateAnnouncement(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateAnnouncement_Completo_Retorna201(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAnnouncementHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "announcements"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"title":       "Anuncio de prueba",
			"content":     "Este es el contenido",
			"role_target": "all",
			"publish_now": true,
		},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.CreateAnnouncement(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

// ─── UpdateAnnouncement ───────────────────────────────────────────────────────

func TestUpdateAnnouncement_NoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAnnouncementHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "announcements"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo título"},
		params: map[string]string{"id": "999"},
		role:   "admin",
	})
	require.NoError(t, h.UpdateAnnouncement(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestUpdateAnnouncement_Exito_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAnnouncementHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "announcements"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "content"}).
			AddRow(1, "Título original", "Contenido"))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "announcements"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo título"},
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.UpdateAnnouncement(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

// ─── DeleteAnnouncement ───────────────────────────────────────────────────────

func TestDeleteAnnouncement_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAnnouncementHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "announcements"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.DeleteAnnouncement(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

// ─── GetAllAnnouncements ──────────────────────────────────────────────────────

func TestGetAllAnnouncements_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAnnouncementHandler(db)

	// COUNT query
	mock.ExpectQuery(`SELECT count\(\*\) FROM "announcements"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	// SELECT
	mock.ExpectQuery(`SELECT .* FROM "announcements"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "role_target"}).
			AddRow(1, "Anuncio 1", "all").
			AddRow(2, "Anuncio 2", "leader"))
	// Preload authors (puede ignorarse)
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.GetAllAnnouncements(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.NotNil(t, resp["data"])
	assert.NotNil(t, resp["meta"])
}

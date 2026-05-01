package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── CreatePhoto ─────────────────────────────────────────────────────────────

func TestCreatePhoto_SinURL_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewGalleryHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Foto sin URL"},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.CreatePhoto(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreatePhoto_Completa_Retorna201(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewGalleryHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "gallery_photos"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"url":   "https://example.com/foto.jpg",
			"title": "Foto de bautismo",
		},
		userID: 1,
		role:   "admin",
	})
	require.NoError(t, h.CreatePhoto(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

// ─── GetPhotos ────────────────────────────────────────────────────────────────

func TestGetPhotos_Publico_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewGalleryHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "gallery_photos"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))
	mock.ExpectQuery(`SELECT .* FROM "gallery_photos"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "url", "title"}).
			AddRow(1, "https://a.com/1.jpg", "Foto 1").
			AddRow(2, "https://a.com/2.jpg", "Foto 2").
			AddRow(3, "https://a.com/3.jpg", "Foto 3"))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetPhotos(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.NotNil(t, resp["data"])
}

func TestGetPhotos_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewGalleryHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "gallery_photos"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT .* FROM "gallery_photos"`).WillReturnError(errDB)

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetPhotos(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── UpdatePhoto ──────────────────────────────────────────────────────────────

func TestUpdatePhoto_NoEncontrada_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewGalleryHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "gallery_photos"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo"},
		params: map[string]string{"id": "999"},
		role:   "admin",
	})
	require.NoError(t, h.UpdatePhoto(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

// ─── DeletePhoto ──────────────────────────────────────────────────────────────

func TestDeletePhoto_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewGalleryHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "gallery_photos"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.DeletePhoto(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

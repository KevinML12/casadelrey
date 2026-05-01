package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── CreatePost: validaciones de entrada ─────────────────────────────────────

func TestCreatePost_SinTituloNiSlug_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"content": "algo"},
		userID: 1,
	})
	require.NoError(t, h.CreatePost(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreatePost_SoloTituloSinSlug_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Mi post"},
		userID: 1,
	})
	require.NoError(t, h.CreatePost(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreatePost_StatusInvalido_NormalizaADraft(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	// Slug único check (no encontrado)
	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))
	// INSERT
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()
	// Preload author
	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "slug", "status"}).AddRow(1, "Título", "mi-slug", "draft"))

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"title":  "Título",
			"slug":   "mi-slug",
			"status": "estado_invalido",
		},
		userID: 1,
	})
	require.NoError(t, h.CreatePost(c))
	// No debe ser 400 por status inválido — lo normaliza a draft
	assert.NotEqual(t, http.StatusBadRequest, rec.Code)
}

func TestCreatePost_SinUserID_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	// Slug check — no encontrado
	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"title": "T", "slug": "t"},
		// userID no se inyecta → c.Get("user_id") devolverá nil
	})
	require.NoError(t, h.CreatePost(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── GetPublishedPosts ────────────────────────────────────────────────────────

func TestGetPublishedPosts_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnError(errDB)

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetPublishedPosts(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── DeletePost ───────────────────────────────────────────────────────────────

func TestDeletePost_IDInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "no-es-numero"},
	})
	require.NoError(t, h.DeletePost(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestDeletePost_NoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "999"},
	})
	require.NoError(t, h.DeletePost(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

// ─── UpdatePost ───────────────────────────────────────────────────────────────

func TestUpdatePost_IDInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo"},
		params: map[string]string{"id": "abc"},
	})
	require.NoError(t, h.UpdatePost(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestUpdatePost_NoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo"},
		params: map[string]string{"id": "99"},
	})
	require.NoError(t, h.UpdatePost(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

// ─── GetPostBySlug ────────────────────────────────────────────────────────────

func TestGetPostBySlug_NoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		method: "GET",
		params: map[string]string{"slug": "slug-inexistente"},
	})
	require.NoError(t, h.GetPostBySlug(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

// ─── CreatePost: slug duplicado ───────────────────────────────────────────────

func TestCreatePost_SlugDuplicado_Retorna409(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	// Slug check → encontrado (conflicto)
	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "slug"}).AddRow(1, "mi-slug"))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Post X", "slug": "mi-slug"},
		userID: 1,
	})
	require.NoError(t, h.CreatePost(c))
	assert.Equal(t, http.StatusConflict, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "slug")
}

// ─── GetAllPosts (admin) ──────────────────────────────────────────────────────

func TestGetAllPosts_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "status"}).
			AddRow(1, "Publicado", "published").
			AddRow(2, "Borrador", "draft"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.GetAllPosts(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Len(t, resp["data"].([]interface{}), 2)
}

// ─── DeletePost: camino feliz ─────────────────────────────────────────────────

// ─── UpdatePost: camino feliz ─────────────────────────────────────────────────

func TestUpdatePost_OK_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	// Buscar post
	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "slug", "status"}).
			AddRow(1, "Titulo viejo", "slug-viejo", "draft"))
	// Slug conflict check (mandamos nuevo slug)
	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))
	// Save
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "posts"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	// Preload Author → SELECT posts + SELECT users
	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "slug", "status"}).
			AddRow(1, "Titulo actualizado", "slug-nuevo", "published"))
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name"}).AddRow(1, "Autor"))

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"title":  "Titulo actualizado",
			"slug":   "slug-nuevo",
			"status": "published",
		},
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.UpdatePost(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestDeletePost_OK_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBlogHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title"}).AddRow(1, "Post a borrar"))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "posts"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.DeletePost(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

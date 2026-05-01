package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── CreateSocialPost: validaciones ──────────────────────────────────────────

func TestCreateSocialPost_SinPlatformNiURL_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	c, rec := newCtx(t, ctxOpts{body: map[string]interface{}{"caption": "texto"}})
	require.NoError(t, h.CreateSocialPost(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateSocialPost_SinURL_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	c, rec := newCtx(t, ctxOpts{body: map[string]interface{}{"platform": "facebook"}})
	require.NoError(t, h.CreateSocialPost(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateSocialPost_PlatformInvalida_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"platform": "twitter",
			"post_url": "https://twitter.com/post/1",
		},
	})
	require.NoError(t, h.CreateSocialPost(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "platform")
}

func TestCreateSocialPost_PlatformasValidas_Retorna201(t *testing.T) {
	for _, platform := range []string{"facebook", "instagram"} {
		db, mock, sqlDB := newMockDB(t)
		h := handlers.NewSocialHandler(db)

		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "social_posts"`).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
		mock.ExpectCommit()

		c, rec := newCtx(t, ctxOpts{
			body: map[string]interface{}{
				"platform": platform,
				"post_url": "https://example.com/post/1",
			},
		})
		require.NoError(t, h.CreateSocialPost(c))
		assert.Equal(t, http.StatusCreated, rec.Code, "platform '%s' debe ser aceptada", platform)
		sqlDB.Close()
	}
}

// ─── GetSocialFeed ────────────────────────────────────────────────────────────

func TestGetSocialFeed_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "social_posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "platform", "is_active"}).
			AddRow(1, "facebook", true))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetSocialFeed(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestGetSocialFeed_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "social_posts"`).WillReturnError(errDB)

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetSocialFeed(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── GetAllSocialPosts (admin) ────────────────────────────────────────────────

func TestGetAllSocialPosts_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "social_posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "platform", "is_active"}).
			AddRow(1, "facebook", true).
			AddRow(2, "instagram", false))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.GetAllSocialPosts(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var posts []map[string]interface{}
	decodeBody(t, rec, &posts)
	assert.Len(t, posts, 2)
}

// ─── UpdateSocialPost ─────────────────────────────────────────────────────────

func TestUpdateSocialPost_NoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "social_posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"caption": "nuevo"},
		params: map[string]string{"id": "999"},
	})
	require.NoError(t, h.UpdateSocialPost(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestUpdateSocialPost_OK_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "social_posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "platform", "post_url", "is_active"}).
			AddRow(1, "facebook", "https://fb.com/old", true))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "social_posts"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"post_url": "https://fb.com/new", "caption": "Actualizado"},
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.UpdateSocialPost(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

// ─── DeleteSocialPost ─────────────────────────────────────────────────────────

func TestDeleteSocialPost_NoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	// RowsAffected = 0 → no encontrado
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "social_posts"`).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "999"},
	})
	require.NoError(t, h.DeleteSocialPost(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestDeleteSocialPost_OK_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSocialHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "social_posts"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.DeleteSocialPost(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

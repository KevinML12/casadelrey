package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── GetGoals ─────────────────────────────────────────────────────────────────

func TestGetGoals_SinUserID_Retorna401(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	c, rec := newCtx(t, ctxOpts{method: "GET"}) // sin userID
	require.NoError(t, h.GetGoals(c))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestGetGoals_ConUserID_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "user_goals"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "user_id"}).
			AddRow(1, "Leer la Biblia", 7).
			AddRow(2, "Orar diariamente", 7))

	c, rec := newCtx(t, ctxOpts{method: "GET", userID: 7})
	require.NoError(t, h.GetGoals(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var goals []map[string]interface{}
	decodeBody(t, rec, &goals)
	assert.Len(t, goals, 2)
}

// ─── CreateGoal ───────────────────────────────────────────────────────────────

func TestCreateGoal_SinUserID_Retorna401(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	c, rec := newCtx(t, ctxOpts{body: map[string]interface{}{"title": "Mi meta"}})
	require.NoError(t, h.CreateGoal(c))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestCreateGoal_SinTitulo_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"description": "Sin título"},
		userID: 3,
	})
	require.NoError(t, h.CreateGoal(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateGoal_Completa_Retorna201(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "user_goals"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(10))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"title":       "Leer Proverbios",
			"description": "Un capítulo por día",
			"target_date": "2024-12-31",
		},
		userID: 3,
	})
	require.NoError(t, h.CreateGoal(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

// ─── UpdateGoal ───────────────────────────────────────────────────────────────

func TestUpdateGoal_SinUserID_Retorna401(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo título"},
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.UpdateGoal(c))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestUpdateGoal_MetaNoEncontrada_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	// WHERE id = ? AND user_id = ? → sin filas
	mock.ExpectQuery(`SELECT .* FROM "user_goals"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"title": "Nuevo título"},
		params: map[string]string{"id": "999"},
		userID: 1,
	})
	require.NoError(t, h.UpdateGoal(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

// ─── DeleteGoal ───────────────────────────────────────────────────────────────

func TestUpdateGoal_Exito_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	// WHERE id = ? AND user_id = ?
	mock.ExpectQuery(`SELECT .* FROM "user_goals"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "user_id"}).
			AddRow(1, "Meta original", 3))
	// h.DB.Model(&g).Updates(...)
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "user_goals"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	// Re-fetch tras update
	mock.ExpectQuery(`SELECT .* FROM "user_goals"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "title", "completed"}).
			AddRow(1, "Meta actualizada", true))

	completed := true
	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"title":     "Meta actualizada",
			"completed": completed,
		},
		params: map[string]string{"id": "1"},
		userID: 3,
	})
	require.NoError(t, h.UpdateGoal(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestDeleteGoal_SinUserID_Retorna401(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "1"},
	})
	require.NoError(t, h.DeleteGoal(c))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestDeleteGoal_MetaNoEsDelUsuario_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	// RowsAffected = 0 → meta no pertenece al usuario
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "user_goals"`).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "55"},
		userID: 2,
	})
	require.NoError(t, h.DeleteGoal(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestDeleteGoal_Correcta_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewProfileHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "user_goals"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "1"},
		userID: 2,
	})
	require.NoError(t, h.DeleteGoal(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

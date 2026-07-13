package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── CreatePetition: validaciones ────────────────────────────────────────────

func TestCreatePetition_CamposVacios_Retorna400(t *testing.T) {
	casos := []map[string]interface{}{
		{},
		{"name": "Juan"},
		{"name": "Juan", "subject": "Oración"},
		{"subject": "Oración", "message": "Por favor"},
	}
	for _, body := range casos {
		db, _, sqlDB := newMockDB(t)
		h := handlers.NewPetitionHandler(db)

		c, rec := newCtx(t, ctxOpts{body: body})
		require.NoError(t, h.CreatePetition(c))
		assert.Equal(t, http.StatusBadRequest, rec.Code, "body incompleto %v debe retornar 400", body)
		sqlDB.Close()
	}
}

func TestCreatePetition_Completa_Retorna201(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "petitions"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(5))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name":    "María",
			"subject": "Petición de sanidad",
			"message": "Por favor oren por mi familia.",
		},
	})
	require.NoError(t, h.CreatePetition(c))
	assert.Equal(t, http.StatusCreated, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp, "message")
}

func TestCreatePetition_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "petitions"`).WillReturnError(errDB)
	mock.ExpectRollback()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "Ana", "subject": "Ayuda", "message": "Necesito oración.",
		},
	})
	require.NoError(t, h.CreatePetition(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── MarkAsRead ───────────────────────────────────────────────────────────────

func TestMarkAsRead_IDInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"id": "no-es-numero"},
	})
	require.NoError(t, h.MarkAsRead(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestMarkAsRead_NoEncontrada_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "petitions"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"id": "999"},
	})
	require.NoError(t, h.MarkAsRead(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestMarkAsRead_OK_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "petitions"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "is_answered"}).AddRow(3, false))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "petitions"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"id": "3"},
	})
	require.NoError(t, h.MarkAsRead(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

// ─── GetAllPetitions ──────────────────────────────────────────────────────────

func TestGetAllPetitions_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "petitions"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(`SELECT .* FROM "petitions"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name"}).
			AddRow(1, "Juan").AddRow(2, "Ana"))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetAllPetitions(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Len(t, resp["data"].([]interface{}), 2)
}

// ─── DeletePetition ───────────────────────────────────────────────────────────

func TestDeletePetition_IDInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "abc"},
	})
	require.NoError(t, h.DeletePetition(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestDeletePetition_NoExiste_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	// Soft-delete de GORM = UPDATE petitions SET deleted_at=... → 0 filas
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "petitions"`).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "999"},
	})
	require.NoError(t, h.DeletePetition(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestDeletePetition_OK_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewPetitionHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "petitions"`).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "3"},
	})
	require.NoError(t, h.DeletePetition(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["message"], "eliminada")
}

package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── GetPublic ────────────────────────────────────────────────────────────────

func TestLeadersGetPublic_SoloActivos_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDirectoryHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "leaders"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "phone", "is_active"}).
			AddRow(1, "Cristian de León", "50212345678", true))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetPublic(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var list []map[string]interface{}
	decodeBody(t, rec, &list)
	assert.Len(t, list, 1)
	assert.Equal(t, "Cristian de León", list[0]["name"])
}

// ─── Create ───────────────────────────────────────────────────────────────────

func TestLeadersCreate_SinNombre_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDirectoryHandler(db)

	c, rec := newCtx(t, ctxOpts{
		method: "POST",
		body:   map[string]interface{}{"phone": "50212345678"},
	})
	require.NoError(t, h.Create(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestLeadersCreate_OK_Retorna201(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDirectoryHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "leaders"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "POST",
		body:   map[string]interface{}{"name": "Ana López", "area": "Célula Mujeres", "phone": "50287654321"},
	})
	require.NoError(t, h.Create(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

// ─── Update ───────────────────────────────────────────────────────────────────

func TestLeadersUpdate_NoExiste_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDirectoryHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "leaders"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"id": "99"},
		body:   map[string]interface{}{"name": "X"},
	})
	require.NoError(t, h.Update(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestLeadersUpdate_DesactivarConIsActiveFalse_Funciona(t *testing.T) {
	// El bind con punteros permite mandar is_active=false (un bind directo
	// al modelo lo ignoraría por ser el zero-value de bool).
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDirectoryHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "leaders"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "is_active"}).AddRow(1, "Ana", true))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "leaders"`).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"id": "1"},
		body:   map[string]interface{}{"is_active": false},
	})
	require.NoError(t, h.Update(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Equal(t, false, resp["is_active"])
	assert.Equal(t, "Ana", resp["name"], "los campos no enviados no deben tocarse")
}

// ─── Delete ───────────────────────────────────────────────────────────────────

func TestLeadersDelete_OK_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDirectoryHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "leaders"`).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{method: "DELETE", params: map[string]string{"id": "1"}})
	require.NoError(t, h.Delete(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestLeadersDelete_NoExiste_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewLeaderDirectoryHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "leaders"`).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{method: "DELETE", params: map[string]string{"id": "99"}})
	require.NoError(t, h.Delete(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

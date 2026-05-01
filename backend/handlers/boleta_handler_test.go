package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── CreateBoleta: validaciones de entrada ────────────────────────────────────

func TestCreateBoleta_SinGuestName_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"date": "2024-01-15", "category": "nuevo"},
		userID: 1,
	})
	require.NoError(t, h.CreateBoleta(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateBoleta_SinFecha_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"guest_name": "Ana", "category": "nuevo"},
		userID: 1,
	})
	require.NoError(t, h.CreateBoleta(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateBoleta_CategoriaInvalida_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"guest_name": "Ana", "date": "2024-01-15", "category": "invalida"},
		userID: 1,
	})
	require.NoError(t, h.CreateBoleta(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "Categoría")
}

func TestCreateBoleta_CategoriasValidas_Retorna201(t *testing.T) {
	categorias := []string{"reconciliado", "convertido", "nuevo"}
	for _, cat := range categorias {
		db, mock, sqlDB := newMockDB(t)
		h := handlers.NewBoletaHandler(db)

		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "member_boleta"`).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
		mock.ExpectCommit()

		c, rec := newCtx(t, ctxOpts{
			body: map[string]interface{}{
				"guest_name": "Pedro", "date": "2024-03-10", "category": cat,
			},
			userID: 1,
		})
		require.NoError(t, h.CreateBoleta(c))
		assert.Equal(t, http.StatusCreated, rec.Code, "categoría '%s' debe ser aceptada", cat)
		sqlDB.Close()
	}
}

// ─── GetBoletas ───────────────────────────────────────────────────────────────

func TestGetBoletas_ConFiltroCategoria_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(`SELECT .* FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "guest_name", "category"}).
			AddRow(1, "Pedro", "nuevo"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	c.Request().URL.RawQuery = "category=nuevo"
	require.NoError(t, h.GetBoletas(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Len(t, resp["data"].([]interface{}), 1)
}

func TestGetBoletas_Leader_SoloVeSuyas_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(`SELECT .* FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "guest_name", "leader_id"}).
			AddRow(1, "María", 3))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "leader", userID: 3})
	require.NoError(t, h.GetBoletas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestGetBoletas_Admin_VeTodas_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(`SELECT .* FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "guest_name", "category"}).
			AddRow(1, "Ana", "nuevo").
			AddRow(2, "Luis", "convertido"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin", userID: 1})
	require.NoError(t, h.GetBoletas(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Len(t, resp["data"].([]interface{}), 2)
}

func TestGetBoletas_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT .* FROM "member_boleta"`).WillReturnError(errDB)

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.GetBoletas(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── UpdateBoleta ─────────────────────────────────────────────────────────────

func TestUpdateBoleta_NoEncontrada_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"category": "nuevo"},
		params: map[string]string{"id": "999"},
		role:   "admin",
	})
	require.NoError(t, h.UpdateBoleta(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestUpdateBoleta_CategoriaInvalida_Retorna400(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "member_boleta"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "category"}).AddRow(1, "nuevo"))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"category": "categoria_mala"},
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.UpdateBoleta(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

// ─── DeleteBoleta ─────────────────────────────────────────────────────────────

func TestDeleteBoleta_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewBoletaHandler(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "member_boleta"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "DELETE",
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.DeleteBoleta(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

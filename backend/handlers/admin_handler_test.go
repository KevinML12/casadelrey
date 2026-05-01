package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── UpdateUserRole: validaciones ────────────────────────────────────────────

func TestUpdateUserRole_SinRole_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{},
		params: map[string]string{"id": "5"},
	})
	require.NoError(t, h.UpdateUserRole(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestUpdateUserRole_RoleInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"role": "superusuario"},
		params: map[string]string{"id": "5"},
	})
	require.NoError(t, h.UpdateUserRole(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "Rol")
}

func TestUpdateUserRole_RolesValidos_Retorna200(t *testing.T) {
	validRoles := []string{"member", "leader", "volunteer", "admin"}
	for _, role := range validRoles {
		db, mock, sqlDB := newMockDB(t)
		h := handlers.NewAdminHandler(db)

		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "users"`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		c, rec := newCtx(t, ctxOpts{
			body:   map[string]interface{}{"role": role},
			params: map[string]string{"id": "3"},
		})
		require.NoError(t, h.UpdateUserRole(c))
		assert.Equal(t, http.StatusOK, rec.Code, "rol '%s' debe ser aceptado", role)
		sqlDB.Close()
	}
}

func TestUpdateUserRole_UsuarioNoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	// RowsAffected = 0 → usuario no encontrado
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "users"`).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"role": "member"},
		params: map[string]string{"id": "9999"},
	})
	require.NoError(t, h.UpdateUserRole(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

// ─── GetKPIs ──────────────────────────────────────────────────────────────────

func TestGetKPIs_Retorna200ConCampos(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	// COUNT users
	mock.ExpectQuery(`SELECT count\(\*\) FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(10))
	// COUNT donations (successful)
	mock.ExpectQuery(`SELECT count\(\*\) FROM "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))
	// COUNT petitions
	mock.ExpectQuery(`SELECT count\(\*\) FROM "petitions"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))
	// SUM revenue
	mock.ExpectQuery(`SELECT COALESCE\(SUM\(amount\), 0\) FROM "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(1500.50))
	// SUM blog views
	mock.ExpectQuery(`SELECT COALESCE\(SUM\(view_count\), 0\) FROM "posts"`).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(200))
	// COUNT cell reports
	mock.ExpectQuery(`SELECT count\(\*\) FROM "cell_reports"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(7))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetKPIs(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp, "total_users")
	assert.Contains(t, resp, "total_donations")
	assert.Contains(t, resp, "total_revenue")
	assert.Contains(t, resp, "total_cell_reports")
}

// ─── CreateUser: validaciones ────────────────────────────────────────────────

func TestCreateUser_CamposVacios_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	c, rec := newCtx(t, ctxOpts{body: map[string]interface{}{}})
	require.NoError(t, h.CreateUser(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateUser_PasswordCorta_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "Ana", "email": "ana@test.com", "password": "abc",
		},
		role: "admin",
	})
	require.NoError(t, h.CreateUser(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateUser_RolInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "Ana", "email": "ana@test.com", "password": "segura123", "role": "superadmin",
		},
		role: "admin",
	})
	require.NoError(t, h.CreateUser(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateUser_LiderIntentaCrearAdmin_Retorna403(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "Pedro", "email": "pedro@test.com", "password": "segura123", "role": "admin",
		},
		role: "leader",
	})
	require.NoError(t, h.CreateUser(c))
	assert.Equal(t, http.StatusForbidden, rec.Code)
}

// ─── GetDonations ─────────────────────────────────────────────────────────────

func TestGetDonations_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(`SELECT .* FROM "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "amount", "is_successful"}).
			AddRow(1, "Juan", 100.0, true).
			AddRow(2, "Ana", 50.0, true))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetDonations(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	data := resp["data"].([]interface{})
	assert.Len(t, data, 2)
	assert.Equal(t, float64(2), resp["meta"].(map[string]interface{})["total"])
}

// ─── GetLeaders ───────────────────────────────────────────────────────────────

func TestGetLeaders_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email"}).
			AddRow(1, "Líder A", "a@test.com").
			AddRow(2, "Líder B", "b@test.com"))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetLeaders(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var leaders []map[string]interface{}
	decodeBody(t, rec, &leaders)
	assert.Len(t, leaders, 2)
}

// ─── GetUsers ─────────────────────────────────────────────────────────────────

func TestGetUsers_Retorna200SinPasswords(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewAdminHandler(db)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password", "role"}).
			AddRow(1, "Admin", "admin@test.com", "hashed_pw", "admin").
			AddRow(2, "User", "user@test.com", "hashed_pw2", "member"))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetUsers(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	data := resp["data"].([]interface{})
	require.Len(t, data, 2)
	// El campo password nunca debe aparecer en la respuesta (json:"-" en el modelo)
	for _, item := range data {
		u := item.(map[string]interface{})
		_, hasPassword := u["password"]
		assert.False(t, hasPassword, "password no debe estar presente en la respuesta")
	}
}

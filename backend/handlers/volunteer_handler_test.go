package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── Register: validaciones de entrada ───────────────────────────────────────

func TestVolunteerRegister_SinNombreNiEmail_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"phone": "12345678"},
	})
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestVolunteerRegister_SoloNombreSinEmail_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"name": "Juan"},
	})
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestVolunteerRegister_DepartamentoInvalido_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name":       "Ana",
			"email":      "ana@test.com",
			"department": "departamento_inexistente",
		},
	})
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "Departamento")
}

func TestVolunteerRegister_DepartamentoValido_Pasa(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name":       "Pedro",
			"email":      "pedro@test.com",
			"department": "alabanza",
		},
	})
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

func TestVolunteerRegister_SinDepartamento_Pasa(t *testing.T) {
	// department es opcional; si está vacío, no se valida.
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(2))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"name": "Laura", "email": "laura@test.com"},
	})
	require.NoError(t, h.Register(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

// ─── CreateUserFromVolunteer: validaciones ────────────────────────────────────

// ─── GetAll ────────────────────────────────────────────────────────────────────

// ─── Assign ───────────────────────────────────────────────────────────────────

func TestAssign_VoluntarioNoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"leader_id": 5},
		params: map[string]string{"id": "999"},
		role:   "admin",
	})
	require.NoError(t, h.Assign(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestAssign_LiderNoEncontrado_Retorna400(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name"}).AddRow(1, "Ana"))
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"leader_id": 99},
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.Assign(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestAssign_UsuarioNoEsLider_Retorna400(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name"}).AddRow(1, "Ana"))
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "role"}).AddRow(5, "member"))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"leader_id": 5},
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.Assign(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestAssign_Exito_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "status"}).AddRow(1, "Ana", "pendiente"))
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "role", "name"}).AddRow(5, "leader", "Líder X"))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "volunteers"`).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"leader_id": 5},
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.Assign(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

// ─── GetAll con filtros por query param ───────────────────────────────────────

func TestGetAll_ConFiltroDepartamento_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "department"}).
			AddRow(1, "Pedro", "alabanza"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	c.Request().URL.RawQuery = "department=alabanza"
	require.NoError(t, h.GetAll(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestGetAll_Leader_SoloVeSuyos_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	// Con role=leader y userID=7, la query lleva WHERE assigned_leader_id = 7
	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "assigned_leader_id"}).
			AddRow(1, "Ana", 7))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "leader", userID: 7})
	require.NoError(t, h.GetAll(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var list []map[string]interface{}
	decodeBody(t, rec, &list)
	assert.Len(t, list, 1)
}

// ─── CreateUserFromVolunteer: email duplicado ──────────────────────────────────

func TestCreateUserFromVolunteer_EmailYaExiste_Retorna409(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email"}).AddRow(1, "Ana", "ana@test.com"))
	// Email ya existe en users
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "email"}).AddRow(5, "ana@test.com"))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"password": "segura123"},
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.CreateUserFromVolunteer(c))
	assert.Equal(t, http.StatusConflict, rec.Code)
}

func TestGetAll_Admin_VeTodos_Retorna200(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "department", "status"}).
			AddRow(1, "Ana", "alabanza", "pendiente").
			AddRow(2, "Luis", "danza", "asignado"))

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin", userID: 1})
	require.NoError(t, h.GetAll(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var list []map[string]interface{}
	decodeBody(t, rec, &list)
	assert.Len(t, list, 2)
}

func TestGetAll_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).WillReturnError(errDB)

	c, rec := newCtx(t, ctxOpts{method: "GET", role: "admin"})
	require.NoError(t, h.GetAll(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

func TestCreateUserFromVolunteer_PasswordCorta_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"password": "abc"},
		params: map[string]string{"id": "1"},
		role:   "admin",
	})
	require.NoError(t, h.CreateUserFromVolunteer(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "6")
}

func TestCreateUserFromVolunteer_VoluntarioNoEncontrado_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "volunteers"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body:   map[string]interface{}{"password": "segura123"},
		params: map[string]string{"id": "999"},
		role:   "admin",
	})
	require.NoError(t, h.CreateUserFromVolunteer(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

// ─── GetDepartments ───────────────────────────────────────────────────────────

func TestGetDepartments_Retorna200ConLista(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewVolunteerHandler(db)

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetDepartments(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	depts, ok := resp["departments"].([]interface{})
	assert.True(t, ok, "debe contener 'departments'")
	assert.Greater(t, len(depts), 0, "debe haber al menos un departamento")
}

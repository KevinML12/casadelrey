package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// GetPublic devuelve el valor guardado; si no hay, el default de la
// llave. bank_account por defecto es "" (nunca un número inventado).
func TestSiteSettings_GetPublic_UsaDefaultsYGuardados(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSiteSettingHandler(db)

	// El admin ya puso el banco, pero no la cuenta.
	mock.ExpectQuery(`SELECT .* FROM "site_settings"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "key", "value"}).
			AddRow(1, "bank_name", "Banco Industrial"))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetPublic(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var out map[string]string
	decodeBody(t, rec, &out)
	assert.Equal(t, "Banco Industrial", out["bank_name"], "usa el valor guardado")
	assert.Equal(t, "", out["bank_account"], "sin cuenta puesta → vacío, nunca un número falso")
	assert.Equal(t, "Iglesia Casa del Rey", out["bank_holder"], "default cuando no hay guardado")
}

func TestSiteSettings_Update_LlaveDesconocida_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSiteSettingHandler(db)

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"key": "llave_inventada"},
		body:   map[string]interface{}{"value": "x"},
	})
	require.NoError(t, h.UpdateSetting(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestSiteSettings_Update_CreaCuandoNoExiste(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSiteSettingHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "site_settings"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"})) // no existe
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "site_settings"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"key": "bank_account"},
		body:   map[string]interface{}{"value": "1234567890"},
	})
	require.NoError(t, h.UpdateSetting(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

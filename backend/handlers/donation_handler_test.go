package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── RegisterDonation: validaciones de entrada ───────────────────────────────

func TestRegisterDonation_MontoMenorAMinimo_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "Juan", "amount": 5.0, "payment_method": "presencial",
		},
	})
	require.NoError(t, h.RegisterDonation(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "mínimo")
}

func TestRegisterDonation_MontoExactoMinimo_NoPasa400(t *testing.T) {
	// Monto = 10 (el límite) sí debería pasar la validación, pero fallará en DB (esperado).
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "María", "amount": 10.0, "payment_method": "presencial",
		},
	})
	require.NoError(t, h.RegisterDonation(c))
	// Solo verificamos que no retorna 400 por validación de monto.
	assert.NotEqual(t, http.StatusBadRequest, rec.Code)
}

func TestRegisterDonation_SinNombre_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"amount": 100.0, "payment_method": "transferencia"},
	})
	require.NoError(t, h.RegisterDonation(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "nombre")
}

func TestRegisterDonation_MetodoPagoInvalido_NormalizaAPresencial(t *testing.T) {
	// Un método inválido no debe retornar 400; el handler lo normaliza a "presencial".
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(2))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "Carlos", "amount": 50.0, "payment_method": "tarjeta_invalida",
		},
	})
	require.NoError(t, h.RegisterDonation(c))
	assert.NotEqual(t, http.StatusBadRequest, rec.Code, "método inválido debe normalizarse, no rechazarse")
}

func TestRegisterDonation_MetodoPagoVacio_NormalizaAPresencial(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(3))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"name": "Luis", "amount": 25.0},
	})
	require.NoError(t, h.RegisterDonation(c))
	assert.NotEqual(t, http.StatusBadRequest, rec.Code)
}

func TestRegisterDonation_CuerpoInvalido_Retorna400(t *testing.T) {
	// El handler debe responder 400 ante JSON malformado.
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	// amount como string en lugar de número.
	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"name": "Test", "amount": "cien"},
	})
	require.NoError(t, h.RegisterDonation(c))
	// Puede ser 400 (bind) o 400 (validación de monto 0 < 10).
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestRegisterDonation_MetodosValidos_SeGuardan(t *testing.T) {
	// tigo_money ya NO es válido (removido 13 jul 2026) — cae al default
	// "presencial", igual se guarda. Solo transferencia y presencial son
	// métodos de primera clase.
	metodos := []string{"transferencia", "presencial"}
	for _, metodo := range metodos {
		db, mock, sqlDB := newMockDB(t)
		h := handlers.NewDonationHandler(db)

		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "donations"`).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
		mock.ExpectCommit()

		c, rec := newCtx(t, ctxOpts{
			body: map[string]interface{}{
				"name": "Donante", "amount": 100.0, "payment_method": metodo,
			},
		})
		require.NoError(t, h.RegisterDonation(c))
		assert.Equal(t, http.StatusCreated, rec.Code, "método '%s' debe aceptarse", metodo)
		sqlDB.Close()
	}
}

func TestRegisterDonation_CurrencyCustom_SeRespeta(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "donations"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "Ana", "amount": 50.0, "payment_method": "transferencia", "currency": "USD",
		},
	})
	require.NoError(t, h.RegisterDonation(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
}

func TestRegisterDonation_ErrorDB_Retorna500(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "donations"`).WillReturnError(errDB)
	mock.ExpectRollback()

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{
			"name": "Carlos", "amount": 30.0, "payment_method": "presencial",
		},
	})
	require.NoError(t, h.RegisterDonation(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

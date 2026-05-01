package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── CreatePayPalOrder: validaciones ─────────────────────────────────────────

func TestCreatePayPalOrder_MontoMenorAMinimo_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"amount": 5.0, "name": "Juan"},
	})
	require.NoError(t, h.CreatePayPalOrder(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreatePayPalOrder_MontoCero_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"amount": 0.0, "name": "Juan"},
	})
	require.NoError(t, h.CreatePayPalOrder(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreatePayPalOrder_SinNombre_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"amount": 100.0, "name": ""},
	})
	require.NoError(t, h.CreatePayPalOrder(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "nombre")
}

func TestCreatePayPalOrder_SinCredencialesPayPal_Retorna500(t *testing.T) {
	// Sin PAYPAL_CLIENT_ID/SECRET configurados, paypalAccessToken falla → 500.
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	// Asegurar que las vars de entorno no estén seteadas en este proceso de test.
	t.Setenv("PAYPAL_CLIENT_ID", "")
	t.Setenv("PAYPAL_CLIENT_SECRET", "")

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"amount": 100.0, "name": "María"},
	})
	require.NoError(t, h.CreatePayPalOrder(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ─── CapturePayPalOrder: validaciones ────────────────────────────────────────

func TestCapturePayPalOrder_SinOrderID_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"order_id": ""},
	})
	require.NoError(t, h.CapturePayPalOrder(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCapturePayPalOrder_CuerpoVacio_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{body: map[string]interface{}{}})
	require.NoError(t, h.CapturePayPalOrder(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCapturePayPalOrder_OrdenNoEncontrada_Retorna404(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "paypal_orders"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"order_id": "ORDEN-INEXISTENTE-123"},
	})
	require.NoError(t, h.CapturePayPalOrder(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

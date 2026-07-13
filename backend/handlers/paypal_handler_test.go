package handlers_test

// PayPal fue REMOVIDO en mayo 2026 (ver handlers/paypal.go): ambos
// endpoints devuelven 410 Gone incondicionalmente. Los tests anteriores
// validaban montos/nombres/credenciales de un flujo que ya no existe.
// Estos verifican el contrato actual: siempre 410 con mensaje que apunta
// a los métodos vigentes (transferencia / Tigo Money).

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreatePayPalOrder_Removido_Retorna410(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"amount": 100.0, "name": "Juan"},
	})
	require.NoError(t, h.CreatePayPalOrder(c))
	assert.Equal(t, http.StatusGone, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "PayPal")
}

func TestCapturePayPalOrder_Removido_Retorna410(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewDonationHandler(db)

	c, rec := newCtx(t, ctxOpts{
		body: map[string]interface{}{"order_id": "cualquiera"},
	})
	require.NoError(t, h.CapturePayPalOrder(c))
	assert.Equal(t, http.StatusGone, rec.Code)
}

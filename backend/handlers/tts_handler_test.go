package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── Health ───────────────────────────────────────────────────────────────────

func TestTTSHealth_Retorna200(t *testing.T) {
	h := handlers.NewTTSHandler()
	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.Health(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Equal(t, "ok", resp["status"])
	assert.Equal(t, "available", resp["tts"])
}

// ─── Synthesize: validaciones de entrada ─────────────────────────────────────

func TestTTSSynthesize_TextoVacio_Retorna400(t *testing.T) {
	h := handlers.NewTTSHandler()
	c, rec := newCtx(t, ctxOpts{body: map[string]interface{}{"text": ""}})
	require.NoError(t, h.Synthesize(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "text")
}

func TestTTSSynthesize_SoloEspacios_Retorna400(t *testing.T) {
	h := handlers.NewTTSHandler()
	c, rec := newCtx(t, ctxOpts{body: map[string]interface{}{"text": "   "}})
	require.NoError(t, h.Synthesize(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestTTSSynthesize_SinCampoText_Retorna400(t *testing.T) {
	h := handlers.NewTTSHandler()
	c, rec := newCtx(t, ctxOpts{body: map[string]interface{}{"otro": "valor"}})
	require.NoError(t, h.Synthesize(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

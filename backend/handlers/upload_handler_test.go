package handlers_test

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── UploadFile ───────────────────────────────────────────────────────────────

func TestUploadFile_SinArchivo_Retorna400(t *testing.T) {
	h := &handlers.UploadHandler{UploadDir: t.TempDir()}
	// Petición sin campo "file" en el form-data.
	c, rec := newCtx(t, ctxOpts{method: "POST"})
	require.NoError(t, h.UploadFile(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "archivo")
}

func TestUploadFile_ConArchivo_Retorna201(t *testing.T) {
	tmpDir := t.TempDir()
	h := &handlers.UploadHandler{UploadDir: tmpDir}

	// Construir un request multipart/form-data con campo "file".
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile("file", "test.txt")
	require.NoError(t, err)
	_, err = fw.Write([]byte("contenido de prueba"))
	require.NoError(t, err)
	w.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	require.NoError(t, h.UploadFile(c))
	assert.Equal(t, http.StatusCreated, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp, "url")
	assert.Contains(t, resp, "filename")
	assert.Equal(t, "test.txt", resp["original"])
}

func TestUploadFile_NombreConCaracteresEspeciales_UrlLimpia(t *testing.T) {
	tmpDir := t.TempDir()
	h := &handlers.UploadHandler{UploadDir: tmpDir}

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile("file", "../../../evil file<>.txt")
	require.NoError(t, err)
	_, err = fw.Write([]byte("data"))
	require.NoError(t, err)
	w.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	require.NoError(t, h.UploadFile(c))
	assert.Equal(t, http.StatusCreated, rec.Code)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	filename, _ := resp["filename"].(string)
	assert.NotContains(t, filename, "..")
	assert.NotContains(t, filename, "/")
	assert.NotContains(t, filename, "<")
	assert.NotContains(t, filename, ">")
}

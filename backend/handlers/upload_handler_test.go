package handlers_test

// Tests de UploadFile contra la interfaz storage.Store actual (con un
// fake en memoria). La versión anterior construía el handler con un
// campo UploadDir (guardado local en disco) que ya no existe — el
// upload ahora pasa por storage.Store (R2 o disco) — y por eso rompía
// la compilación de `go test ./...`.

import (
	"bytes"
	"context"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"casadelrey/backend/handlers"
	"casadelrey/backend/storage"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// fakeStore implementa storage.Store en memoria y registra qué se subió.
type fakeStore struct {
	lastFolder   string
	lastFilename string
	uploads      int
}

func (f *fakeStore) Upload(_ context.Context, folder, filename string, _ io.Reader, _ int64, _ string) (string, error) {
	f.lastFolder, f.lastFilename = folder, filename
	f.uploads++
	return "https://cdn.test/" + folder + "/" + filename, nil
}
func (f *fakeStore) Delete(_ context.Context, _ string) error { return nil }
func (f *fakeStore) ActiveBackend() storage.Backend           { return storage.Backend("fake") }

// multipartReq arma un request multipart/form-data con un campo "file".
func multipartReq(t *testing.T, path, filename, content string) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile("file", filename)
	require.NoError(t, err)
	_, err = fw.Write([]byte(content))
	require.NoError(t, err)
	w.Close()

	req := httptest.NewRequest(http.MethodPost, path, &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	return req
}

func TestUploadFile_SinArchivo_Retorna400(t *testing.T) {
	h := handlers.NewUploadHandler(&fakeStore{})
	c, rec := newCtx(t, ctxOpts{method: "POST"})
	require.NoError(t, h.UploadFile(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp map[string]string
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp["error"], "archivo")
}

func TestUploadFile_ConImagen_Retorna201(t *testing.T) {
	store := &fakeStore{}
	h := handlers.NewUploadHandler(store)

	e := echo.New()
	req := multipartReq(t, "/", "foto.png", "contenido de prueba")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	require.NoError(t, h.UploadFile(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, 1, store.uploads)

	var resp map[string]interface{}
	decodeBody(t, rec, &resp)
	assert.Contains(t, resp, "url")
	assert.Contains(t, resp, "filename")
	assert.Equal(t, "general", resp["folder"]) // sin ?folder → "general"
	assert.Equal(t, "fake", resp["backend"])
}

func TestUploadFile_FolderQueryParam_SeRespeta(t *testing.T) {
	store := &fakeStore{}
	h := handlers.NewUploadHandler(store)

	e := echo.New()
	req := multipartReq(t, "/?folder=galeria", "foto.jpg", "data")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	require.NoError(t, h.UploadFile(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, "galeria", store.lastFolder)
}

func TestUploadFile_TipoNoPermitido_Retorna400(t *testing.T) {
	store := &fakeStore{}
	h := handlers.NewUploadHandler(store)

	e := echo.New()
	req := multipartReq(t, "/", "script.exe", "MZ...")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	require.NoError(t, h.UploadFile(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Equal(t, 0, store.uploads, "un tipo no permitido nunca debe llegar al store")
}

func TestUploadFile_NombreMalicioso_SeSanitiza(t *testing.T) {
	store := &fakeStore{}
	h := handlers.NewUploadHandler(store)

	e := echo.New()
	req := multipartReq(t, "/", "../../evil file<>.png", "data")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	require.NoError(t, h.UploadFile(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
	// El nombre que llega al store no debe conservar path traversal ni
	// caracteres peligrosos (los limpia storage.UniqueFilename/sanitize).
	assert.NotContains(t, store.lastFilename, "..")
	assert.NotContains(t, store.lastFilename, "/")
	assert.NotContains(t, store.lastFilename, "<")
	assert.False(t, strings.Contains(store.lastFilename, " "), "espacios deben volverse _")
}

package handlers

import (
	"net/http"

	"casadelrey/backend/storage"

	"github.com/labstack/echo/v4"
)

// UploadHandler maneja la subida de archivos.
// Delega al Store (R2 o local) — intercambiable sin tocar este código.
type UploadHandler struct {
	store storage.Store
}

// NewUploadHandler crea el handler con el Store ya inicializado.
func NewUploadHandler(store storage.Store) *UploadHandler {
	return &UploadHandler{store: store}
}

// UploadFile POST /api/v1/upload
// Acepta multipart/form-data con campo "file".
// Query param opcional: ?folder=celulas|galeria|comprobantes|blog
// Retorna la URL pública del archivo.
func (h *UploadHandler) UploadFile(c echo.Context) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "No se encontró el archivo. Usa el campo 'file' en el form-data.",
		})
	}

	// Validar tamaño máximo: 10 MB
	const maxSize = 10 << 20
	if file.Size > maxSize {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "El archivo supera el límite de 10 MB.",
		})
	}

	// Validar tipo de archivo
	if !isAllowedType(file.Filename) {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Tipo de archivo no permitido. Solo imágenes (jpg, png, webp, gif) y PDF.",
		})
	}

	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo leer el archivo.",
		})
	}
	defer src.Close()

	// Carpeta según el contexto (query param ?folder=celulas)
	folder := c.QueryParam("folder")
	if folder == "" {
		folder = "general"
	}

	uniqueName := storage.UniqueFilename(file.Filename)
	contentType := storage.DetectContentType(file.Filename, nil)

	url, err := h.store.Upload(c.Request().Context(), folder, uniqueName, src, file.Size, contentType)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al guardar el archivo.",
		})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"url":      url,
		"filename": uniqueName,
		"folder":   folder,
		"size":     file.Size,
		"backend":  string(h.store.ActiveBackend()),
	})
}

// isAllowedType valida que el archivo sea imagen o PDF.
func isAllowedType(filename string) bool {
	allowed := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true,
		".webp": true, ".gif": true, ".pdf": true,
	}
	ext := ""
	for i := len(filename) - 1; i >= 0; i-- {
		if filename[i] == '.' {
			ext = filename[i:]
			break
		}
	}
	return allowed[ext]
}

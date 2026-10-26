package handlers

import (
	"bytes"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"casadelrey/backend/storage"
	"github.com/google/uuid"

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

// Carpetas permitidas para el upload autenticado (paneles admin/líder).
// El folder venía crudo del query param: un usuario podía escribir a
// cualquier carpeta ("hero", "comprobantes"…). Ahora se valida contra
// esta lista; lo desconocido cae a "general".
var allowedFolders = map[string]bool{
	"general": true, "blog": true, "galeria": true, "eventos": true,
	"celulas": true, "lideres": true, "hero": true, "site-photos": true,
	"comprobantes": true,
}

// saveUpload valida y guarda el archivo del form-data en `folder`.
func (h *UploadHandler) saveUpload(c echo.Context, folder string) error {
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

	data, err := io.ReadAll(io.LimitReader(src, maxSize+1))
	if err != nil || len(data) == 0 || len(data) > maxSize {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Archivo vacío, ilegible o demasiado grande."})
	}
	contentType := http.DetectContentType(data)
	expected := storage.DetectContentType(file.Filename, nil)
	if contentType != expected {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "El contenido no coincide con el tipo de archivo."})
	}
	if contentType == "image/jpeg" || contentType == "image/png" || contentType == "image/gif" {
		cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
		if err != nil || cfg.Width < 1 || cfg.Height < 1 || int64(cfg.Width)*int64(cfg.Height) > 40000000 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Imagen inválida o con dimensiones excesivas."})
		}
	}
	uniqueName := storage.UniqueFilename(file.Filename)

	var url string
	if folder == "comprobantes" {
		private, ok := h.store.(storage.ReceiptStore)
		if !ok {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "El almacenamiento privado no está disponible."})
		}
		uniqueName = uuid.NewString() + strings.ToLower(filepath.Ext(file.Filename))
		url, err = private.UploadReceipt(c.Request().Context(), uniqueName, bytes.NewReader(data), int64(len(data)), contentType)
	} else {
		url, err = h.store.Upload(c.Request().Context(), folder, uniqueName, bytes.NewReader(data), int64(len(data)), contentType)
	}
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

// UploadFile POST /api/v1/upload  [requiere auth]
// Acepta multipart/form-data con campo "file". Query param opcional
// ?folder= debe estar en la lista blanca; si no, va a "general".
func (h *UploadHandler) UploadFile(c echo.Context) error {
	folder := c.QueryParam("folder")
	if !allowedFolders[folder] {
		folder = "general"
	}
	return h.saveUpload(c, folder)
}

// UploadReceipt POST /api/v1/receipts/upload  [PÚBLICO]
// Un visitante anónimo que dona por transferencia o sube el comprobante
// de un evento necesita subir su boleta SIN cuenta. Carpeta fija
// "comprobantes" (no la controla el cliente); rate-limit en la ruta.
func (h *UploadHandler) UploadReceipt(c echo.Context) error {
	return h.saveUpload(c, "comprobantes")
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

// UploadVolunteerPhoto fixes the destination and only accepts report images.
func (h *UploadHandler) UploadVolunteerPhoto(c echo.Context) error {
	file, err := c.FormFile("file")
	if err != nil || !isAllowedType(file.Filename) || strings.EqualFold(filepath.Ext(file.Filename), ".pdf") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Sube una imagen válida del reporte."})
	}
	return h.saveUpload(c, "reportes-voluntarios")
}

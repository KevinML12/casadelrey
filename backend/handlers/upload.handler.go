package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// UploadHandler maneja la subida de archivos al servidor.
// Por ahora guarda en el sistema de archivos local (/uploads).
// TODO: conectar a S3 o Dokploy Volumes en producción.
type UploadHandler struct {
	// UploadDir es la ruta absoluta del directorio donde se almacenan los archivos.
	UploadDir string
}

// NewUploadHandler crea una nueva instancia del handler de uploads.
// Crea el directorio /uploads si no existe al arrancar el servidor.
func NewUploadHandler() *UploadHandler {
	uploadDir := "./uploads"

	// Crear directorio de uploads con permisos 0755 si no existe
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		// Error al crear el directorio es fatal; el servidor no puede recibir archivos
		panic(fmt.Sprintf("[Upload] No se pudo crear el directorio '%s': %v", uploadDir, err))
	}

	return &UploadHandler{UploadDir: uploadDir}
}

// UploadFile godoc
// POST /api/upload
// Acepta un archivo via multipart/form-data (campo: "file").
// Guarda el archivo en ./uploads/ con un nombre único basado en timestamp.
// Retorna la URL relativa del archivo para usarla en el frontend.
//
// Límite de tamaño: controlado por echo.New() con e.Server.MaxHeaderBytes.
// Recomendación: agregar e.Use(middleware.BodyLimit("10M")) en main.go si es necesario.
func (h *UploadHandler) UploadFile(c echo.Context) error {
	// 1. Obtener el archivo del campo "file" del form-data
	file, err := c.FormFile("file")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "No se encontró el archivo. Usa el campo 'file' en el form-data.",
		})
	}

	// 2. Abrir el stream del archivo subido
	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo leer el archivo subido.",
		})
	}
	defer src.Close()

	// 3. Generar un nombre único para evitar colisiones entre archivos
	ext := filepath.Ext(file.Filename)
	baseName := strings.TrimSuffix(file.Filename, ext)
	uniqueName := fmt.Sprintf("%d_%s%s",
		time.Now().UnixNano(),
		sanitizeFilename(baseName),
		strings.ToLower(ext),
	)
	destPath := filepath.Join(h.UploadDir, uniqueName)

	// 4. Crear el archivo de destino en el servidor
	dst, err := os.Create(destPath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "No se pudo crear el archivo en el servidor.",
		})
	}
	defer dst.Close()

	// 5. Copiar los bytes del archivo subido al destino
	if _, err := io.Copy(dst, src); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error al escribir el archivo en el servidor.",
		})
	}

	// 6. Responder con los metadatos del archivo guardado
	return c.JSON(http.StatusCreated, map[string]interface{}{
		"message":  "Archivo subido exitosamente.",
		"filename": uniqueName,
		"url":      fmt.Sprintf("/uploads/%s", uniqueName), // URL relativa al servidor
		"size":     file.Size,                               // Tamaño en bytes
		"original": file.Filename,                           // Nombre original del archivo
	})
}

// sanitizeFilename elimina caracteres peligrosos de un nombre de archivo
// para prevenir path traversal y otros ataques relacionados con el filesystem.
func sanitizeFilename(name string) string {
	replacer := strings.NewReplacer(
		" ", "_",
		"/", "",
		"\\", "",
		"..", "",
		"<", "",
		">", "",
		":", "",
		"\"", "",
		"|", "",
		"?", "",
		"*", "",
	)
	return replacer.Replace(name)
}

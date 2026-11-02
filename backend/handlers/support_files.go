package handlers

import (
	"bytes"
	"casadelrey/backend/models"
	"casadelrey/backend/storage"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"image"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

func (h *SupportHandler) Upload(c echo.Context) error {
	// Authorization precedes multipart parsing and any storage access.
	ticket, err := supportTicket(h.DB, c, c.Param("id"), false)
	if err != nil {
		return supportError(c, err)
	}
	if h.Store == nil {
		return c.JSON(503, map[string]string{"error": "Las capturas privadas no están disponibles. El caso puede continuar por texto."})
	}
	key, err := supportSubmission(c, "file:"+c.Param("id"))
	if err != nil {
		return supportError(c, err)
	}
	file, err := c.FormFile("file")
	if err != nil {
		return c.JSON(400, map[string]string{"error": "Selecciona una captura PNG o JPG."})
	}
	if form := c.Request().MultipartForm; form != nil {
		defer form.RemoveAll()
	}
	if file.Size > 5<<20 {
		return c.JSON(400, map[string]string{"error": "Cada captura admite hasta 5 MB."})
	}
	name := filepath.Base(strings.ReplaceAll(file.Filename, "\\", "/"))
	if utf8.RuneCountInString(name) > 120 || len(name) == 0 {
		return c.JSON(400, map[string]string{"error": "El nombre del archivo admite hasta 120 caracteres."})
	}
	src, err := file.Open()
	if err != nil {
		return supportError(c, err)
	}
	defer src.Close()
	data, err := io.ReadAll(io.LimitReader(src, (5<<20)+1))
	if err != nil || len(data) == 0 || len(data) > 5<<20 {
		return c.JSON(400, map[string]string{"error": "No se pudo leer la captura o supera 5 MB."})
	}
	mime := http.DetectContentType(data)
	ext := strings.ToLower(filepath.Ext(name))
	if !((mime == "image/png" && ext == ".png") || (mime == "image/jpeg" && (ext == ".jpg" || ext == ".jpeg"))) {
		return c.JSON(400, map[string]string{"error": "Selecciona una captura PNG o JPG válida."})
	}
	dimensions, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || dimensions.Width < 1 || dimensions.Height < 1 || int64(dimensions.Width)*int64(dimensions.Height) > 20000000 {
		return c.JSON(400, map[string]string{"error": "La captura no es válida o tiene dimensiones excesivas."})
	}
	hash := supportHash(string(data))
	id, author, _ := supportActor(c)
	var row models.SupportAttachment
	replayed := false
	lease := time.Now().Add(2 * time.Minute)
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		current, err := supportTicket(tx, c, c.Param("id"), true)
		if err != nil {
			return err
		}
		if current.Status == "resuelto" {
			return echo.NewHTTPError(409, "Reabre el caso antes de agregar capturas.")
		}
		if err := supportLock(tx, fmt.Sprintf("support-owner:%d", id)); err != nil {
			return err
		}
		found := tx.Where("submission_key = ?", key).First(&row).Error
		if found == nil {
			if row.ContentHash != hash || row.Name != name {
				return echo.NewHTTPError(409, "Esta carga ya se utilizó con otro archivo.")
			}
			if row.Status == "ready" {
				replayed = true
				return nil
			}
			if row.Status == "uploading" && row.LeaseUntil.After(time.Now()) {
				return echo.NewHTTPError(409, "La captura sigue procesándose. Actualiza el caso antes de reintentar.")
			}
			row.Status = "uploading"
			row.LeaseUntil = lease
			return tx.Save(&row).Error
		}
		if !errors.Is(found, gorm.ErrRecordNotFound) {
			return found
		}
		var count int64
		var quota int64
		if err := tx.Model(&models.SupportAttachment{}).Where("ticket_id = ?", ticket.ID).Count(&count).Error; err != nil {
			return err
		}
		if count >= 12 {
			return echo.NewHTTPError(409, "El caso ya tiene el máximo de 12 capturas.")
		}
		if err := tx.Model(&models.SupportAttachment{}).Where("author_id = ? AND created_at > ?", id, time.Now().Add(-24*time.Hour)).Select("COALESCE(SUM(size),0)").Scan(&quota).Error; err != nil {
			return err
		}
		if quota+int64(len(data)) > 32<<20 {
			return echo.NewHTTPError(429, "Se alcanzó el límite diario de capturas. Puedes continuar por texto.")
		}
		row = models.SupportAttachment{TicketID: ticket.ID, AuthorID: id, AuthorName: author, Name: name, ContentType: mime, Size: int64(len(data)), Status: "uploading", ObjectReference: storage.SupportReference(uuid.NewString() + ext), SubmissionKey: key, ContentHash: hash, LeaseUntil: lease}
		return tx.Create(&row).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	if replayed {
		return c.JSON(200, row)
	}
	ref, err := h.Store.UploadSupport(c.Request().Context(), strings.TrimPrefix(row.ObjectReference, "support-private:"), bytes.NewReader(data), int64(len(data)), mime)
	if err != nil || ref != row.ObjectReference {
		h.DB.Model(&models.SupportAttachment{}).Where("id = ? AND status = ? AND lease_until = ?", row.ID, "uploading", lease).Update("status", "failed")
		return c.JSON(503, map[string]string{"error": "No se pudo guardar la captura. El caso está creado y puedes reintentar este archivo."})
	}
	result := h.DB.Model(&models.SupportAttachment{}).Where("id = ? AND status = ? AND lease_until = ?", row.ID, "uploading", lease).Update("status", "ready")
	if result.Error != nil || result.RowsAffected != 1 {
		return c.JSON(503, map[string]string{"error": "No se pudo confirmar la carga. Actualiza el caso antes de reintentar."})
	}
	return c.JSON(201, row)
}
func (h *SupportHandler) File(c echo.Context) error {
	ticket, err := supportTicket(h.DB, c, c.Param("id"), false)
	if err != nil {
		return supportError(c, err)
	}
	attachmentID, err := strconv.ParseUint(c.Param("attachment"), 10, 32)
	if err != nil || attachmentID == 0 {
		return supportError(c, gorm.ErrRecordNotFound)
	}
	var file models.SupportAttachment
	if err := h.DB.Where("id = ? AND ticket_id = ? AND status = ?", uint(attachmentID), ticket.ID, "ready").First(&file).Error; err != nil {
		return supportError(c, err)
	}
	if h.Store == nil {
		return c.JSON(503, map[string]string{"error": "No se pudo abrir la captura privada."})
	}
	stream, mime, err := h.Store.OpenSupport(c.Request().Context(), file.ObjectReference)
	if err != nil {
		return c.JSON(503, map[string]string{"error": "No se pudo abrir la captura privada."})
	}
	defer stream.Close()
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")
	c.Response().Header().Set("Content-Disposition", `inline; filename="captura`+filepath.Ext(file.Name)+`"`)
	return c.Stream(200, mime, stream)
}

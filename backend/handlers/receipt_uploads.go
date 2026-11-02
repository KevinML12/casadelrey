package handlers

import (
	"casadelrey/backend/config"
	"casadelrey/backend/models"
	"casadelrey/backend/storage"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"log"
	"time"
)

func (h *UploadHandler) reserveUpload(c echo.Context, ref string, size int64) error {
	mac := hmac.New(sha256.New, []byte(config.AppConfig.JWTSecret))
	mac.Write([]byte(c.RealIP()))
	client := hex.EncodeToString(mac.Sum(nil))
	return h.DB.Transaction(func(tx *gorm.DB) error {
		if tx.Dialector.Name() == "postgres" {
			if err := tx.Exec("SELECT pg_advisory_xact_lock(739012652)").Error; err != nil {
				return err
			}
		}
		var total, personal int64
		q := tx.Model(&models.ReceiptUpload{}).Where("created_at > ?", time.Now().Add(-24*time.Hour))
		if err := q.Select("COALESCE(SUM(size),0)").Scan(&total).Error; err != nil {
			return err
		}
		if err := q.Where("client_hash = ?", client).Select("COALESCE(SUM(size),0)").Scan(&personal).Error; err != nil {
			return err
		}
		if total+size > 1<<30 || personal+size > 64<<20 {
			return echo.NewHTTPError(429, "Se alcanzó el límite temporal de carga. Contacta al equipo o vuelve a intentarlo más tarde.")
		}
		return tx.Create(&models.ReceiptUpload{Reference: ref, ClientHash: client, Size: size, Status: "uploading", ExpiresAt: time.Now().Add(24 * time.Hour)}).Error
	})
}

func claimUpload(tx *gorm.DB, ref string) error {
	var upload models.ReceiptUpload

	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&upload, "reference = ?", ref).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	} // historical uploads remain preserved
	if err != nil {
		return err
	}
	if upload.Status != "staged" || !upload.ExpiresAt.After(time.Now()) {
		return echo.NewHTTPError(400, "La carga temporal venció o ya se usó. Vuelve a subir el comprobante.")
	}
	now := time.Now()
	return tx.Model(&upload).Updates(map[string]interface{}{"status": "claimed", "claimed_at": now}).Error
}

// CleanupOrphanReceipts never enumerates the bucket: only the new ledger can
// nominate an expired file, and every historical receipt reference is checked.
func CleanupOrphanReceipts(ctx context.Context, db *gorm.DB, store storage.Store) error {
	cleaner, ok := store.(storage.ReceiptCleaner)
	if !ok {
		return nil
	}
	var rows []models.ReceiptUpload
	if err := db.WithContext(ctx).Where("status IN ? AND expires_at < ?", []string{"staged", "uploading", "deleting"}, time.Now()).Order("expires_at").Limit(20).Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			if tx.Dialector.Name() == "postgres" {
				if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", row.Reference).Error; err != nil {
					return err
				}
			}
			var current models.ReceiptUpload
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&current, "reference = ?", row.Reference).Error; err != nil {
				return err
			}
			if current.Status == "claimed" || current.Status == "deleted" || current.ExpiresAt.After(time.Now()) {
				return nil
			}
			var used int64
			if err := tx.Unscoped().Model(&models.PaymentReceipt{}).Where("receipt_image_url = ?", row.Reference).Count(&used).Error; err != nil {
				return err
			}
			if used > 0 {
				return tx.Model(&current).Update("status", "claimed").Error
			}
			if err := cleaner.DeleteReceipt(ctx, row.Reference); err != nil {
				return err
			}
			return tx.Model(&current).Update("status", "deleted").Error
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func RunReceiptCleanup(ctx context.Context, db *gorm.DB, store storage.Store) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			step, cancel := context.WithTimeout(ctx, 30*time.Second)
			if err := CleanupOrphanReceipts(step, db, store); err != nil {
				log.Print("[receipt-cleanup] cleanup incomplete; will retry next cycle")
			}
			cancel()
		}
	}
}

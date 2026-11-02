package handlers

import (
	"casadelrey/backend/config"
	"casadelrey/backend/models"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"github.com/glebarez/sqlite"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"net/http/httptest"
	"testing"
	"time"
)

func TestReceiptStagingQuotaIsEnforcedBeforeStorage(t *testing.T) {
	for _, global := range []bool{false, true} {
		t.Run(map[bool]string{false: "per client", true: "global"}[global], func(t *testing.T) {
			db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
			require.NoError(t, err)
			require.NoError(t, db.AutoMigrate(&models.ReceiptUpload{}))
			prior := config.AppConfig
			config.AppConfig = &config.Config{JWTSecret: "controlled-test"}
			t.Cleanup(func() { config.AppConfig = prior })
			app := echo.New()
			req := httptest.NewRequest("POST", "/", nil)
			req.RemoteAddr = "192.0.2.1:1234"
			ctx := app.NewContext(req, httptest.NewRecorder())
			mac := hmac.New(sha256.New, []byte(config.AppConfig.JWTSecret))
			mac.Write([]byte(ctx.RealIP()))
			hash := hex.EncodeToString(mac.Sum(nil))
			size := int64(64 << 20)
			if global {
				size = 1 << 30
				hash = "another-client"
			}
			require.NoError(t, db.Create(&models.ReceiptUpload{Reference: "previous", ClientHash: hash, Size: size, Status: "claimed", CreatedAt: time.Now(), ExpiresAt: time.Now().Add(time.Hour)}).Error)
			err = (&UploadHandler{DB: db}).reserveUpload(ctx, "new", 1)
			var status *echo.HTTPError
			require.ErrorAs(t, err, &status)
			require.Equal(t, 429, status.Code)
			var count int64
			require.NoError(t, db.Model(&models.ReceiptUpload{}).Count(&count).Error)
			require.EqualValues(t, 1, count)
		})
	}
}

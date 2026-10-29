package handlers

import (
	"casadelrey/backend/models"
	"casadelrey/backend/utils/testutils"
	"fmt"
	"github.com/labstack/echo/v4"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestUpdateCellPreservesPublishedLegacyCode(t *testing.T) {
	db := testutils.SetupTestDB()
	if err := db.AutoMigrate(&models.User{}, &models.Cell{}); err != nil {
		t.Fatal(err)
	}
	leader := models.User{Name: "Leader", Email: "legacy@example.invalid", Password: "hash", Role: "leader"}
	db.Create(&leader)
	cell := models.Cell{Code: "V1", Name: "Comunidad existente", Type: "hombres", LeaderID: leader.ID, IsActive: true}
	db.Create(&cell)
	handler := NewCellCategoryHandler(db)
	for _, sample := range []struct {
		code   string
		status int
	}{{"V1", 200}, {"BAD-CODE", 400}} {
		e := echo.New()
		req := httptest.NewRequest(http.MethodPut, "/admin/cells/1", strings.NewReader(fmt.Sprintf(`{"code":%q,"name":"Comunidad actualizada"}`, sample.code)))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		ctx := e.NewContext(req, rec)
		ctx.SetParamNames("id")
		ctx.SetParamValues(fmt.Sprint(cell.ID))
		if err := handler.UpdateCell(ctx); err != nil {
			t.Fatal(err)
		}
		if rec.Code != sample.status {
			t.Fatalf("code %s: status %d, expected %d", sample.code, rec.Code, sample.status)
		}
	}
	var saved models.Cell
	db.First(&saved, cell.ID)
	if saved.Code != "V1" || saved.Name != "Comunidad actualizada" {
		t.Fatal("Existing cell was changed incorrectly")
	}
}

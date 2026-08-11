package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"casadelrey/backend/models"
	"casadelrey/backend/utils/testutils"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Prepara dos lideres con una celula cada uno. El caso que importa no es
// el feliz: es que un lider no pueda tocar la celula del otro.
func dosLideresConCelula(t *testing.T) (*gorm.DB, models.Cell, models.Cell, uint, uint) {
	t.Helper()
	d := testutils.SetupTestDB()
	d.AutoMigrate(&models.User{}, &models.Cell{})

	lA := models.User{Name: "Lider A", Email: "a@x.com", Password: "x", Role: "leader"}
	lB := models.User{Name: "Lider B", Email: "b@x.com", Password: "x", Role: "leader"}
	d.Create(&lA)
	d.Create(&lB)

	cA := models.Cell{Code: "J1", Name: "Celula A", Type: "jovenes", LeaderID: lA.ID, IsActive: true}
	cB := models.Cell{Code: "J2", Name: "Celula B", Type: "jovenes", LeaderID: lB.ID, IsActive: true}
	d.Create(&cA)
	d.Create(&cB)

	return d, cA, cB, lA.ID, lB.ID
}

func TestLiderEditaSuPropiaCelula(t *testing.T) {
	db, cA, _, uidA, _ := dosLideresConCelula(t)

	h := NewCellCategoryHandler(db)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/leader/my-cell",
		strings.NewReader(`{"day":"Martes","time":"7:00 PM","what_to_expect":"Cantamos y compartimos la Palabra."}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", uidA)

	if err := h.UpdateMyCell(ctx); err != nil {
		t.Fatalf("UpdateMyCell devolvio error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("esperaba 200, obtuve %d: %s", rec.Code, rec.Body.String())
	}

	var out models.Cell
	db.First(&out, cA.ID)
	if out.Day != "Martes" || out.Time != "7:00 PM" {
		t.Errorf("no guardo dia/hora: %q %q", out.Day, out.Time)
	}
	if out.WhatToExpect == "" {
		t.Errorf("no guardo what_to_expect")
	}
}

// El aislamiento: el lider A manda un PUT y NO debe tocar la celula de B.
func TestLiderNoPuedeTocarLaCelulaDeOtro(t *testing.T) {
	db, _, cB, uidA, _ := dosLideresConCelula(t)

	h := NewCellCategoryHandler(db)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/leader/my-cell",
		strings.NewReader(`{"day":"HACKEADO"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", uidA)
	h.UpdateMyCell(ctx)

	var deB models.Cell
	db.First(&deB, cB.ID)
	if deB.Day == "HACKEADO" {
		t.Fatal("un lider edito la celula de OTRO lider")
	}
}

// Sin celula asignada: 404 con un mensaje que explica que hacer, no un
// 500 ni una celula vacia.
func TestLiderSinCelulaRecibe404(t *testing.T) {
	db := testutils.SetupTestDB()
	db.AutoMigrate(&models.User{}, &models.Cell{})
	huerfano := models.User{Name: "Sin celula", Email: "s@x.com", Password: "x", Role: "leader"}
	db.Create(&huerfano)

	h := NewCellCategoryHandler(db)
	e := echo.New()
	rec := httptest.NewRecorder()
	ctx := e.NewContext(httptest.NewRequest(http.MethodGet, "/leader/my-cell", nil), rec)
	ctx.Set("user_id", huerfano.ID)
	h.GetMyCell(ctx)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("esperaba 404, obtuve %d", rec.Code)
	}
}

package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"casadelrey/backend/models"
	"casadelrey/backend/utils/testutils"

	"github.com/labstack/echo/v4"
)

// La solicitud desde /celulas debe (1) guardarse con la celula pedida y
// (2) quedar auto-asignada al lider de esa celula, que es lo que hace que
// aterrice sola en su panel.
func TestConnectCardConCelulaSeAutoasignaAlLider(t *testing.T) {
	db := testutils.SetupTestDB()
	db.AutoMigrate(&models.User{}, &models.Cell{}, &models.ConnectCard{})

	lider := models.User{Name: "Cristian de Leon", Email: "c@x.com", Password: "x", Role: "leader"}
	db.Create(&lider)
	celula := models.Cell{Code: "J9", Name: "Wild Youth", Type: "jovenes", LeaderID: lider.ID, Zone: "Zona 4", IsActive: true}
	db.Create(&celula)

	h := NewConnectCardHandler(db)
	e := echo.New()
	body := `{"name":"Visitante","phone":"50255550000","category":"busco_celula","cell_id":` + itoa(celula.ID) + `}`
	req := httptest.NewRequest(http.MethodPost, "/connect-cards", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	if err := h.Create(e.NewContext(req, rec)); err != nil {
		t.Fatalf("Create devolvio error: %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Fatalf("esperaba 201, obtuve %d: %s", rec.Code, rec.Body.String())
	}

	var out map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &out)
	var card models.ConnectCard
	db.First(&card, uint(out["id"].(float64)))

	if card.CellID == nil || *card.CellID != celula.ID {
		t.Errorf("no guardo la celula pedida: %v", card.CellID)
	}
	if card.LeaderAssignedID == nil || *card.LeaderAssignedID != lider.ID {
		t.Errorf("no auto-asigno al lider de la celula: %v", card.LeaderAssignedID)
	}
}

// Un cell_id que no existe NO debe tumbar el envio: la persona escribio
// sus datos de verdad y perderlos por un id viejo seria el peor final.
func TestConnectCardConCelulaInexistenteIgualGuarda(t *testing.T) {
	db := testutils.SetupTestDB()
	db.AutoMigrate(&models.User{}, &models.Cell{}, &models.ConnectCard{})

	h := NewConnectCardHandler(db)
	e := echo.New()
	body := `{"name":"Visitante","phone":"50255550000","category":"busco_celula","cell_id":99999}`
	req := httptest.NewRequest(http.MethodPost, "/connect-cards", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	h.Create(e.NewContext(req, rec))

	if rec.Code != http.StatusCreated {
		t.Fatalf("esperaba 201 (guardar igual), obtuve %d: %s", rec.Code, rec.Body.String())
	}
	var card models.ConnectCard
	db.Order("id DESC").First(&card)
	if card.CellID != nil {
		t.Errorf("no debio guardar un cell_id invalido: %v", *card.CellID)
	}
	if card.Name != "Visitante" {
		t.Errorf("perdio los datos de la persona")
	}
}

func itoa(u uint) string {
	if u == 0 {
		return "0"
	}
	var b []byte
	for u > 0 {
		b = append([]byte{byte('0' + u%10)}, b...)
		u /= 10
	}
	return string(b)
}

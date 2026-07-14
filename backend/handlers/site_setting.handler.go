package handlers

// SiteSetting — configuración de texto administrable (clave-valor).
// Su razón de ser: sacar del código los datos que el admin debe poder
// cambiar sin deploy — sobre todo la CUENTA BANCARIA (antes hardcodeada
// con el número del mockup de Figma). Público lee /settings; admin edita.

import (
	"net/http"

	"casadelrey/backend/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type SiteSettingHandler struct {
	DB *gorm.DB
}

func NewSiteSettingHandler(db *gorm.DB) *SiteSettingHandler {
	return &SiteSettingHandler{DB: db}
}

// knownSettings — fuente de verdad de qué llaves existen, su etiqueta
// legible y su valor por defecto. Agregar una config nueva es una línea.
// bank_account por defecto VACÍO a propósito: mejor no mostrar cuenta que
// mostrar una equivocada; el front invita a coordinar el depósito hasta
// que el admin ponga la real.
var knownSettings = []struct{ Key, Label, Default string }{
	{"bank_name", "Banco", "Banrural"},
	{"bank_account", "Número de cuenta", ""},
	{"bank_account_type", "Tipo de cuenta", "Monetaria"},
	{"bank_holder", "A nombre de", "Iglesia Casa del Rey"},
	{"contact_whatsapp", "WhatsApp de contacto (con 502)", ""},
}

func settingDefault(key string) (label, def string, known bool) {
	for _, s := range knownSettings {
		if s.Key == key {
			return s.Label, s.Default, true
		}
	}
	return "", "", false
}

// GetPublic GET /api/v1/settings — mapa {key: value} para el sitio
// público. Devuelve el valor guardado o el default de knownSettings.
func (h *SiteSettingHandler) GetPublic(c echo.Context) error {
	var rows []models.SiteSetting
	if err := h.DB.Find(&rows).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener la configuración."})
	}
	stored := map[string]string{}
	for _, r := range rows {
		stored[r.Key] = r.Value
	}
	out := map[string]string{}
	for _, s := range knownSettings {
		if v, ok := stored[s.Key]; ok && v != "" {
			out[s.Key] = v
		} else {
			out[s.Key] = s.Default
		}
	}
	return c.JSON(http.StatusOK, out)
}

// GetAll GET /api/v1/admin/settings — lista con label + valor efectivo
// para el panel (incluye los que aún usan el default).
func (h *SiteSettingHandler) GetAll(c echo.Context) error {
	var rows []models.SiteSetting
	if err := h.DB.Find(&rows).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al obtener la configuración."})
	}
	stored := map[string]string{}
	for _, r := range rows {
		stored[r.Key] = r.Value
	}
	type item struct {
		Key       string `json:"key"`
		Label     string `json:"label"`
		Value     string `json:"value"`
		UsingDefault bool `json:"using_default"`
	}
	var out []item
	for _, s := range knownSettings {
		v, ok := stored[s.Key]
		usingDefault := !ok || v == ""
		effective := v
		if usingDefault {
			effective = s.Default
		}
		out = append(out, item{Key: s.Key, Label: s.Label, Value: effective, UsingDefault: usingDefault})
	}
	return c.JSON(http.StatusOK, out)
}

// UpdateSetting PUT /api/v1/admin/settings/:key — upsert de una llave.
func (h *SiteSettingHandler) UpdateSetting(c echo.Context) error {
	key := c.Param("key")
	if _, _, known := settingDefault(key); !known {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Configuración desconocida."})
	}
	var req struct {
		Value string `json:"value"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Datos inválidos."})
	}

	var row models.SiteSetting
	err := h.DB.Where("key = ?", key).First(&row).Error
	if err == gorm.ErrRecordNotFound {
		row = models.SiteSetting{Key: key, Value: req.Value}
		if err := h.DB.Create(&row).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo guardar."})
		}
	} else if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error al buscar la configuración."})
	} else {
		row.Value = req.Value
		if err := h.DB.Save(&row).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No se pudo guardar."})
		}
	}
	return c.JSON(http.StatusOK, row)
}

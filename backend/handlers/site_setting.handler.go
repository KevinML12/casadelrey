package handlers

// SiteSetting — configuración de texto administrable (clave-valor).
// Su razón de ser: sacar del código los datos que el admin debe poder
// cambiar sin deploy — sobre todo la CUENTA BANCARIA (antes hardcodeada
// con el número del mockup de Figma). Público lee /settings; admin edita.

import (
	"net/http"
	"strings"

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
	{"about_title", "Nosotros — Título", "Somos Casa del Rey."},
	{"about_intro", "Nosotros — Presentación", "Una iglesia familiar en Huehuetenango, edificada célula por célula, generación tras generación."},
	{"about_founders_names", "Nosotros — Nombres de fundadores", "José de León y Desidería López"},
	{"about_founders_description", "Nosotros — Historia de fundadores", "Sembraron la visión original de Casa del Rey — los cimientos sobre los que la iglesia sigue edificando hoy."},
	{"about_pastors_names", "Nosotros — Nombres de pastores", "Leonel de León e Ismeina Castillo"},
	{"about_pastors_description", "Nosotros — Equipo pastoral", "Junto a un equipo pastoral, cubren las células de varones, prejuveniles y la red Mujeres de Palabra."},
	{"about_mission", "Nosotros — Misión", "Somos una iglesia cristiana familiar, enfocada en cumplir la gran comisión de Jesucristo: ir y hacer discípulos a las naciones, formando líderes capaces de reproducir la obra de Dios."},
	{"about_vision", "Nosotros — Visión", "Ser una iglesia de restauración familiar, punta de lanza, que proclama la verdad de la Palabra de Dios bajo el poder del Espíritu Santo."},
	{"about_address", "Nosotros — Dirección", "7ª. Calle 12-66 zona 4, carretera a las Ruinas de Zaculeu, Huehuetenango"},
	{"about_map_url", "Nosotros — Enlace del mapa", "https://www.google.com/maps/search/?api=1&query=Casa+del+Rey+7a+Calle+12-66+zona+4+Huehuetenango"},
	{"about_podcast_title", "Nosotros — Nombre del podcast", "Podcast Inusual Youth"},
	{"about_podcast_schedule", "Nosotros — Horario del podcast", "92.9 FM Radio Stereo Cumbre · Viernes · 3:00 PM"},

	{"bank_name", "Banco", "Banrural"},
	{"bank_account", "Número de cuenta", ""},
	{"bank_account_type", "Tipo de cuenta", "Monetaria"},
	{"bank_holder", "A nombre de", "Iglesia Casa del Rey"},
	{"contact_whatsapp", "WhatsApp de contacto (con 502)", ""},
	{"admin_bg", "Fondo Panel Admin (URL)", "/images/bg-admin.png"},
	{"leader_bg", "Fondo Panel Líder (URL)", "/images/bg-leader.png"},
	{"volunteer_bg", "Fondo Panel Voluntario (URL)", "/images/bg-volunteer.png"},
	{"public_bg_home", "Fondo Inicio (URL)", "/images/public_bg_home.jpg"},
	{"public_bg_celulas", "Fondo Células (URL)", "/images/public_bg_celulas.jpg"},
	{"public_bg_eventos", "Fondo Eventos (URL)", "/images/public_bg_eventos.jpg"},
	{"public_bg_voluntariado", "Fondo Voluntariado (URL)", "/images/public_bg_voluntariado.jpg"},
	{"public_bg_donaciones", "Fondo Dar (URL)", "/images/public_bg_donaciones.jpg"},
	{"public_bg_nosotros", "Fondo Nosotros (URL)", "/images/public_bg_nosotros.jpg"},
	{"public_bg_blog", "Fondo Blog (URL)", "/images/components/bg_blog.jpg"},
	{"public_bg_galeria", "Fondo Galería (URL)", "/images/components/bg_galeria.jpg"},
	{"public_bg_oracion", "Fondo Oración (URL)", "/images/components/bg_oracion.jpg"},
	{"public_bg_conectate", "Fondo Conéctate (URL)", "/images/components/bg_conectate.jpg"},
	{"public_bg_login", "Fondo Login (URL)", "/images/components/bg_login.jpg"},
	{"public_bg_registro", "Fondo Registro (URL)", "/images/components/bg_registro.jpg"},
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
		if v, ok := stored[s.Key]; ok && (v != "" || strings.HasPrefix(s.Key, "about_")) {
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
		Key          string `json:"key"`
		Label        string `json:"label"`
		Value        string `json:"value"`
		UsingDefault bool   `json:"using_default"`
	}
	var out []item
	for _, s := range knownSettings {
		v, ok := stored[s.Key]
		usingDefault := !ok || (v == "" && !strings.HasPrefix(s.Key, "about_"))
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

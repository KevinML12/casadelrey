package handlers

import (
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/labstack/echo/v4"
)

// TTSHandler convierte texto a voz.
//
// Motor primario  : Google Cloud TTS  (si GOOGLE_TTS_KEY está configurada)
// Motor de reserva: Google Translate  (gratis, sin API key, buena calidad)
type TTSHandler struct{}

func NewTTSHandler() *TTSHandler { return &TTSHandler{} }

// ── Helpers ───────────────────────────────────────────────────────────────────

// splitSentences divide el texto en frases ≤ maxLen caracteres
// intentando cortar en puntos, comas o espacios.
func splitSentences(text string, maxLen int) []string {
	text = strings.TrimSpace(text)
	if utf8.RuneCountInString(text) <= maxLen {
		return []string{text}
	}

	// Dividir por oraciones primero
	re := regexp.MustCompile(`[^.!?]*[.!?]+`)
	sentences := re.FindAllString(text, -1)
	if len(sentences) == 0 {
		sentences = []string{text}
	}

	var chunks []string
	cur := ""
	for _, s := range sentences {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		if utf8.RuneCountInString(cur)+utf8.RuneCountInString(s)+1 <= maxLen {
			if cur != "" {
				cur += " "
			}
			cur += s
		} else {
			if cur != "" {
				chunks = append(chunks, cur)
			}
			// Si la frase sola es más larga que maxLen, la cortamos por palabras
			if utf8.RuneCountInString(s) > maxLen {
				words := strings.Fields(s)
				tmp := ""
				for _, w := range words {
					if utf8.RuneCountInString(tmp)+utf8.RuneCountInString(w)+1 > maxLen {
						if tmp != "" {
							chunks = append(chunks, tmp)
						}
						tmp = w
					} else {
						if tmp != "" {
							tmp += " "
						}
						tmp += w
					}
				}
				cur = tmp
			} else {
				cur = s
			}
		}
	}
	if cur != "" {
		chunks = append(chunks, cur)
	}
	return chunks
}

// ── Motor 1: Google Translate TTS (gratis, sin API key) ──────────────────────

func fetchGoogleTranslateTTS(text string) ([]byte, error) {
	endpoint := fmt.Sprintf(
		"https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=%s",
		url.QueryEscape(text),
	)

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	// Cabeceras necesarias para que Google no bloquee la petición
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; CasaDelReyBot/1.0)")
	req.Header.Set("Referer", "https://translate.google.com/")
	req.Header.Set("Accept", "audio/mpeg,audio/*;q=0.9,*/*;q=0.8")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google Translate TTS respondió %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// ── Motor 2: Google Cloud TTS (mejor calidad, requiere GOOGLE_TTS_KEY) ───────

func fetchGoogleCloudTTS(text, apiKey string) ([]byte, error) {
	payload := fmt.Sprintf(`{
		"input":      { "text": %q },
		"voice":      { "languageCode": "es-US", "name": "es-US-Neural2-A" },
		"audioConfig":{ "audioEncoding": "MP3", "speakingRate": 0.9 }
	}`, text)

	endpoint := "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey
	resp, err := http.Post(endpoint, "application/json", strings.NewReader(payload))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google Cloud TTS respondió %d: %s", resp.StatusCode, body)
	}

	// Extraer audioContent del JSON sin importar libraries extra
	// Formato: {"audioContent":"BASE64..."}
	s := string(body)
	start := strings.Index(s, `"audioContent":"`)
	if start == -1 {
		return nil, fmt.Errorf("respuesta inesperada de Google Cloud TTS")
	}
	start += len(`"audioContent":"`)
	end := strings.Index(s[start:], `"`)
	if end == -1 {
		return nil, fmt.Errorf("respuesta inesperada de Google Cloud TTS (cierre)")
	}
	b64 := s[start : start+end]

	return base64.StdEncoding.DecodeString(b64)
}

// ── Handler principal ─────────────────────────────────────────────────────────

// Synthesize godoc
// POST /api/v1/tts
// Body: { "text": "..." }
// Devuelve: { "audio": "<base64 MP3>" }
func (h *TTSHandler) Synthesize(c echo.Context) error {
	var req struct {
		Text string `json:"text"`
	}
	if err := c.Bind(&req); err != nil || strings.TrimSpace(req.Text) == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Se requiere el campo 'text'.",
		})
	}

	// Limitar a 12.000 chars para evitar peticiones abusivas
	text := req.Text
	if utf8.RuneCountInString(text) > 12_000 {
		runes := []rune(text)
		text = string(runes[:12_000])
	}

	apiKey := os.Getenv("GOOGLE_TTS_KEY")
	useCloud := apiKey != ""

	// Tamaño máximo por chunk: Cloud soporta 5000 chars, Translate ~180
	maxChunk := 180
	if useCloud {
		maxChunk = 4800
	}

	chunks := splitSentences(text, maxChunk)
	var combined []byte

	for i, chunk := range chunks {
		var audio []byte
		var err error

		if useCloud {
			audio, err = fetchGoogleCloudTTS(chunk, apiKey)
		} else {
			audio, err = fetchGoogleTranslateTTS(chunk)
		}

		if err != nil {
			log.Printf("[TTS] Error en chunk %d (%s): %v", i, map[bool]string{true: "Cloud", false: "Translate"}[useCloud], err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error al generar el audio. Intenta de nuevo.",
			})
		}
		combined = append(combined, audio...)
	}

	engine := "google-translate"
	if useCloud {
		engine = "google-cloud"
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"audio":  base64.StdEncoding.EncodeToString(combined),
		"engine": engine,
		"chunks": len(chunks),
	})
}

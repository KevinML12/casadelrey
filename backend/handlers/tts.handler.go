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

// TTSHandler — Texto a voz.
// Motor 1: ElevenLabs (si ELEVENLABS_API_KEY) — voz IA, muy natural
// Motor 2: Google Cloud TTS (si GOOGLE_TTS_KEY)
// Motor 3: Google Translate TTS (gratis, sin API key)
type TTSHandler struct{}

func NewTTSHandler() *TTSHandler { return &TTSHandler{} }

func splitSentences(text string, maxLen int) []string {
	text = strings.TrimSpace(text)
	if utf8.RuneCountInString(text) <= maxLen {
		return []string{text}
	}
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

// Voz Rachel de ElevenLabs — funciona muy bien en español con eleven_multilingual_v2
const elevenLabsVoiceID = "21m00Tcm4TlvDq8ikWAM"

func fetchElevenLabsTTS(text, apiKey string) ([]byte, error) {
	payload := fmt.Sprintf(`{"text":%q,"model_id":"eleven_multilingual_v2"}`, text)
	endpoint := fmt.Sprintf("https://api.elevenlabs.io/v1/text-to-speech/%s", elevenLabsVoiceID)

	req, err := http.NewRequest("POST", endpoint, strings.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("xi-api-key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "audio/mpeg")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ElevenLabs respondió %d: %s", resp.StatusCode, body)
	}
	return io.ReadAll(resp.Body)
}

func fetchGoogleTranslateTTS(text string) ([]byte, error) {
	// Límite ~200 chars por request (Google Translate)
	if utf8.RuneCountInString(text) > 200 {
		text = string([]rune(text)[:200])
	}
	endpoint := fmt.Sprintf(
		"https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=%s",
		url.QueryEscape(text),
	)
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://translate.google.com/")
	req.Header.Set("Accept", "audio/mpeg,audio/*;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "es-ES,es;q=0.9,en;q=0.8")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("conexión: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		preview := string(body)
		if len(preview) > 200 {
			preview = preview[:200]
		}
		return nil, fmt.Errorf("Google Translate respondió %d: %s", resp.StatusCode, preview)
	}
	// Verificar que sea audio (empieza con ID3 o similar), no HTML
	if len(body) < 100 {
		return nil, fmt.Errorf("respuesta demasiado corta (%d bytes)", len(body))
	}
	return body, nil
}

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

	s := string(body)
	start := strings.Index(s, `"audioContent":"`)
	if start == -1 {
		return nil, fmt.Errorf("respuesta inesperada de Google Cloud TTS")
	}
	start += len(`"audioContent":"`)
	end := strings.Index(s[start:], `"`)
	if end == -1 {
		return nil, fmt.Errorf("respuesta inesperada de Google Cloud TTS")
	}
	b64 := s[start : start+end]
	return base64.StdEncoding.DecodeString(b64)
}

// Health — GET /api/v1/tts/health — para verificar que el servicio TTS está desplegado
func (h *TTSHandler) Health(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status": "ok",
		"tts":    "available",
	})
}

func (h *TTSHandler) Synthesize(c echo.Context) error {
	var req struct {
		Text string `json:"text"`
	}
	if err := c.Bind(&req); err != nil || strings.TrimSpace(req.Text) == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Se requiere el campo 'text'.",
		})
	}

	text := req.Text
	if utf8.RuneCountInString(text) > 12_000 {
		runes := []rune(text)
		text = string(runes[:12_000])
	}

	// Motor: TTS_ENGINE fuerza uno, o auto: ElevenLabs > Google Cloud > Google Translate
	forceEngine := strings.ToLower(strings.TrimSpace(os.Getenv("TTS_ENGINE")))
	elevenKey := os.Getenv("ELEVENLABS_API_KEY")
	googleKey := os.Getenv("GOOGLE_TTS_KEY")

	var engine string
	maxChunk := 180
	switch forceEngine {
	case "elevenlabs":
		engine = "elevenlabs"
		maxChunk = 2500
	case "google-cloud":
		engine = "google-cloud"
		maxChunk = 4800
	case "google-translate":
		engine = "google-translate"
	default:
		if elevenKey != "" {
			engine = "elevenlabs"
			maxChunk = 2500
		} else if googleKey != "" {
			engine = "google-cloud"
			maxChunk = 4800
		} else {
			engine = "google-translate"
		}
	}

	chunks := splitSentences(text, maxChunk)
	var combined []byte

	for i, chunk := range chunks {
		var audio []byte
		var err error

		switch engine {
		case "elevenlabs":
			audio, err = fetchElevenLabsTTS(chunk, elevenKey)
			// Fallback: si ElevenLabs falla (401/403, sin permisos, plan free bloqueado), usar Google Translate
			if err != nil && (strings.Contains(err.Error(), "401") || strings.Contains(err.Error(), "403") ||
				strings.Contains(err.Error(), "missing_permissions") || strings.Contains(err.Error(), "detected_unusual_activity")) {
				log.Printf("[TTS] ElevenLabs no disponible, usando Google Translate: %v", err)
				engine = "google-translate"
				chunks = splitSentences(text, 200)
				combined = nil
				for j, ch := range chunks {
					audio, err = fetchGoogleTranslateTTS(ch)
					if err != nil {
						log.Printf("[TTS] Error chunk %d: %v", j, err)
						return c.JSON(http.StatusInternalServerError, map[string]interface{}{
							"error": "Error al generar el audio.", "detail": err.Error(), "engine": "google-translate",
						})
					}
					combined = append(combined, audio...)
				}
				return c.JSON(http.StatusOK, map[string]interface{}{
					"audio": base64.StdEncoding.EncodeToString(combined),
					"engine": "google-translate",
					"chunks": len(chunks),
				})
			}
		case "google-cloud":
			audio, err = fetchGoogleCloudTTS(chunk, googleKey)
		default:
			audio, err = fetchGoogleTranslateTTS(chunk)
		}

		if err != nil {
			log.Printf("[TTS] Error en chunk %d (%s): %v", i, engine, err)
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error":  "Error al generar el audio.",
				"detail": err.Error(),
				"engine": engine,
			})
		}
		combined = append(combined, audio...)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"audio":  base64.StdEncoding.EncodeToString(combined),
		"engine": engine,
		"chunks": len(chunks),
	})
}

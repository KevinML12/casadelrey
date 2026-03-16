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
// Motor 1: Google Cloud TTS (si GOOGLE_TTS_KEY está configurada)
// Motor 2: Google Translate TTS (gratis, sin API key)
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

func fetchGoogleTranslateTTS(text string) ([]byte, error) {
	endpoint := fmt.Sprintf(
		"https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=%s",
		url.QueryEscape(text),
	)
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
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

	apiKey := os.Getenv("GOOGLE_TTS_KEY")
	useCloud := apiKey != ""
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
			log.Printf("[TTS] Error en chunk %d: %v", i, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error al generar el audio. Intenta de nuevo.",
			})
		}
		combined = append(combined, audio...)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"audio":  base64.StdEncoding.EncodeToString(combined),
		"chunks": len(chunks),
	})
}

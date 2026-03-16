package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"unicode/utf8"

	"github.com/labstack/echo/v4"
)

// TTSHandler convierte texto a voz usando la API REST de Google Cloud TTS.
// No requiere SDK adicional — solo net/http.
type TTSHandler struct{}

func NewTTSHandler() *TTSHandler { return &TTSHandler{} }

// Límite de Google TTS por petición (en caracteres)
const maxCharsPerRequest = 4800

// googleTTSRequest es el body que espera la API de Google
type googleTTSRequest struct {
	Input       ttsInput       `json:"input"`
	Voice       ttsVoice       `json:"voice"`
	AudioConfig ttsAudioConfig `json:"audioConfig"`
}

type ttsInput struct {
	Text string `json:"text"`
}

type ttsVoice struct {
	LanguageCode string `json:"languageCode"`
	Name         string `json:"name"`
}

type ttsAudioConfig struct {
	AudioEncoding string  `json:"audioEncoding"`
	SpeakingRate  float64 `json:"speakingRate"`
	Pitch         float64 `json:"pitch"`
}

// googleTTSResponse solo nos importa el audio en base64
type googleTTSResponse struct {
	AudioContent string `json:"audioContent"`
}

// splitText parte el texto en chunks ≤ maxCharsPerRequest respetando palabras completas
func splitText(text string, maxChars int) []string {
	var chunks []string
	words := strings.Fields(text)
	current := strings.Builder{}

	for _, word := range words {
		// +1 por el espacio
		if utf8.RuneCountInString(current.String())+utf8.RuneCountInString(word)+1 > maxChars {
			if current.Len() > 0 {
				chunks = append(chunks, strings.TrimSpace(current.String()))
				current.Reset()
			}
		}
		if current.Len() > 0 {
			current.WriteString(" ")
		}
		current.WriteString(word)
	}

	if current.Len() > 0 {
		chunks = append(chunks, strings.TrimSpace(current.String()))
	}
	return chunks
}

// synthesizeChunk llama a la API de Google TTS y devuelve el audio en base64
func synthesizeChunk(text, apiKey string) (string, error) {
	payload := googleTTSRequest{
		Input: ttsInput{Text: text},
		Voice: ttsVoice{
			LanguageCode: "es-US",
			Name:         "es-US-Neural2-A", // Voz femenina neural en español latinoamericano
		},
		AudioConfig: ttsAudioConfig{
			AudioEncoding: "MP3",
			SpeakingRate:  0.9,
			Pitch:         0.0,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf(
		"https://texttospeech.googleapis.com/v1/text:synthesize?key=%s",
		apiKey,
	)

	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("error al llamar Google TTS: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Google TTS respondió %d: %s", resp.StatusCode, string(respBody))
	}

	var result googleTTSResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", err
	}

	return result.AudioContent, nil
}

// Synthesize godoc
// POST /api/v1/tts
// Body: { "text": "..." }
// Respuesta: { "audio": "<base64 MP3>", "chunks": N }
// Público — no requiere auth.
func (h *TTSHandler) Synthesize(c echo.Context) error {
	apiKey := os.Getenv("GOOGLE_TTS_KEY")
	if apiKey == "" {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"error": "TTS no configurado. Contacta al administrador.",
		})
	}

	var req struct {
		Text string `json:"text"`
	}
	if err := c.Bind(&req); err != nil || strings.TrimSpace(req.Text) == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Se requiere el campo 'text'.",
		})
	}

	// Limitar a 15.000 chars para evitar abuso
	text := req.Text
	if utf8.RuneCountInString(text) > 15_000 {
		text = string([]rune(text)[:15_000])
	}

	chunks := splitText(text, maxCharsPerRequest)

	// Para textos cortos (1 chunk) respondemos directamente
	// Para textos largos concatenamos el base64 de cada chunk
	// Nota: base64 de MP3 se puede concatenar y el navegador lo reproduce como uno solo
	var audioB64 strings.Builder

	for i, chunk := range chunks {
		b64, err := synthesizeChunk(chunk, apiKey)
		if err != nil {
			log.Printf("[TTS] Error en chunk %d: %v", i, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error al generar audio. Inténtalo de nuevo.",
			})
		}
		audioB64.WriteString(b64)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"audio":  audioB64.String(),
		"chunks": len(chunks),
	})
}

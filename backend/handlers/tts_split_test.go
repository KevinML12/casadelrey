package handlers

// White-box tests para splitSentences (función privada del paquete handlers).

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSplitSentences_TextoCorto_UnaChunk(t *testing.T) {
	result := splitSentences("Hola mundo.", 200)
	require.Len(t, result, 1)
	assert.Equal(t, "Hola mundo.", result[0])
}

func TestSplitSentences_TextoExactoMaxLen_UnaChunk(t *testing.T) {
	text := "Hola." // 5 chars
	result := splitSentences(text, 5)
	require.Len(t, result, 1)
	assert.Equal(t, text, result[0])
}

func TestSplitSentences_TextoVacio_RetornaChunkVacio(t *testing.T) {
	result := splitSentences("", 200)
	require.Len(t, result, 1)
	assert.Equal(t, "", result[0])
}

func TestSplitSentences_SoloEspacios_RetornaChunkVacio(t *testing.T) {
	result := splitSentences("   ", 200)
	require.Len(t, result, 1)
	assert.Equal(t, "", result[0])
}

func TestSplitSentences_SinPuntos_MantieneUnSoloChunk(t *testing.T) {
	text := "hola mundo sin puntos finales"
	result := splitSentences(text, 200)
	require.Len(t, result, 1)
	assert.Equal(t, text, result[0])
}

func TestSplitSentences_VariasOraciones_MultiplesChunks(t *testing.T) {
	// maxLen=10 obliga a dividir "Primera." (8) y "Segunda." (8) en chunks distintos
	text := "Primera. Segunda. Tercera."
	result := splitSentences(text, 10)
	assert.Greater(t, len(result), 1, "debe producir más de un chunk")
	// El contenido concatenado debe ser equivalente al original
	joined := strings.Join(result, " ")
	assert.Contains(t, joined, "Primera")
	assert.Contains(t, joined, "Segunda")
	assert.Contains(t, joined, "Tercera")
}

func TestSplitSentences_OracionMuyLarga_DivideEnPalabras(t *testing.T) {
	// Una sola oración larga sin salto natural debe dividirse por palabras
	text := "Una oración larga con muchas palabras que supera el límite."
	result := splitSentences(text, 15)
	// Cada chunk debe ser ≤ ~15 chars (aproximado, el límite es por palabras)
	for _, chunk := range result {
		assert.LessOrEqual(t, len([]rune(chunk)), 20, "chunk '%s' parece demasiado largo", chunk)
	}
}

func TestSplitSentences_SignosExclamacionInterrogacion(t *testing.T) {
	text := "¡Hola! ¿Cómo estás? Bien."
	result := splitSentences(text, 200)
	// Con maxLen=200 todo cabe en un chunk
	require.Len(t, result, 1)
}

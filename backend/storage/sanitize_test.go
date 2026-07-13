package storage

// White-box tests para sanitize (función privada de este paquete).
// Antes vivían en handlers/sanitize_test.go apuntando a una
// sanitizeFilename que ya no existe ahí — la lógica se movió aquí
// (storage.go) y el test quedó huérfano rompiendo `go test ./...`.

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSanitize_EspaciosAGuionesBajos(t *testing.T) {
	assert.Equal(t, "mi_archivo", sanitize("mi archivo"))
}

func TestSanitize_SlashesEliminados(t *testing.T) {
	assert.Equal(t, "pathtofile", sanitize("path/to/file"))
}

func TestSanitize_BackslashEliminado(t *testing.T) {
	assert.Equal(t, "pathfile", sanitize(`path\file`))
}

func TestSanitize_PuntosDoblesEliminados(t *testing.T) {
	assert.Equal(t, "etcpasswd", sanitize("../etc/passwd"))
}

func TestSanitize_CaracteresEspeciales(t *testing.T) {
	resultado := sanitize(`file<name>|test?*.txt`)
	assert.NotContains(t, resultado, "<")
	assert.NotContains(t, resultado, ">")
	assert.NotContains(t, resultado, "|")
	assert.NotContains(t, resultado, "?")
	assert.NotContains(t, resultado, "*")
}

func TestSanitize_DosPuntos_Eliminados(t *testing.T) {
	assert.Equal(t, "namecheck", sanitize("name:check"))
}

func TestSanitize_ComillasEliminadas(t *testing.T) {
	assert.Equal(t, "file", sanitize(`"file"`))
}

func TestSanitize_NombreLimpio_SinCambios(t *testing.T) {
	assert.Equal(t, "nombre_limpio", sanitize("nombre_limpio"))
}

func TestSanitize_CombinacionCompleja(t *testing.T) {
	// Simula un nombre malicioso típico de path traversal
	resultado := sanitize("../../etc/passwd")
	assert.NotContains(t, resultado, "/")
	assert.NotContains(t, resultado, "..")
}

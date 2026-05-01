package handlers

// White-box tests para sanitizeFilename (función privada del paquete handlers).

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSanitizeFilename_EspaciosAGuionesBajos(t *testing.T) {
	assert.Equal(t, "mi_archivo", sanitizeFilename("mi archivo"))
}

func TestSanitizeFilename_SlashesEliminados(t *testing.T) {
	assert.Equal(t, "pathtofile", sanitizeFilename("path/to/file"))
}

func TestSanitizeFilename_BackslashEliminado(t *testing.T) {
	assert.Equal(t, "pathfile", sanitizeFilename(`path\file`))
}

func TestSanitizeFilename_PuntosDoblesEliminados(t *testing.T) {
	assert.Equal(t, "etcpasswd", sanitizeFilename("../etc/passwd"))
}

func TestSanitizeFilename_CaracteresEspeciales(t *testing.T) {
	resultado := sanitizeFilename(`file<name>|test?*.txt`)
	assert.NotContains(t, resultado, "<")
	assert.NotContains(t, resultado, ">")
	assert.NotContains(t, resultado, "|")
	assert.NotContains(t, resultado, "?")
	assert.NotContains(t, resultado, "*")
}

func TestSanitizeFilename_DosPuntos_Eliminados(t *testing.T) {
	assert.Equal(t, "namecheck", sanitizeFilename("name:check"))
}

func TestSanitizeFilename_ComillasEliminadas(t *testing.T) {
	assert.Equal(t, "file", sanitizeFilename(`"file"`))
}

func TestSanitizeFilename_NombreLimpio_SinCambios(t *testing.T) {
	assert.Equal(t, "nombre_limpio", sanitizeFilename("nombre_limpio"))
}

func TestSanitizeFilename_CombinacionCompleja(t *testing.T) {
	// Simula un nombre malicioso típico de path traversal
	resultado := sanitizeFilename("../../etc/passwd")
	assert.NotContains(t, resultado, "/")
	assert.NotContains(t, resultado, "..")
}

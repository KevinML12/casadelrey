package handlers

import "gorm.io/gorm"

// PDFHandler reservado para futuras exportaciones de documentos.
// Los endpoints CSV fueron removidos en mayo 2026 por requerimiento del cliente.
type PDFHandler struct {
	DB *gorm.DB
}

func NewPDFHandler(db *gorm.DB) *PDFHandler {
	return &PDFHandler{DB: db}
}

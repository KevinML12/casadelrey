package handlers

import (
	"math"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// PageMeta contiene metadatos de paginación para las respuestas de lista.
type PageMeta struct {
	Total int64 `json:"total"`
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
	Pages int   `json:"pages"`
}

// PagedResponse envuelve una lista paginada con sus metadatos.
type PagedResponse struct {
	Data interface{} `json:"data"`
	Meta PageMeta    `json:"meta"`
}

// parsePage extrae page y limit de los query params, con valores por defecto.
func parsePage(c echo.Context) (page, limit int) {
	page, _ = strconv.Atoi(c.QueryParam("page"))
	limit, _ = strconv.Atoi(c.QueryParam("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 20
	}
	return
}

// applyPage aplica OFFSET/LIMIT a una query GORM y cuenta el total.
func applyPage(q *gorm.DB, page, limit int) (offset int, countQ *gorm.DB) {
	offset = (page - 1) * limit
	return offset, q
}

// newMeta crea un PageMeta con el total y las páginas calculadas.
func newMeta(total int64, page, limit int) PageMeta {
	pages := int(math.Ceil(float64(total) / float64(limit)))
	if pages < 1 {
		pages = 1
	}
	return PageMeta{Total: total, Page: page, Limit: limit, Pages: pages}
}

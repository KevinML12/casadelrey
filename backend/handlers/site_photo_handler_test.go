package handlers_test

import (
	"casadelrey/backend/handlers"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/require"
	"net/http"
	"testing"
)

func TestSitePhotos_NewDepartmentExposesPhotoSlots(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	mock.ExpectQuery(`SELECT .* FROM "site_photos"`).WillReturnRows(sqlmock.NewRows([]string{"id", "key", "image_url"}))
	mock.ExpectQuery(`SELECT .* FROM "volunteer_areas"`).WillReturnRows(sqlmock.NewRows([]string{"id", "value", "title"}).AddRow(81, "equipo_nuevo", "Equipo nuevo"))
	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, handlers.NewSitePhotoHandler(db).GetAllSitePhotos(c))
	require.Equal(t, http.StatusOK, rec.Code)
	require.Contains(t, rec.Body.String(), `"key":"voluntariado_equipo_nuevo"`)
	require.Contains(t, rec.Body.String(), `"key":"voluntariado_equipo_nuevo_2"`)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSitePhotos_NewDepartmentAcceptsAdminPhoto(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	mock.ExpectQuery(`SELECT .* FROM "volunteer_areas"`).WithArgs("equipo_nuevo", 1).WillReturnRows(sqlmock.NewRows([]string{"id", "value", "title"}).AddRow(81, "equipo_nuevo", "Equipo nuevo"))
	mock.ExpectQuery(`SELECT .* FROM "site_photos"`).WithArgs("voluntariado_equipo_nuevo", 1).WillReturnRows(sqlmock.NewRows([]string{"id"}))
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "site_photos"`).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(82))
	mock.ExpectCommit()
	c, rec := newCtx(t, ctxOpts{method: "PUT", params: map[string]string{"key": "voluntariado_equipo_nuevo"}, body: map[string]interface{}{"image_url": "https://example.com/group.webp"}})
	require.NoError(t, handlers.NewSitePhotoHandler(db).UpdateSitePhoto(c))
	require.Equal(t, http.StatusOK, rec.Code)
	require.Contains(t, rec.Body.String(), "https://example.com/group.webp")
	require.NoError(t, mock.ExpectationsWereMet())
}

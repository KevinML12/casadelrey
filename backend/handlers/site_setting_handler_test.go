package handlers_test

import (
	"net/http"
	"testing"

	"casadelrey/backend/handlers"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// GetPublic devuelve el valor guardado; si no hay, el default de la
// llave. bank_account por defecto es "" (nunca un número inventado).
func TestSiteSettings_GetPublic_UsaDefaultsYGuardados(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSiteSettingHandler(db)

	// El admin ya puso el banco, pero no la cuenta.
	mock.ExpectQuery(`SELECT .* FROM "site_settings"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "key", "value"}).
			AddRow(1, "bank_name", "Banco Industrial"))

	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetPublic(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var out map[string]string
	decodeBody(t, rec, &out)
	assert.Equal(t, "Banco Industrial", out["bank_name"], "usa el valor guardado")
	assert.Equal(t, "", out["bank_account"], "sin cuenta puesta → vacío, nunca un número falso")
	assert.Equal(t, "Iglesia Casa del Rey", out["bank_holder"], "default cuando no hay guardado")
	assert.Empty(t, out["about_podcast_url"], "no inventar un enlace de reproducción")
}

func TestSiteSettings_PodcastRejectsExecutableLinks(t *testing.T) {
	for _, value := range []string{"javascript:alert(1)", "data:text/html,test", "/sin-destino", "https://"} {
		t.Run(value, func(t *testing.T) {
			db, mock, sqlDB := newMockDB(t)
			defer sqlDB.Close()
			h := handlers.NewSiteSettingHandler(db)
			c, rec := newCtx(t, ctxOpts{method: "PUT", params: map[string]string{"key": "about_podcast_url"}, body: map[string]interface{}{"value": value}})
			require.NoError(t, h.UpdateSetting(c))
			assert.Equal(t, http.StatusBadRequest, rec.Code)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestSiteSettings_Update_LlaveDesconocida_Retorna400(t *testing.T) {
	db, _, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSiteSettingHandler(db)

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"key": "llave_inventada"},
		body:   map[string]interface{}{"value": "x"},
	})
	require.NoError(t, h.UpdateSetting(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestSiteSettings_Update_CreaCuandoNoExiste(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSiteSettingHandler(db)

	mock.ExpectQuery(`SELECT .* FROM "site_settings"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"})) // no existe
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "site_settings"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	c, rec := newCtx(t, ctxOpts{
		method: "PUT",
		params: map[string]string{"key": "bank_account"},
		body:   map[string]interface{}{"value": "1234567890"},
	})
	require.NoError(t, h.UpdateSetting(c))
	assert.Equal(t, http.StatusOK, rec.Code)
}

// Institutional content is returned from settings, including an intentional
// empty value used by the administrator to hide a previously published block.
func TestSiteSettings_AboutContentRespectsEditsAndClearing(t *testing.T) {
	db, mock, sqlDB := newMockDB(t)
	defer sqlDB.Close()
	h := handlers.NewSiteSettingHandler(db)
	mock.ExpectQuery(`SELECT .* FROM "site_settings"`).WillReturnRows(
		sqlmock.NewRows([]string{"id", "key", "value"}).
			AddRow(1, "about_mission", "Misión editada por el administrador").
			AddRow(2, "about_podcast_schedule", ""))
	c, rec := newCtx(t, ctxOpts{method: "GET"})
	require.NoError(t, h.GetPublic(c))
	var out map[string]string
	decodeBody(t, rec, &out)
	assert.Equal(t, "Misión editada por el administrador", out["about_mission"])
	assert.Empty(t, out["about_podcast_schedule"], "clearing must not republish the default")
	assert.NotEmpty(t, out["about_intro"], "existing institutional copy remains an editable default")
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSiteSettings_SocialEditsAndHiddenProfiles(t *testing.T) {
	for _, admin := range []bool{false, true} {
		db, mock, sqlDB := newMockDB(t)
		h := handlers.NewSiteSettingHandler(db)
		mock.ExpectQuery(`SELECT .* FROM "site_settings"`).WillReturnRows(
			sqlmock.NewRows([]string{"id", "key", "value"}).AddRow(1, "social_title", "Nuestra comunidad").AddRow(2, "social_instagram_url", "").AddRow(3, "social_facebook_description", "Texto del administrador"))
		c, rec := newCtx(t, ctxOpts{method: "GET"})
		if admin {
			require.NoError(t, h.GetAll(c))
			var out []struct {
				Key, Value   string
				UsingDefault bool `json:"using_default"`
			}
			decodeBody(t, rec, &out)
			found := false
			for _, item := range out {
				if item.Key == "social_instagram_url" {
					found = true
					assert.Empty(t, item.Value)
					assert.False(t, item.UsingDefault)
				}
			}
			assert.True(t, found)
		} else {
			require.NoError(t, h.GetPublic(c))
			var out map[string]string
			decodeBody(t, rec, &out)
			assert.Empty(t, out["social_instagram_url"], "hiding a profile must not republish its default")
			assert.Equal(t, "Nuestra comunidad", out["social_title"])
			assert.Equal(t, "Texto del administrador", out["social_facebook_description"])
			assert.Empty(t, out["social_youtube_url"], "never invent a channel")
		}
		require.NoError(t, mock.ExpectationsWereMet())
		sqlDB.Close()
	}
}

func TestSiteSettings_SocialProfilesRejectPostsAndOtherHosts(t *testing.T) {
	cases := []struct{ channel, value string }{
		{"instagram", "https://www.instagram.com/p/123/"}, {"instagram", "https://instagram.com/reel/123"},
		{"instagram", "https://instagram.com.evil.example/church"}, {"instagram", "javascript:alert(1)"},
		{"facebook", "https://facebook.com/church/posts/123"}, {"facebook", "https://facebook.com/watch?v=123"},
		{"facebook", "https://facebook.com/profile.php?id=123&story_fbid=456"},
		{"tiktok", "https://tiktok.com/@church/video/123"}, {"x", "https://x.com/church/status/123"},
		{"youtube", "https://youtube.com/watch?v=123"}, {"youtube", "https://youtu.be/123"},
	}
	for _, tc := range cases {
		t.Run(tc.value, func(t *testing.T) {
			db, mock, sqlDB := newMockDB(t)
			defer sqlDB.Close()
			c, rec := newCtx(t, ctxOpts{method: "PUT", params: map[string]string{"key": "social_" + tc.channel + "_url"}, body: map[string]interface{}{"value": tc.value}})
			require.NoError(t, handlers.NewSiteSettingHandler(db).UpdateSetting(c))
			assert.Equal(t, http.StatusBadRequest, rec.Code)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestSiteSettings_SocialProfilesSaveProfilesAndClearing(t *testing.T) {
	cases := []struct{ channel, value string }{
		{"instagram", " https://www.instagram.com/ig.casadelrey/ "}, {"instagram", ""},
		{"facebook", "https://facebook.com/profile.php?id=123"}, {"facebook", "https://facebook.com/casadelreyhuehue"},
		{"tiktok", "https://tiktok.com/@leoneldeleongt"}, {"x", "https://x.com/pastorleoneli"},
		{"youtube", "https://youtube.com/@church"}, {"youtube", "https://youtube.com/channel/UC123"},
	}
	for _, tc := range cases {
		t.Run(tc.channel+tc.value, func(t *testing.T) {
			db, mock, sqlDB := newMockDB(t)
			defer sqlDB.Close()
			mock.ExpectQuery(`SELECT .* FROM "site_settings"`).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			mock.ExpectBegin()
			mock.ExpectQuery(`INSERT INTO "site_settings"`).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
			mock.ExpectCommit()
			c, rec := newCtx(t, ctxOpts{method: "PUT", params: map[string]string{"key": "social_" + tc.channel + "_url"}, body: map[string]interface{}{"value": tc.value}})
			require.NoError(t, handlers.NewSiteSettingHandler(db).UpdateSetting(c))
			assert.Equal(t, http.StatusOK, rec.Code)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

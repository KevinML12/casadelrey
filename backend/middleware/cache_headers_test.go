package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
)

func TestPublicCacheSeparatesAuthenticatedBrowserResponses(t *testing.T) {
	for _, authenticated := range []bool{false, true} {
		e := echo.New()
		request := httptest.NewRequest(http.MethodGet, "/settings", nil)
		if authenticated {
			request.Header.Set("Authorization", "Bearer test-session")
		}
		recorder := httptest.NewRecorder()
		c := e.NewContext(request, recorder)
		err := PublicCache(20)(func(c echo.Context) error { return c.JSON(200, map[string]bool{"ok": true}) })(c)
		require.NoError(t, err)
		require.Contains(t, recorder.Header().Values("Vary"), "Authorization")
		if authenticated {
			require.Equal(t, "private, no-store", recorder.Header().Get("Cache-Control"))
		} else {
			require.Contains(t, recorder.Header().Get("Cache-Control"), "public, max-age=20")
		}
	}
}

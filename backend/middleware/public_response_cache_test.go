package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
)

func TestPublicCacheCoalescesReadersAndInvalidatesWrites(t *testing.T) {
	e := echo.New()
	cache := NewPublicResponseCache()
	e.Use(cache.InvalidateAfterWrite)
	var reads atomic.Int32
	var version atomic.Int32
	e.GET("/feed", func(c echo.Context) error {
		reads.Add(1)
		time.Sleep(10 * time.Millisecond)
		return c.JSON(200, map[string]int32{"version": version.Load()})
	}, cache.Middleware(time.Minute))
	e.POST("/update", func(c echo.Context) error { version.Add(1); return c.NoContent(204) })
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			r := httptest.NewRecorder()
			e.ServeHTTP(r, httptest.NewRequest("GET", "/feed", nil))
			if r.Code != 200 {
				t.Errorf("status %d", r.Code)
			}
		}()
	}
	wg.Wait()
	if reads.Load() != 1 {
		t.Fatalf("100 concurrent readers performed %d database reads", reads.Load())
	}
	e.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("POST", "/update", nil))
	r := httptest.NewRecorder()
	e.ServeHTTP(r, httptest.NewRequest("GET", "/feed", nil))
	if reads.Load() != 2 || r.Body.String() != "{\"version\":1}\n" {
		t.Fatal("CMS write did not invalidate cached content", r.Body.String())
	}
}

func TestPublicCacheNeverSharesAuthenticatedOrFailedResponses(t *testing.T) {
	e := echo.New()
	cache := NewPublicResponseCache()
	var calls atomic.Int32
	e.GET("/feed", func(c echo.Context) error {
		n := calls.Add(1)
		if n == 1 {
			return c.JSON(503, map[string]string{"error": "retry"})
		}
		return c.JSON(200, map[string]string{"value": fmt.Sprint(n)})
	}, cache.Middleware(time.Minute))
	for _, authorization := range []string{"", "", "Bearer member", "Bearer other"} {
		r := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/feed", nil)
		req.Header.Set("Authorization", authorization)
		e.ServeHTTP(r, req)
	}
	if calls.Load() != 4 {
		t.Fatal("failed or authenticated response was cached")
	}
	r := httptest.NewRecorder()
	e.ServeHTTP(r, httptest.NewRequest(http.MethodGet, "/feed", nil))
	if r.Body.String() != "{\"value\":\"2\"}\n" {
		t.Fatal("personalized content leaked into public cache")
	}
}

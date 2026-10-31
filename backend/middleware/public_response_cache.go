package middleware

import (
	"bytes"
	"mime"
	"net/http"
	"net/http/httptest"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

type publicResponse struct {
	ready       chan struct{}
	expires     time.Time
	body        []byte
	contentType string
	generation  uint64
}

// PublicResponseCache bounds database work during bursts of anonymous readers.
// It is opt-in per public route; authenticated requests and failed responses
// bypass it. Successful writes invalidate the cache for immediate CMS updates.
type PublicResponseCache struct {
	mu         sync.Mutex
	entries    map[string]*publicResponse
	generation uint64
	bytes      int
}

func NewPublicResponseCache() *PublicResponseCache {
	return &PublicResponseCache{entries: make(map[string]*publicResponse)}
}

func (cache *PublicResponseCache) InvalidateAfterWrite(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		err := next(c)
		method := c.Request().Method
		if err == nil && method != http.MethodGet && method != http.MethodHead && method != http.MethodOptions && c.Response().Status >= 200 && c.Response().Status < 300 {
			cache.mu.Lock()
			cache.generation++
			cache.entries = make(map[string]*publicResponse)
			cache.bytes = 0
			cache.mu.Unlock()
		}
		return err
	}
}

func (cache *PublicResponseCache) Middleware(ttl time.Duration) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			request := c.Request()
			if request.Method != http.MethodGet || request.Header.Get("Authorization") != "" || request.Header.Get("Cookie") != "" {
				return next(c)
			}
			key := request.URL.Path + "?" + request.URL.Query().Encode()
			var entry *publicResponse
			for {
				cache.mu.Lock()
				entry = cache.entries[key]
				if entry != nil {
					ready := entry.ready
					if ready != nil {
						cache.mu.Unlock()
						select {
						case <-ready:
							continue
						case <-request.Context().Done():
							return request.Context().Err()
						}
					}
					if time.Now().Before(entry.expires) {
						body, contentType := entry.body, entry.contentType
						cache.mu.Unlock()
						c.Response().Header().Set("X-Response-Cache", "HIT")
						return c.Blob(http.StatusOK, contentType, body)
					}
				}
				if entry != nil {
					cache.bytes -= len(entry.body)
				}
				if len(cache.entries) >= 128 {
					cache.entries = make(map[string]*publicResponse)
					cache.bytes = 0
					cache.generation++
				}
				entry = &publicResponse{ready: make(chan struct{}), generation: cache.generation}
				cache.entries[key] = entry
				cache.mu.Unlock()
				break
			}
			c.Response().Header().Set("X-Response-Cache", "MISS")
			original := c.Response()
			recorder := httptest.NewRecorder()
			c.SetResponse(echo.NewResponse(recorder, c.Echo()))
			// Always release waiters, including if the handler panics.
			defer func() {
				c.SetResponse(original)
				cache.mu.Lock()
				if entry.ready != nil {
					close(entry.ready)
					entry.ready = nil
				}
				if entry.expires.IsZero() && cache.entries[key] == entry {
					delete(cache.entries, key)
				}
				cache.mu.Unlock()
			}()
			err := next(c)
			c.SetResponse(original)
			if err != nil {
				return err
			}
			body := bytes.Clone(recorder.Body.Bytes())
			mediaType, _, _ := mime.ParseMediaType(recorder.Header().Get("Content-Type"))
			cache.mu.Lock()
			if recorder.Code == http.StatusOK && len(body) <= 512<<10 && cache.bytes+len(body) <= 16<<20 && recorder.Header().Get("Set-Cookie") == "" && mediaType == echo.MIMEApplicationJSON && entry.generation == cache.generation && cache.entries[key] == entry {
				entry.body, entry.contentType, entry.expires = body, recorder.Header().Get("Content-Type"), time.Now().Add(ttl)
				cache.bytes += len(body)
			}
			cache.mu.Unlock()
			for key, values := range recorder.Header() {
				original.Header()[key] = values
			}
			return c.Blob(recorder.Code, recorder.Header().Get("Content-Type"), body)
		}
	}
}

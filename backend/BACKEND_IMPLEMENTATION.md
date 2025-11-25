# Backend - Ejemplos de Implementación

## Estructura de Endpoints Requeridos

### 1. Instagram Feed Endpoint

**Opción A: Datos almacenados en BD (Recomendado para inicio)**

```go
// backend/models/instagram_post.go
package models

import "time"

type InstagramPost struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    MediaURL  string    `json:"media_url" gorm:"not null"`
    Caption   string    `json:"caption"`
    Permalink string    `json:"permalink" gorm:"not null"`
    Timestamp time.Time `json:"timestamp"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

```go
// backend/handlers/instagram.go
package handlers

import (
    "net/http"
    "github.com/labstack/echo/v4"
    "gorm.io/gorm"
)

type InstagramHandler struct {
    DB *gorm.DB
}

func NewInstagramHandler(db *gorm.DB) *InstagramHandler {
    return &InstagramHandler{DB: db}
}

// GetFeed - Obtener últimas 12 fotos de Instagram
func (h *InstagramHandler) GetFeed(c echo.Context) error {
    var posts []InstagramPost
    
    // Obtener últimas 12 fotos ordenadas por timestamp
    if err := h.DB.
        Order("timestamp DESC").
        Limit(12).
        Find(&posts).Error; err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{
            "error": "Error al obtener feed de Instagram",
        })
    }
    
    return c.JSON(http.StatusOK, posts)
}
```

```go
// backend/main.go - Registrar ruta
func main() {
    // ... configuración existente ...
    
    // Instagram routes
    instagramHandler := handlers.NewInstagramHandler(db)
    e.GET("/api/instagram/feed", instagramHandler.GetFeed)
    
    // ... resto del código ...
}
```

**Opción B: Integración con Instagram Graph API**

```go
// backend/services/instagram_service.go
package services

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type InstagramService struct {
    AccessToken string
    UserID      string
}

type InstagramMediaResponse struct {
    Data []struct {
        ID        string `json:"id"`
        MediaURL  string `json:"media_url"`
        Caption   string `json:"caption"`
        Permalink string `json:"permalink"`
        Timestamp string `json:"timestamp"`
    } `json:"data"`
}

func NewInstagramService() *InstagramService {
    return &InstagramService{
        AccessToken: os.Getenv("INSTAGRAM_ACCESS_TOKEN"),
        UserID:      os.Getenv("INSTAGRAM_USER_ID"),
    }
}

func (s *InstagramService) GetRecentMedia() ([]InstagramPost, error) {
    url := fmt.Sprintf(
        "https://graph.instagram.com/%s/media?fields=id,media_url,caption,permalink,timestamp&access_token=%s&limit=12",
        s.UserID,
        s.AccessToken,
    )
    
    resp, err := http.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var mediaResponse InstagramMediaResponse
    if err := json.Unmarshal(body, &mediaResponse); err != nil {
        return nil, err
    }
    
    // Convertir a modelo interno
    posts := make([]InstagramPost, len(mediaResponse.Data))
    for i, media := range mediaResponse.Data {
        posts[i] = InstagramPost{
            MediaURL:  media.MediaURL,
            Caption:   media.Caption,
            Permalink: media.Permalink,
            // Convertir timestamp...
        }
    }
    
    return posts, nil
}
```

---

### 2. YouTube Latest Endpoint

**Opción A: Datos almacenados en BD**

```go
// backend/models/youtube_video.go
package models

import "time"

type YouTubeVideo struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    VideoID     string    `json:"video_id" gorm:"unique;not null"`
    EmbedURL    string    `json:"embed_url" gorm:"not null"`
    Title       string    `json:"title" gorm:"not null"`
    Description string    `json:"description"`
    PublishedAt time.Time `json:"published_at"`
    IsFeatured  bool      `json:"is_featured" gorm:"default:false"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

```go
// backend/handlers/youtube.go
package handlers

import (
    "net/http"
    "github.com/labstack/echo/v4"
    "gorm.io/gorm"
)

type YouTubeHandler struct {
    DB *gorm.DB
}

func NewYouTubeHandler(db *gorm.DB) *YouTubeHandler {
    return &YouTubeHandler{DB: db}
}

// GetLatest - Obtener el video más reciente o destacado
func (h *YouTubeHandler) GetLatest(c echo.Context) error {
    var video YouTubeVideo
    
    // Primero buscar video destacado
    if err := h.DB.Where("is_featured = ?", true).First(&video).Error; err != nil {
        // Si no hay destacado, obtener el más reciente
        if err := h.DB.Order("published_at DESC").First(&video).Error; err != nil {
            return c.JSON(http.StatusNotFound, map[string]string{
                "error": "No se encontraron videos",
            })
        }
    }
    
    // Asegurar que embed_url esté presente
    if video.EmbedURL == "" && video.VideoID != "" {
        video.EmbedURL = fmt.Sprintf("https://www.youtube.com/embed/%s", video.VideoID)
    }
    
    return c.JSON(http.StatusOK, video)
}
```

```go
// backend/main.go - Registrar ruta
func main() {
    // ... configuración existente ...
    
    // YouTube routes
    youtubeHandler := handlers.NewYouTubeHandler(db)
    e.GET("/api/youtube/latest", youtubeHandler.GetLatest)
    
    // ... resto del código ...
}
```

**Opción B: Integración con YouTube Data API v3**

```go
// backend/services/youtube_service.go
package services

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type YouTubeService struct {
    APIKey    string
    ChannelID string
}

type YouTubeSearchResponse struct {
    Items []struct {
        ID struct {
            VideoID string `json:"videoId"`
        } `json:"id"`
        Snippet struct {
            Title       string `json:"title"`
            Description string `json:"description"`
            PublishedAt string `json:"publishedAt"`
        } `json:"snippet"`
    } `json:"items"`
}

func NewYouTubeService() *YouTubeService {
    return &YouTubeService{
        APIKey:    os.Getenv("YOUTUBE_API_KEY"),
        ChannelID: os.Getenv("YOUTUBE_CHANNEL_ID"),
    }
}

func (s *YouTubeService) GetLatestVideo() (*YouTubeVideo, error) {
    url := fmt.Sprintf(
        "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=%s&order=date&type=video&maxResults=1&key=%s",
        s.ChannelID,
        s.APIKey,
    )
    
    resp, err := http.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var searchResponse YouTubeSearchResponse
    if err := json.Unmarshal(body, &searchResponse); err != nil {
        return nil, err
    }
    
    if len(searchResponse.Items) == 0 {
        return nil, fmt.Errorf("no videos found")
    }
    
    item := searchResponse.Items[0]
    video := &YouTubeVideo{
        VideoID:     item.ID.VideoID,
        EmbedURL:    fmt.Sprintf("https://www.youtube.com/embed/%s", item.ID.VideoID),
        Title:       item.Snippet.Title,
        Description: item.Snippet.Description,
        // Convertir PublishedAt...
    }
    
    return video, nil
}
```

---

### 3. Actualizar Modelos Existentes

**Post Model con ImageURL**

```go
// backend/models/post.go
package models

import (
    "time"
    "gorm.io/gorm"
)

type Post struct {
    ID          uint           `json:"id" gorm:"primaryKey"`
    Title       string         `json:"title" gorm:"not null"`
    Slug        string         `json:"slug" gorm:"unique;not null"`
    Content     string         `json:"content" gorm:"type:text"`
    Excerpt     string         `json:"excerpt"`
    ImageURL    string         `json:"imageUrl" gorm:"column:image_url"` // ← Nuevo campo
    Status      string         `json:"status" gorm:"default:'draft'"`
    AuthorID    uint           `json:"author_id"`
    Author      User           `json:"author" gorm:"foreignKey:AuthorID"`
    CreatedAt   time.Time      `json:"createdAt"`
    UpdatedAt   time.Time      `json:"updatedAt"`
    DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName especifica el nombre de la tabla
func (Post) TableName() string {
    return "posts"
}
```

**Event Model con ImageURL**

```go
// backend/models/event.go
package models

import (
    "time"
    "gorm.io/gorm"
)

type Event struct {
    ID          uint           `json:"id" gorm:"primaryKey"`
    Title       string         `json:"title" gorm:"not null"`
    Description string         `json:"description" gorm:"type:text"`
    ImageURL    string         `json:"imageUrl" gorm:"column:image_url"` // ← Nuevo campo
    Date        time.Time      `json:"date" gorm:"not null"`
    Location    string         `json:"location"`
    CreatedAt   time.Time      `json:"createdAt"`
    UpdatedAt   time.Time      `json:"updatedAt"`
    DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName especifica el nombre de la tabla
func (Event) TableName() string {
    return "events"
}
```

---

### 4. Migraciones de Base de Datos

**Crear tabla instagram_posts**

```sql
CREATE TABLE instagram_posts (
    id SERIAL PRIMARY KEY,
    media_url VARCHAR(500) NOT NULL,
    caption TEXT,
    permalink VARCHAR(500) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instagram_posts_timestamp ON instagram_posts(timestamp DESC);
```

**Crear tabla youtube_videos**

```sql
CREATE TABLE youtube_videos (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(100) UNIQUE NOT NULL,
    embed_url VARCHAR(500) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    published_at TIMESTAMP NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_youtube_videos_published ON youtube_videos(published_at DESC);
CREATE INDEX idx_youtube_videos_featured ON youtube_videos(is_featured);
```

**Agregar image_url a posts**

```sql
ALTER TABLE posts ADD COLUMN image_url VARCHAR(500);
CREATE INDEX idx_posts_image_url ON posts(image_url);
```

**Agregar image_url a events**

```sql
ALTER TABLE events ADD COLUMN image_url VARCHAR(500);
CREATE INDEX idx_events_image_url ON events(image_url);
```

**Migración en Go con GORM**

```go
// backend/main.go o migrations/migrate.go
func runMigrations(db *gorm.DB) {
    // Auto migrar modelos
    db.AutoMigrate(
        &models.Post{},
        &models.Event{},
        &models.InstagramPost{},
        &models.YouTubeVideo{},
    )
    
    log.Println("Migraciones completadas")
}
```

---

### 5. Seeds de Datos de Ejemplo

**Seed para Instagram**

```go
// backend/seeds/instagram_seed.go
package seeds

import (
    "time"
    "gorm.io/gorm"
)

func SeedInstagramPosts(db *gorm.DB) {
    posts := []InstagramPost{
        {
            MediaURL:  "https://picsum.photos/seed/church1/800/600",
            Caption:   "Servicio dominical increíble! 🙏",
            Permalink: "https://www.instagram.com/p/example1",
            Timestamp: time.Now().AddDate(0, 0, -1),
        },
        {
            MediaURL:  "https://picsum.photos/seed/church2/800/600",
            Caption:   "Alabanza y adoración 🎵",
            Permalink: "https://www.instagram.com/p/example2",
            Timestamp: time.Now().AddDate(0, 0, -2),
        },
        // ... más posts
    }
    
    for _, post := range posts {
        db.Create(&post)
    }
}
```

**Seed para YouTube**

```go
// backend/seeds/youtube_seed.go
package seeds

import (
    "time"
    "gorm.io/gorm"
)

func SeedYouTubeVideos(db *gorm.DB) {
    videos := []YouTubeVideo{
        {
            VideoID:     "dQw4w9WgXcQ",
            EmbedURL:    "https://www.youtube.com/embed/dQw4w9WgXcQ",
            Title:       "Último Sermón - El Poder de la Fe",
            Description: "En este mensaje hablamos sobre...",
            PublishedAt: time.Now().AddDate(0, 0, -3),
            IsFeatured:  true,
        },
        // ... más videos
    }
    
    for _, video := range videos {
        db.Create(&video)
    }
}
```

---

### 6. Variables de Entorno

**Agregar a .env**

```bash
# Instagram Graph API (Opcional)
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_USER_ID=your_user_id_here

# YouTube Data API v3 (Opcional)
YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_CHANNEL_ID=your_channel_id_here

# CDN/Storage para imágenes (Recomendado)
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

---

### 7. CORS Configuration

```go
// backend/main.go
import "github.com/labstack/echo/v4/middleware"

func main() {
    e := echo.New()
    
    // CORS middleware
    e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
        AllowOrigins: []string{
            "http://localhost:5173",
            "https://tu-dominio.com",
        },
        AllowMethods: []string{
            http.MethodGet,
            http.MethodPost,
            http.MethodPut,
            http.MethodDelete,
        },
        AllowHeaders: []string{
            echo.HeaderOrigin,
            echo.HeaderContentType,
            echo.HeaderAccept,
            echo.HeaderAuthorization,
        },
    }))
    
    // ... resto de la configuración
}
```

---

## Orden de Implementación Recomendado

### Fase 1: Estructura Básica
1. ✅ Crear modelos `InstagramPost` y `YouTubeVideo`
2. ✅ Ejecutar migraciones
3. ✅ Crear seeds con datos de ejemplo
4. ✅ Actualizar modelos `Post` y `Event` con `image_url`

### Fase 2: Endpoints Básicos (BD)
5. ✅ Implementar `GET /api/instagram/feed`
6. ✅ Implementar `GET /api/youtube/latest`
7. ✅ Probar con Postman/curl
8. ✅ Verificar CORS

### Fase 3: Integración Frontend
9. ✅ Conectar frontend con endpoints
10. ✅ Probar GalleryGrid con datos reales
11. ✅ Probar YouTubeFeatured con datos reales
12. ✅ Validar responsive design

### Fase 4: APIs Externas (Opcional)
13. ⬜ Integrar Instagram Graph API
14. ⬜ Integrar YouTube Data API v3
15. ⬜ Implementar cache de respuestas
16. ⬜ Configurar webhooks para actualizaciones

---

## Testing con cURL

```bash
# Test Instagram Feed
curl http://localhost:8080/api/instagram/feed

# Test YouTube Latest
curl http://localhost:8080/api/youtube/latest

# Test Posts con imageUrl
curl http://localhost:8080/api/posts

# Test Events con imageUrl
curl http://localhost:8080/api/events
```

---

## Referencias

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api/)
- [YouTube Data API v3 Docs](https://developers.google.com/youtube/v3)
- [GORM Documentation](https://gorm.io/docs/)
- [Echo Framework](https://echo.labstack.com/)

---

**Nota:** Recomiendo empezar con datos almacenados en BD (Opción A) para cada endpoint. Las integraciones con APIs externas (Opción B) pueden agregarse más adelante cuando el flujo básico esté funcionando.

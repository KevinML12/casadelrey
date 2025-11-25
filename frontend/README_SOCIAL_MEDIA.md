# Integración de Redes Sociales - Documentación

## Componentes Creados

### 1. `GalleryGrid.jsx`
**Ubicación:** `frontend/src/components/SocialMedia/GalleryGrid.jsx`

**Propósito:** Galería de fotos de Instagram integrada con React Query.

**Características:**
- Obtiene fotos desde el endpoint `/api/instagram/feed`
- Muestra grid de 6 imágenes (adaptable a mobile/tablet/desktop)
- Cada imagen es un enlace directo a la publicación de Instagram
- Se abre en nueva pestaña con `target="_blank"` y `rel="noopener noreferrer"`
- Skeleton loaders durante carga
- Animaciones con framer-motion
- Manejo de errores gracioso

**Uso:**
```jsx
import GalleryGrid from '../components/SocialMedia/GalleryGrid';

// En cualquier página
<GalleryGrid />
```

**API esperada:**
```json
GET /api/instagram/feed
Response: [
  {
    "id": "instagram_post_id",
    "media_url": "https://...",
    "image_url": "https://...",
    "caption": "Descripción de la foto",
    "permalink": "https://instagram.com/p/...",
    "link": "https://instagram.com/p/..."
  }
]
```

---

### 2. `YouTubeFeatured.jsx`
**Ubicación:** `frontend/src/components/SocialMedia/YouTubeFeatured.jsx`

**Propósito:** Muestra el último video de YouTube en un iframe embebido.

**Características:**
- Obtiene el video más reciente desde `/api/youtube/latest`
- Usa componentes Card de shadcn/ui para diseño profesional
- Iframe responsivo con aspect-ratio 16:9
- Soporte para `embed_url` o construcción desde `video_id`
- Muestra título, descripción y fecha de publicación
- Skeleton loader durante carga
- Manejo de errores

**Uso:**
```jsx
import YouTubeFeatured from '../components/SocialMedia/YouTubeFeatured';

<YouTubeFeatured />
```

**API esperada:**
```json
GET /api/youtube/latest
Response: {
  "video_id": "dQw4w9WgXcQ",
  "embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "title": "Título del video",
  "description": "Descripción del video",
  "published_at": "2024-01-15T10:00:00Z"
}
```

---

### 3. `SocialMediaFeed.jsx`
**Ubicación:** `frontend/src/components/SocialMedia/SocialMediaFeed.jsx`

**Propósito:** Componente contenedor que orquesta YouTube y Instagram.

**Características:**
- Props opcionales para controlar qué mostrar: `showYouTube`, `showInstagram`
- Integra `YouTubeFeatured` y `GalleryGrid`
- Animaciones coordinadas con delays

**Uso:**
```jsx
import SocialMediaFeed from '../components/SocialMedia/SocialMediaFeed';

// Mostrar ambos
<SocialMediaFeed />

// Solo YouTube
<SocialMediaFeed showInstagram={false} />

// Solo Instagram
<SocialMediaFeed showYouTube={false} />
```

---

## Integraciones Realizadas

### `MultimediaSection.jsx` (Refactorizado)
**Cambios:**
- ✅ Migrado a React Query con `useQuery`
- ✅ Integrado `YouTubeFeatured` como video principal destacado
- ✅ Tabs de shadcn/ui para categorías (predicas, música, seminarios)
- ✅ Grid de videos secundarios usando `YouTubeCard`
- ✅ Endpoint: `GET /api/multimedia?filter=${activeTab}`

**Estructura:**
```
┌─────────────────────────────────────┐
│   Video Destacado (YouTubeFeatured) │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│   Tabs: Predicas | Música | Sem.   │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│   Grid de Videos (YouTubeCard x3)   │
└─────────────────────────────────────┘
```

---

### `Home.jsx` (Actualizado)
**Cambios:**
- ✅ Reemplazado `Galeria` con `GalleryGrid`
- ✅ Importa desde `components/SocialMedia/GalleryGrid`
- ✅ Mantiene todas las demás secciones intactas

---

### `PostCard.jsx` (Refactorizado)
**Cambios:**
- ✅ Usa `post.imageUrl` desde la base de datos
- ✅ Fallbacks: `post.imageUrl || post.image_url || post.image`
- ✅ Elimina dependencia de assets locales

**Propiedades esperadas:**
```javascript
post = {
  imageUrl: "https://...",  // PRINCIPAL - desde BD
  title: "...",
  excerpt: "...",
  date: "...",
  slug: "..."
}
```

---

### `EventCard.jsx` (Refactorizado)
**Cambios:**
- ✅ Usa `event.imageUrl` desde la base de datos
- ✅ Fallbacks: `event.imageUrl || event.image_url || event.image`
- ✅ Elimina dependencia de assets locales

**Propiedades esperadas:**
```javascript
event = {
  imageUrl: "https://...",  // PRINCIPAL - desde BD
  title: "...",
  description: "...",
  date: "..."
}
```

---

## Configuración React Query

**queryKey patterns:**
- `['instagram-feed']` - Feed de Instagram
- `['youtube-latest']` - Último video de YouTube
- `['multimedia', activeTab]` - Videos por categoría

**Configuraciones:**
- `staleTime`: 5-15 minutos (contenido social cambia lentamente)
- `retry`: 1-2 intentos
- Cache automático por React Query

---

## Endpoints del Backend Requeridos

### 1. Instagram Feed
```
GET /api/instagram/feed
```
**Response:**
```json
[
  {
    "id": "string",
    "media_url": "string (URL de imagen)",
    "caption": "string (opcional)",
    "permalink": "string (URL a Instagram)",
    "timestamp": "ISO8601 date"
  }
]
```

### 2. YouTube Latest
```
GET /api/youtube/latest
```
**Response:**
```json
{
  "video_id": "string",
  "embed_url": "string (opcional, se construye si no existe)",
  "title": "string",
  "description": "string (opcional)",
  "published_at": "ISO8601 date (opcional)"
}
```

### 3. Multimedia (existente)
```
GET /api/multimedia?filter={predicas|musica|seminarios}
```
**Response:**
```json
[
  {
    "id": "string",
    "title": "string",
    "video_id": "string",
    "embed_url": "string",
    "thumbnail": "string (opcional)"
  }
]
```

---

## Conectividad General

### Flujo de Imágenes en la Aplicación

```
┌──────────────┐
│  Base de     │
│  Datos       │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Backend API │
│  (Go/Echo)   │
└──────┬───────┘
       │
       ↓ JSON con imageUrl
┌──────────────┐
│  React Query │
│  (Frontend)  │
└──────┬───────┘
       │
       ├──→ PostCard.jsx (usa post.imageUrl)
       ├──→ EventCard.jsx (usa event.imageUrl)
       ├──→ GalleryGrid.jsx (usa photo.media_url)
       └──→ YouTubeFeatured.jsx (usa video.embed_url)
```

**Principio clave:** TODAS las URLs de imágenes vienen de la base de datos a través del backend. NO usar assets locales del proyecto excepto para:
- Logo de la iglesia (fallback)
- Iconos de UI
- Placeholders durante carga

---

## Validación de Integración

### Checklist:
- ✅ `GalleryGrid` reemplaza `Galeria` en `Home.jsx`
- ✅ `YouTubeFeatured` integrado en `MultimediaSection.jsx`
- ✅ `PostCard` usa `post.imageUrl` (no assets locales)
- ✅ `EventCard` usa `event.imageUrl` (no assets locales)
- ✅ Todos los enlaces externos usan `target="_blank"` y `rel="noopener noreferrer"`
- ✅ React Query configurado con cache apropiado
- ✅ Skeleton loaders en todos los componentes
- ✅ Manejo de errores implementado

---

## Próximos Pasos (Backend)

1. **Implementar endpoint Instagram:**
   ```go
   GET /api/instagram/feed
   // Integrar con Instagram Graph API o almacenar en BD
   ```

2. **Implementar endpoint YouTube:**
   ```go
   GET /api/youtube/latest
   // Integrar con YouTube Data API v3 o almacenar en BD
   ```

3. **Actualizar modelos de Post y Event:**
   ```go
   type Post struct {
       ID       uint   `json:"id"`
       Title    string `json:"title"`
       ImageURL string `json:"imageUrl" gorm:"column:image_url"` // ← Campo crítico
       // ... otros campos
   }
   
   type Event struct {
       ID       uint   `json:"id"`
       Title    string `json:"title"`
       ImageURL string `json:"imageUrl" gorm:"column:image_url"` // ← Campo crítico
       // ... otros campos
   }
   ```

4. **Migración de base de datos:**
   - Agregar columna `image_url` a tablas `posts` y `events` si no existe
   - Migrar URLs existentes de assets locales a URLs externas (CDN/storage)

---

## Consideraciones de Seguridad

1. **Enlaces externos:**
   - Siempre usar `rel="noopener noreferrer"` con `target="_blank"`
   - Evita ataques de "tabnabbing"

2. **Validación de URLs:**
   - Backend debe validar que imageUrl/media_url sean URLs válidas
   - Considerar whitelist de dominios permitidos

3. **Rate Limiting:**
   - Implementar cache en backend para APIs de redes sociales
   - Evitar exceder límites de Instagram/YouTube APIs

4. **CORS:**
   - Configurar CORS apropiadamente para endpoints de media

---

## Actualización: Noviembre 2025
Integración completa de redes sociales implementada con React Query, shadcn/ui, y arquitectura de datos centralizada desde backend.

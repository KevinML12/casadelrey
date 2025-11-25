# API de Blog - Documentación

## Modelo de Post

```go
type Post struct {
    gorm.Model          // ID, CreatedAt, UpdatedAt, DeletedAt
    Title    string     // Título del post
    Slug     string     // Slug único para URL (ej: "primer-post")
    Content  string     // Contenido HTML/Markdown del post
    AuthorID uint       // ID del usuario autor
    Status   string     // Estado: "draft" o "published"
    Author   User       // Relación con el modelo User
}
```

## Rutas Públicas (sin autenticación)

### 1. Listar Posts Publicados
```
GET /api/blog/posts
```

**Descripción:** Devuelve todos los posts con status "published", ordenados por fecha de creación (más recientes primero).

**Respuesta exitosa (200 OK):**
```json
[
  {
    "ID": 1,
    "CreatedAt": "2025-11-15T10:00:00Z",
    "UpdatedAt": "2025-11-15T10:00:00Z",
    "DeletedAt": null,
    "title": "Primer Post de la Iglesia",
    "slug": "primer-post-iglesia",
    "content": "<p>Contenido completo del post...</p>",
    "author_id": 1,
    "status": "published",
    "author": {
      "ID": 1,
      "name": "Pastor Juan",
      "email": "pastor@casadelrey.com",
      "role": "admin"
    }
  }
]
```

**Ejemplo con cURL:**
```bash
curl http://localhost:8080/api/blog/posts
```

### 2. Obtener Post por Slug
```
GET /api/blog/posts/:slug
```

**Descripción:** Devuelve un solo post publicado identificado por su slug único.

**Parámetros de ruta:**
- `slug` (string): El slug único del post

**Respuesta exitosa (200 OK):**
```json
{
  "ID": 1,
  "CreatedAt": "2025-11-15T10:00:00Z",
  "UpdatedAt": "2025-11-15T10:00:00Z",
  "DeletedAt": null,
  "title": "Primer Post de la Iglesia",
  "slug": "primer-post-iglesia",
  "content": "<p>Contenido completo del post...</p>",
  "author_id": 1,
  "status": "published",
  "author": {
    "ID": 1,
    "name": "Pastor Juan",
    "email": "pastor@casadelrey.com",
    "role": "admin"
  }
}
```

**Respuesta de error (404 Not Found):**
```json
{
  "error": "Post no encontrado"
}
```

**Ejemplo con cURL:**
```bash
curl http://localhost:8080/api/blog/posts/primer-post-iglesia
```

## Rutas de Administrador (requieren autenticación + rol admin)

### 3. Crear Nuevo Post
```
POST /api/admin/blog
Authorization: Bearer <token>
```

**Descripción:** Crea un nuevo post. Requiere autenticación y rol de administrador.

**Headers requeridos:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body de la petición:**
```json
{
  "title": "Título del Post",
  "slug": "titulo-del-post",
  "content": "<p>Contenido del post en HTML o Markdown</p>",
  "status": "draft"  // "draft" o "published"
}
```

**Validaciones:**
- `title`: Requerido
- `slug`: Requerido, debe ser único
- `content`: Requerido
- `status`: Requerido, debe ser "draft" o "published"

**Respuesta exitosa (201 Created):**
```json
{
  "message": "Post creado exitosamente",
  "post": {
    "ID": 2,
    "CreatedAt": "2025-11-15T11:00:00Z",
    "UpdatedAt": "2025-11-15T11:00:00Z",
    "DeletedAt": null,
    "title": "Título del Post",
    "slug": "titulo-del-post",
    "content": "<p>Contenido del post en HTML o Markdown</p>",
    "author_id": 1,
    "status": "draft",
    "author": {
      "ID": 1,
      "name": "Pastor Juan",
      "email": "pastor@casadelrey.com",
      "role": "admin"
    }
  }
}
```

**Respuestas de error:**

400 Bad Request - Datos inválidos:
```json
{
  "error": "Título, slug y contenido son requeridos"
}
```

400 Bad Request - Slug duplicado:
```json
{
  "error": "Ya existe un post con ese slug"
}
```

401 Unauthorized - Sin autenticación:
```json
{
  "error": "Token de autorización requerido"
}
```

403 Forbidden - No es admin:
```json
{
  "error": "Acceso denegado. Se requiere rol de administrador"
}
```

**Ejemplo con cURL:**
```bash
TOKEN="tu-token-jwt-aqui"

curl -X POST http://localhost:8080/api/admin/blog \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nuevo Estudio Bíblico",
    "slug": "nuevo-estudio-biblico",
    "content": "<h2>Introducción</h2><p>Este es un estudio sobre...</p>",
    "status": "published"
  }'
```

### 4. Actualizar Post Existente
```
PUT /api/admin/blog/:id
Authorization: Bearer <token>
```

**Descripción:** Actualiza un post existente. Requiere autenticación y rol de administrador.

**Parámetros de ruta:**
- `id` (uint): El ID del post a actualizar

**Headers requeridos:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body de la petición (todos los campos son opcionales):**
```json
{
  "title": "Nuevo Título",
  "slug": "nuevo-slug",
  "content": "<p>Contenido actualizado</p>",
  "status": "published"
}
```

**Notas:**
- Solo se actualizan los campos proporcionados
- Si se cambia el slug, se verifica que no exista otro post con ese slug
- El `author_id` no se puede cambiar

**Respuesta exitosa (200 OK):**
```json
{
  "message": "Post actualizado exitosamente",
  "post": {
    "ID": 2,
    "CreatedAt": "2025-11-15T11:00:00Z",
    "UpdatedAt": "2025-11-15T12:00:00Z",
    "DeletedAt": null,
    "title": "Nuevo Título",
    "slug": "nuevo-slug",
    "content": "<p>Contenido actualizado</p>",
    "author_id": 1,
    "status": "published",
    "author": {
      "ID": 1,
      "name": "Pastor Juan",
      "email": "pastor@casadelrey.com",
      "role": "admin"
    }
  }
}
```

**Respuestas de error:**

404 Not Found - Post no existe:
```json
{
  "error": "Post no encontrado"
}
```

400 Bad Request - Slug duplicado:
```json
{
  "error": "Ya existe otro post con ese slug"
}
```

401 Unauthorized - Sin autenticación:
```json
{
  "error": "Token de autorización requerido"
}
```

403 Forbidden - No es admin:
```json
{
  "error": "Acceso denegado. Se requiere rol de administrador"
}
```

**Ejemplo con cURL:**
```bash
TOKEN="tu-token-jwt-aqui"

curl -X PUT http://localhost:8080/api/admin/blog/2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published"
  }'
```

## Flujo de Trabajo Recomendado

### Crear y Publicar un Post

1. **Crear el post como borrador:**
```bash
POST /api/admin/blog
{
  "title": "Mi Nuevo Post",
  "slug": "mi-nuevo-post",
  "content": "<p>Contenido...</p>",
  "status": "draft"
}
```

2. **Revisar y editar:**
```bash
PUT /api/admin/blog/3
{
  "content": "<p>Contenido revisado y mejorado...</p>"
}
```

3. **Publicar cuando esté listo:**
```bash
PUT /api/admin/blog/3
{
  "status": "published"
}
```

4. **El post ahora aparecerá en:**
- `GET /api/blog/posts` (listado público)
- `GET /api/blog/posts/mi-nuevo-post` (vista individual)

### Despublicar un Post

Si necesitas quitar un post de la vista pública sin eliminarlo:

```bash
PUT /api/admin/blog/3
{
  "status": "draft"
}
```

## Ejemplos de Integración con Frontend (React)

### Función para listar posts públicos:
```javascript
// src/utils/blogApi.js
const API_URL = 'http://localhost:8080/api';

export const getAllPosts = async () => {
  const response = await fetch(`${API_URL}/blog/posts`);
  if (!response.ok) throw new Error('Error al obtener posts');
  return response.json();
};

export const getPostBySlug = async (slug) => {
  const response = await fetch(`${API_URL}/blog/posts/${slug}`);
  if (!response.ok) throw new Error('Post no encontrado');
  return response.json();
};
```

### Función para crear post (admin):
```javascript
// src/utils/adminBlogApi.js
const API_URL = 'http://localhost:8080/api';

const getToken = () => localStorage.getItem('token');

export const createPost = async (postData) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/admin/blog`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(postData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear post');
  }
  
  return response.json();
};

export const updatePost = async (postId, postData) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/admin/blog/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(postData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar post');
  }
  
  return response.json();
};
```

## Consideraciones de Seguridad

✅ **Implementado:**
- Solo usuarios con rol "admin" pueden crear/actualizar posts
- Los posts en estado "draft" NO son visibles en las rutas públicas
- El slug debe ser único para evitar conflictos
- El autor del post se establece automáticamente desde el token JWT

⚠️ **Recomendaciones adicionales:**
- Sanitizar el contenido HTML antes de guardarlo para prevenir XSS
- Implementar paginación en `GET /api/blog/posts` para mejor rendimiento
- Agregar validación de longitud máxima para title y content
- Considerar agregar campos adicionales: excerpt, featured_image, tags, categories
- Implementar búsqueda de posts por título o contenido
- Agregar ruta para eliminar posts (soft delete con GORM)

## Base de Datos

La tabla `posts` se crea automáticamente con la migración:

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
```

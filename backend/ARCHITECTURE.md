# Estructura Modular del Backend

Este documento explica la nueva estructura modular del backend de Casa del Rey.

## 📁 Estructura de Directorios

```
backend/
├── main.go                 # Punto de entrada simplificado
├── database/
│   └── database.go        # Conexión y migración de BD
├── models/
│   └── models.go          # Modelos de datos (User, Petition, Donation, Post)
├── handlers/
│   ├── petition.handler.go    # Handler de peticiones
│   ├── donation.handler.go    # Handler de donaciones
│   ├── auth.handler.go        # Handler de autenticación
│   └── blog.handler.go        # Handler de blog
├── middleware/
│   └── auth.go            # Middlewares de autenticación
└── router/
    └── router.go          # Configuración de rutas
```

## 📦 Paquetes

### `main.go`
Punto de entrada simplificado que:
1. Carga variables de entorno (`.env`)
2. Inicializa la base de datos
3. Crea la instancia de Echo
4. Configura middlewares (Logger, Recover, CORS)
5. Configura las rutas
6. Inicia el servidor

**Código simplificado:**
```go
func main() {
    godotenv.Load()
    database.InitDB(&models.User{}, &models.Petition{}, &models.Donation{}, &models.Post{})
    e := echo.New()
    // Configurar middlewares
    router.SetupRoutes(e, database.DB)
    e.Start(":" + port)
}
```

### `database/` - Gestión de Base de Datos

**`database.go`**
- `var DB *gorm.DB` - Variable global de la conexión a BD
- `InitDB(models ...interface{})` - Inicializa conexión y ejecuta migraciones

**Responsabilidades:**
- Cargar variables de entorno
- Conectar a PostgreSQL
- Ejecutar `AutoMigrate` para todos los modelos
- Gestionar el ciclo de vida de la conexión

### `models/` - Modelos de Datos

**`models.go`**
Define todas las estructuras de datos:
- `User` - Usuarios del sistema
- `Petition` - Peticiones de oración/contacto
- `Donation` - Donaciones
- `Post` - Posts del blog

**Características:**
- Usa `gorm.Model` para campos automáticos (ID, timestamps, soft delete)
- Validaciones con tags `gorm` y `validate`
- Relaciones entre modelos (ej: Post.Author → User)

### `handlers/` - Lógica de Negocio

Cada handler es una estructura que contiene:
- Referencia a `*gorm.DB`
- Constructor `New{Handler}Handler(db *gorm.DB)`
- Métodos que implementan la lógica de negocio

**`petition.handler.go`**
```go
type PetitionHandler struct {
    DB *gorm.DB
}

func (h *PetitionHandler) CreatePetition(c echo.Context) error {
    // Lógica para crear petición
}
```

**`donation.handler.go`**
- `CreateDonationOrder` - Crea orden de donación

**`auth.handler.go`**
- `Register` - Registra nuevos usuarios
- `Login` - Autentica y genera JWT
- `GetJWTSecret` - Helper para obtener la clave secreta

**`blog.handler.go`**
- `GetPublishedPosts` - Lista posts publicados
- `GetPostBySlug` - Obtiene post por slug
- `CreatePost` - Crea nuevo post (admin)
- `UpdatePost` - Actualiza post (admin)

### `middleware/` - Middlewares Personalizados

**`auth.go`**

**`AuthMiddleware(getSecret JWTSecretProvider)`**
- Extrae y valida token JWT del header `Authorization`
- Verifica la firma del token
- Establece `user_id` y `role` en el contexto de Echo
- Devuelve 401 si el token es inválido

**`AdminMiddleware`**
- Verifica que el usuario tenga rol `admin`
- Debe usarse después de `AuthMiddleware`
- Devuelve 403 si no es admin

### `router/` - Configuración de Rutas

**`router.go`**

**`SetupRoutes(e *echo.Echo, db *gorm.DB)`**

Configura todas las rutas de la aplicación:

**Rutas Públicas:**
- `GET /api/health` - Health check
- `POST /api/contact/petition` - Crear petición
- `POST /api/donations/order` - Crear donación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/blog/posts` - Listar posts publicados
- `GET /api/blog/posts/:slug` - Obtener post por slug

**Rutas Protegidas (requieren autenticación):**
- `GET /api/protected/profile` - Perfil de usuario

**Rutas de Admin (requieren autenticación + rol admin):**
- `GET /api/admin/dashboard` - Dashboard
- `GET /api/admin/donations` - Listar donaciones
- `GET /api/admin/petitions` - Listar peticiones
- `POST /api/admin/blog` - Crear post
- `PUT /api/admin/blog/:id` - Actualizar post

**Configuración de Producción:**
- Sirve archivos estáticos de React (`/frontend/dist`)
- Fallback para SPA routing

## 🔄 Flujo de una Petición

### Ejemplo: Crear Post de Blog (Admin)

1. **Cliente** envía `POST /api/admin/blog` con token JWT
2. **Echo** recibe la petición
3. **AuthMiddleware** valida el token, establece `user_id` y `role` en contexto
4. **AdminMiddleware** verifica que `role == "admin"`
5. **Router** dirige a `blogHandler.CreatePost`
6. **BlogHandler** ejecuta lógica:
   - Valida datos de entrada
   - Verifica que el slug sea único
   - Obtiene `user_id` del contexto
   - Crea el post en la BD
7. **Respuesta** JSON con el post creado

## 🎯 Ventajas de la Estructura Modular

### ✅ Separación de Responsabilidades
- Cada paquete tiene una responsabilidad clara
- Facilita el mantenimiento y testing

### ✅ Reutilización
- Los handlers pueden reutilizarse en diferentes rutas
- Los modelos están centralizados

### ✅ Escalabilidad
- Fácil agregar nuevos handlers, modelos o middlewares
- Cada módulo puede crecer independientemente

### ✅ Testing
- Los handlers pueden testearse con mocks de `*gorm.DB`
- Los middlewares se pueden probar por separado

### ✅ Legibilidad
- `main.go` es simple y declarativo
- La estructura del proyecto es autoexplicativa

## 🔧 Agregar Nuevas Funcionalidades

### Agregar un Nuevo Modelo

1. Definir en `models/models.go`:
```go
type Event struct {
    gorm.Model
    Title       string
    Description string
    Date        time.Time
}
```

2. Agregar a `database.InitDB()` en `main.go`:
```go
database.InitDB(
    &models.User{},
    &models.Petition{},
    &models.Donation{},
    &models.Post{},
    &models.Event{}, // Nuevo
)
```

### Agregar un Nuevo Handler

1. Crear `handlers/event.handler.go`:
```go
package handlers

type EventHandler struct {
    DB *gorm.DB
}

func NewEventHandler(db *gorm.DB) *EventHandler {
    return &EventHandler{DB: db}
}

func (h *EventHandler) GetEvents(c echo.Context) error {
    // Lógica aquí
}
```

2. Registrar en `router/router.go`:
```go
eventHandler := handlers.NewEventHandler(db)
e.GET("/api/events", eventHandler.GetEvents)
```

### Agregar un Nuevo Middleware

1. Crear en `middleware/`:
```go
func RateLimitMiddleware() echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            // Lógica de rate limiting
            return next(c)
        }
    }
}
```

2. Aplicar en `main.go` o en grupos específicos en `router.go`

## 📝 Convenciones

### Nomenclatura
- Paquetes: lowercase singular (`handlers`, `models`)
- Archivos: lowercase con extensión descriptiva (`.handler.go`, `.go`)
- Estructuras: PascalCase (`UserHandler`, `Post`)
- Métodos públicos: PascalCase (`CreatePost`)
- Variables privadas: camelCase (`userID`)

### Organización de Imports
1. Paquetes estándar de Go
2. Paquetes de terceros
3. Paquetes locales del proyecto

### Comentarios
- Cada función exportada debe tener un comentario
- Los comentarios deben ser claros y concisos

## 🚀 Próximos Pasos

1. **Testing**: Agregar tests unitarios para handlers
2. **Validación**: Implementar validación avanzada con `go-playground/validator`
3. **Logging**: Mejorar el sistema de logging (Logrus, Zap)
4. **Configuración**: Centralizar configuración en un paquete `config/`
5. **Documentación API**: Generar docs con Swagger
6. **Servicios**: Extraer lógica compleja a un paquete `services/`

## 📚 Recursos

- [Echo Framework](https://echo.labstack.com/)
- [GORM](https://gorm.io/)
- [JWT-Go](https://github.com/golang-jwt/jwt)
- [Go Project Layout](https://github.com/golang-standards/project-layout)

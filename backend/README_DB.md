# Configuración de Base de Datos - Backend

## Variables de Entorno Requeridas

El backend requiere las siguientes variables de entorno para funcionar correctamente:

### Archivo `.env` (Desarrollo Local)

Crea un archivo `.env` en el directorio `backend/` con el siguiente contenido:

```env
DATABASE_URL="postgres://username:password@host:port/database_name"
PORT="8080"
ENV="development"
```

### Obtener DATABASE_URL

**Opción 1: ElephantSQL (PostgreSQL en la nube - Gratis)**
1. Visita https://www.elephantsql.com/
2. Crea una cuenta gratuita
3. Crea una nueva instancia (plan "Tiny Turtle" es gratuito)
4. Copia la URL de conexión que se ve así:
   `postgres://username:password@hostname.db.elephantsql.com/database_name`
5. Pégala en el archivo `.env` como valor de `DATABASE_URL`

**Opción 2: PostgreSQL Local**
```env
DATABASE_URL="postgres://postgres:password@localhost:5432/casadelrey"
```

## Modelo de Datos

### Tabla: `petitions`

| Campo       | Tipo      | Descripción                                   |
|-------------|-----------|-----------------------------------------------|
| id          | uint      | ID autoincremental (primary key)              |
| created_at  | timestamp | Fecha de creación (automático)                |
| updated_at  | timestamp | Fecha de actualización (automático)           |
| deleted_at  | timestamp | Soft delete (automático con GORM)             |
| name        | string    | Nombre completo del usuario                   |
| email       | string    | Correo electrónico                            |
| phone       | string    | Teléfono (opcional)                           |
| message     | text      | Mensaje/petición                              |
| is_prayer   | boolean   | true = Oración, false = Contacto general      |

## Migración Automática

La migración de la base de datos se ejecuta automáticamente al iniciar el servidor:
- Crea la tabla `petitions` si no existe
- Actualiza el esquema si hay cambios en el modelo

## Iniciar el Backend

```bash
cd backend
go run main.go
```

Si la conexión es exitosa, verás:
```
Iniciando migración de la base de datos...
Migración completada con éxito.
Iniciando servidor en el puerto: 8080
```

## Endpoint API

### POST `/api/contact/petition`

Crea una nueva petición de contacto/oración.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+56912345678",
  "message": "Necesito oración por mi familia",
  "is_prayer": true
}
```

**Response Success (201):**
```json
{
  "message": "Petición guardada con éxito",
  "id": 1
}
```

**Response Error (400/500):**
```json
{
  "error": "Descripción del error"
}
```

## Notas de Seguridad

- El archivo `.env` está en `.gitignore` y NO debe ser subido al repositorio
- En producción (Fly.io), las variables de entorno se configurarán via `fly secrets`
- CORS está configurado para aceptar todos los orígenes temporalmente (se refinará en despliegue)

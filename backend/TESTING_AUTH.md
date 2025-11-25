# Pruebas de Autenticación y Middlewares

Este documento muestra cómo probar los middlewares de autenticación implementados.

## Middlewares Implementados

### 1. AuthMiddleware
Protege rutas requiriendo un token JWT válido en el header `Authorization: Bearer <token>`.

**Funcionalidad:**
- Extrae el token del header `Authorization`
- Valida el formato `Bearer <token>`
- Verifica la firma del token usando JWT_SECRET
- Extrae `user_id` y `role` del token
- Los guarda en el contexto de Echo (`c.Set()`)
- Devuelve 401 Unauthorized si el token es inválido o falta

### 2. AdminMiddleware
Verifica que el usuario autenticado tenga rol de administrador.

**Funcionalidad:**
- Debe usarse DESPUÉS de AuthMiddleware
- Verifica que `role` en el contexto sea "admin"
- Devuelve 403 Forbidden si el usuario no es admin
- Permite continuar si el rol es admin

## Rutas de Ejemplo

### Rutas Públicas (sin autenticación)
```
POST /api/auth/register - Registrar nuevo usuario
POST /api/auth/login - Iniciar sesión
POST /api/contact/petition - Enviar petición
POST /api/donations/order - Crear orden de donación
```

### Rutas Protegidas (requieren autenticación)
```
GET /api/protected/profile - Ver perfil de usuario autenticado
```

### Rutas de Administrador (requieren autenticación + rol admin)
```
GET /api/admin/dashboard - Panel de administración
GET /api/admin/donations - Listar todas las donaciones
GET /api/admin/petitions - Listar todas las peticiones
```

## Ejemplos de Uso con cURL

### 1. Registrar un usuario
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Usuario registrado exitosamente. Por favor, inicia sesión.",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "role": "member"
  }
}
```

### 2. Iniciar sesión
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "role": "member"
  }
}
```

### 3. Acceder a ruta protegida (con token)
```bash
# Guardar el token en una variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:8080/api/protected/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada (usuario autenticado):**
```json
{
  "message": "Perfil de usuario",
  "user_id": 1,
  "role": "member"
}
```

**Respuesta si falta el token:**
```json
{
  "error": "Token de autorización requerido"
}
```

**Respuesta si el token es inválido:**
```json
{
  "error": "Token inválido o expirado"
}
```

### 4. Acceder a ruta de administrador (requiere rol admin)
```bash
curl -X GET http://localhost:8080/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta si el usuario NO es admin:**
```json
{
  "error": "Acceso denegado. Se requiere rol de administrador"
}
```

**Respuesta si el usuario ES admin:**
```json
{
  "message": "Panel de administración",
  "user_id": 1,
  "role": "admin"
}
```

### 5. Listar todas las donaciones (solo admin)
```bash
curl -X GET http://localhost:8080/api/admin/donations \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Crear un Usuario Administrador

Para crear un usuario con rol de administrador, puedes:

### Opción 1: Modificar manualmente en la base de datos
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@casadelrey.com';
```

### Opción 2: Crear una ruta temporal de inicialización (solo desarrollo)
Agregar en `main.go`:
```go
// Solo para desarrollo - REMOVER EN PRODUCCIÓN
e.POST("/api/dev/create-admin", func(c echo.Context) error {
    hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
    admin := User{
        Name:     "Administrador",
        Email:    "admin@casadelrey.com",
        Password: string(hashedPassword),
        Role:     "admin",
    }
    DB.Create(&admin)
    return c.JSON(http.StatusOK, map[string]string{"message": "Admin creado"})
})
```

## Integración con Frontend (React)

### Ejemplo de función para hacer peticiones autenticadas:

```javascript
// src/utils/api.js
const API_URL = 'http://localhost:8080/api';

// Obtener el token del localStorage
const getToken = () => localStorage.getItem('token');

// Función helper para peticiones autenticadas
export const authenticatedFetch = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token expirado o inválido - redirigir al login
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  
  return response;
};

// Ejemplos de uso:
export const getProfile = async () => {
  const response = await authenticatedFetch('/protected/profile');
  return response.json();
};

export const getAdminDashboard = async () => {
  const response = await authenticatedFetch('/admin/dashboard');
  return response.json();
};

export const getAllDonations = async () => {
  const response = await authenticatedFetch('/admin/donations');
  return response.json();
};
```

## Flujo de Autenticación Completo

1. **Registro**: Usuario se registra → recibe objeto user con role "member"
2. **Login**: Usuario inicia sesión → recibe token JWT + datos de usuario
3. **Guardar Token**: Frontend guarda el token en localStorage
4. **Peticiones Protegidas**: Frontend incluye `Authorization: Bearer <token>` en headers
5. **Middleware Valida**: Backend valida token y extrae user_id y role
6. **Acceso Condicional**: Si la ruta requiere admin, verifica el role
7. **Expiración**: Token expira después de 24 horas → usuario debe hacer login nuevamente

## Notas de Seguridad

- ✅ Las contraseñas se almacenan hasheadas con bcrypt
- ✅ Los tokens JWT están firmados con HS256
- ✅ El JWT_SECRET debe cambiarse en producción
- ✅ Los tokens expiran después de 24 horas
- ✅ El middleware verifica la firma del token
- ✅ El campo Password del modelo User tiene `json:"-"` (nunca se expone en API)
- ⚠️ En producción, configura CORS correctamente (no uses `AllowOrigins: ["*"]`)
- ⚠️ Usa HTTPS en producción para proteger el token en tránsito

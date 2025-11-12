# Scripts de Inicio

## Backend

### Requisitos Previos
1. Tener Go instalado (versión 1.23+)
2. Configurar el archivo `.env` con la URL de la base de datos

### Iniciar el servidor

```bash
cd backend
go run main.go
```

El servidor estará disponible en `http://localhost:8080`

### Verificar la conexión

```bash
curl http://localhost:8080/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "service": "CasaDelRey Backend API"
}
```

## Frontend

### Requisitos Previos
1. Tener Node.js instalado
2. Tener pnpm instalado (`npm install -g pnpm`)

### Instalar dependencias (primera vez)

```bash
cd frontend
pnpm install
```

### Iniciar el servidor de desarrollo

```bash
cd frontend
pnpm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Compilar para producción

```bash
cd frontend
pnpm run build
```

Los archivos compilados estarán en `frontend/dist/`

## Ejecutar Todo el Stack

### Terminal 1 - Backend
```bash
cd backend
go run main.go
```

### Terminal 2 - Frontend
```bash
cd frontend
pnpm run dev
```

### Probar el formulario
1. Abre http://localhost:3000 en tu navegador
2. Desplázate al formulario de peticiones
3. Llena los campos y envía
4. Verifica en los logs del backend que la petición se guardó

## Nota Importante sobre Base de Datos

Antes de iniciar el backend, asegúrate de:
1. Tener configurado el archivo `.env` con la variable `DATABASE_URL`
2. La base de datos PostgreSQL debe estar accesible
3. GORM creará automáticamente la tabla `petitions` en el primer inicio

Ver `backend/README_DB.md` para más detalles sobre la configuración de la base de datos.

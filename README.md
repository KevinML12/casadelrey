# Casa del Rey - MVP

Proyecto monorepo para la plataforma web de Casa del Rey, diseñado para jóvenes de 18-25 años.

## Estructura del Proyecto

```
casa-del-rey-mvp/
├── backend/          # API Backend en Go
│   ├── main.go       # Servidor Echo con endpoint /api/health
│   ├── go.mod        # Módulos de Go
│   └── fly.toml      # Configuración para despliegue en Fly.io
├── frontend/         # Aplicación React con Vite
│   ├── src/
│   │   ├── main.jsx      # Punto de entrada React
│   │   ├── App.jsx       # Componente principal
│   │   └── index.css     # Estilos globales con Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── postcss.config.js
│   └── tailwind.config.js
└── README.md
```

## Tecnologías

### Backend
- **Go 1.21** - Lenguaje de programación
- **Echo** - Framework web ligero
- **Fly.io** - Plataforma de despliegue

### Frontend
- **React 18** - Librería UI
- **Vite 5** - Herramienta de build
- **Tailwind CSS v4** - Framework de estilos (sintaxis moderna con @import)
- **PostCSS + Autoprefixer** - Procesamiento de CSS

## Configuración de Estilos

### Colores Personalizados (Definidos en src/index.css)
- `primary-blue`: #007bff - Azul principal de la iglesia
- `secondary-gold`: #ffcc00 - Dorado/Amarillo de acento
- `dark-text`: #2c3e50 - Texto oscuro

### Tipografía
- Fuente base: Inter (`--font-sans`)
- Fuente de títulos: Montserrat (`--font-heading`)

### Características de Tailwind v4
- Sintaxis moderna con `@import "tailwindcss"`
- Variables CSS personalizadas con `@theme`
- Integración directa con Vite sin plugin de PostCSS
- Configuración simplificada en `tailwind.config.js`

## Inicio Rápido

### Backend

```powershell
cd backend
go mod download
go get github.com/labstack/echo/v4
go get github.com/labstack/echo/v4/middleware
go run main.go
```

El servidor estará disponible en `http://localhost:8080`

Endpoint de prueba: `http://localhost:8080/api/health`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Próximos Pasos

1. Desarrollo del Frontend Crítico (HomePage)
2. Implementación de autenticación
3. Conexión con base de datos
4. Despliegue a producción

## Estado del Proyecto

Configuración inicial completa:
- Estructura de carpetas establecida
- Backend Go con Echo configurado
- Frontend React con Vite configurado
- Tailwind CSS y sistema de diseño implementado
- Componente de prueba funcional

# SiteConfigContext - Documentación

## Descripción
`SiteConfigContext` es un contexto de React que gestiona la configuración global del sitio utilizando React Query para el fetching de datos desde la API.

## Características
- ✅ Fetching automático con React Query
- ✅ Cache de 30 minutos
- ✅ Stale time de 10 minutos
- ✅ Configuración por defecto mientras carga
- ✅ Hook personalizado `useSiteConfig()`
- ✅ Skeleton loaders integrados

## Configuración Disponible

```javascript
{
  facebook_url: string,
  instagram_url: string,
  youtube_url: string,
  twitter_url: string,
  address: string,
  phone: string,
  email: string,
  church_name: string,
  description: string,
  logo_url: string
}
```

## Uso

### 1. Importar el hook
```javascript
import { useSiteConfig } from '../../context/SiteConfigContext';
```

### 2. Usar en el componente
```javascript
const MyComponent = () => {
  const { config, isLoading } = useSiteConfig();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <p>Teléfono: {config.phone}</p>
      <p>Email: {config.email}</p>
      <p>Dirección: {config.address}</p>
      
      {/* Redes Sociales */}
      {config.facebook_url && (
        <a href={config.facebook_url} target="_blank">
          Facebook
        </a>
      )}
    </div>
  );
};
```

### 3. Ejemplo con Skeleton Loader
```javascript
const Footer = () => {
  const { config, isLoading } = useSiteConfig();

  return (
    <footer>
      {isLoading ? (
        <div className="h-5 w-40 bg-gray-700 rounded animate-pulse"></div>
      ) : (
        config.phone && <p>Teléfono: {config.phone}</p>
      )}
    </footer>
  );
};
```

## API Endpoint Requerido

El backend debe implementar el siguiente endpoint:

```
GET /api/site/config
```

**Respuesta esperada:**
```json
{
  "facebook_url": "https://facebook.com/casadelrey",
  "instagram_url": "https://instagram.com/casadelrey",
  "youtube_url": "https://youtube.com/@casadelrey",
  "twitter_url": "https://twitter.com/casadelrey",
  "address": "Calle Principal 123\nCiudad, Estado 12345",
  "phone": "+1 (234) 567-890",
  "email": "info@casadelrey.org",
  "church_name": "Casa del Rey",
  "description": "Iglesia cristiana evangélica",
  "logo_url": "https://example.com/logo.png"
}
```

## Configuración de React Query

- **queryKey:** `['site-config']`
- **staleTime:** 10 minutos (600000ms)
- **cacheTime:** 30 minutos (1800000ms)
- **retry:** 2 intentos
- **refetchOnWindowFocus:** false

## Valores por Defecto

Si hay error o mientras carga, el contexto provee valores vacíos:
```javascript
{
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  twitter_url: '',
  address: '',
  phone: '',
  email: '',
  church_name: 'Casa del Rey',
  description: '',
  logo_url: ''
}
```

## Invalidar Cache Manualmente

Si necesitas refrescar la configuración:
```javascript
import { useQueryClient } from '@tanstack/react-query';

const MyComponent = () => {
  const queryClient = useQueryClient();
  
  const refreshConfig = () => {
    queryClient.invalidateQueries({ queryKey: ['site-config'] });
  };
  
  return <button onClick={refreshConfig}>Actualizar Config</button>;
};
```

## Componentes Actualizados

Los siguientes componentes ya están usando `SiteConfigContext`:
- ✅ `Footer.jsx` - Muestra teléfono, email, dirección y redes sociales

## Próximos Pasos

Puedes integrar el contexto en otros componentes que necesiten la configuración:
- Header (logo, nombre de la iglesia)
- ContactSection (información de contacto)
- AboutSection (descripción de la iglesia)
- Página de Contacto (teléfono, email, dirección)

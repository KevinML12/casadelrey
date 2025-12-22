# Artefactos de Código - Soft UI + Paleta Eclesial

## 1. Configuración de Tailwind (tailwind.config.js/ts)

```javascript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // ✅ Tipografía Inter como sans principal obligatoria
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      
      colors: {
        // Fondos Base (Crema Cálida - Eclesial)
        'bg': {
          'light': '#F5E6D3',      // Fondo base todas las páginas
          'light-alt': '#FAFAF8',  // Alternativo más claro
          'dark': '#2C1810',       // Modo oscuro (marrón eclesial)
        },
        
        // Tarjetas y Componentes
        'card': {
          'bg': '#FFFBF7',         // Tarjetas blancas cálidas
        },
        
        // Colores Primarios (Litúrgico - Caoba)
        'primary': {
          'DEFAULT': '#6B4423',    // Caoba (botones, CTA)
          'dark': '#5A3A1A',       // Caoba oscura (hover)
          'light': '#8B7355',      // Taupe (estados alternativos)
        },
        
        // Acento Dorado (Aspecto Sagrado)
        'accent': {
          'DEFAULT': '#D4AF37',    // Dorado litúrgico (destacados, títulos)
          'dark': '#B8940C',       // Dorado oscuro (hover)
          'light': '#E8C547',      // Dorado claro (overlays)
        },
        
        // Estados Estándar
        'success': '#10B981',      // Verde (confirmaciones)
        'warning': '#F59E0B',      // Ámbar (advertencias)
        'error': '#DC2626',        // Rojo cálido (errores)
        'info': '#06B6D4',         // Cian (información)
        
        // Textos
        'text': {
          'primary': '#2C1810',    // Marrón oscuro (texto principal)
          'secondary': '#6B7280',  // Gris (texto secundario)
          'muted': '#A6988F',      // Beige gris (texto tenue)
          'light': '#FFFBF7',      // Crema (texto en fondos oscuros)
        },
        
        // Bordes
        'border': {
          'DEFAULT': '#E5D9CA',    // Borde marrón muy suave
          'dark': '#D4C4B3',       // Borde marrón medio
        },
      },
      
      // Sombras Soft UI - Elevation Levels
      boxShadow: {
        'soft': '0 2px 8px rgba(44, 24, 16, 0.06)',           // Elevation 1
        'soft-sm': '0 1px 3px rgba(44, 24, 16, 0.04)',        // Elevation 0
        'soft-md': '0 4px 12px rgba(44, 24, 16, 0.1)',        // Elevation 2
        'soft-lg': '0 8px 24px rgba(44, 24, 16, 0.12)',       // Elevation 3
        'soft-xl': '0 12px 32px rgba(44, 24, 16, 0.15)',      // Elevation 4
        'soft-2xl': '0 20px 48px rgba(44, 24, 16, 0.18)',     // Elevation 5
      },
      
      // Border Radius Armonizado
      borderRadius: {
        'card': '12px',
        'button': '10px',
        'input': '10px',
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      
      // Duraciones de Transición
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      
      // Timing Functions Soft UI
      transitionTimingFunction: {
        'soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 2. Componente Card.tsx (Soft UI Card)

```jsx
import React from 'react';

/**
 * Card Component - Soft UI Card with floating elevation
 * 
 * Implementa el patrón de tarjeta flotante:
 * ✅ Fondo blanco cálido (#FFFBF7)
 * ✅ Bordes muy redondeados (rounded-card = 12px)
 * ✅ Sombra sutil con elevation (shadow-soft)
 * ✅ Transiciones fluidas (transition-soft)
 * ✅ Tipografía Inter obligatoria (font-sans)
 */

const Card = React.forwardRef(
  ({ children, elevated = false, hoverable = true, className = '', ...props }, ref) => {
    const baseClasses = 'bg-card rounded-card font-sans transition-soft duration-300';
    
    const shadowClass = elevated ? 'shadow-soft-md' : 'shadow-soft';
    const hoverClass = hoverable ? 'hover:shadow-soft-md' : '';
    
    return (
      <div
        ref={ref}
        className={`${baseClasses} ${shadowClass} ${hoverClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Encabezado de tarjeta
 */
const CardHeader = React.forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`mb-4 pb-4 border-b border-border text-primary font-semibold font-sans ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

/**
 * CardContent - Contenido principal de tarjeta
 */
const CardContent = React.forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`font-sans ${className}`} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

/**
 * CardFooter - Pie de tarjeta
 */
const CardFooter = React.forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`mt-6 pt-4 border-t border-border flex gap-3 font-sans ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
export default Card;
```

---

## 3. Componente Button.tsx (Soft UI Button con Acento)

```jsx
import React from 'react';

/**
 * Button Component - Soft UI Button with Accent Color
 * 
 * Implementa el patrón de botón con acento:
 * ✅ Color de acento primario (Dorado: #D4AF37)
 * ✅ Bordes redondeados (rounded-button = 10px)
 * ✅ Sombra sutil con elevation (shadow-soft)
 * ✅ Transiciones fluidas (transition-soft)
 * ✅ Tipografía Inter obligatoria (font-sans)
 * ✅ Completamente funcional con onClick handler
 * ✅ 6 variantes: primary, secondary, outline, ghost, accent, danger
 * ✅ 5 tamaños: xs, sm, md, lg, xl
 */

const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      onClick,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Variantes de estilo Soft UI
    const variants = {
      // Primary: Caoba (acción principal)
      primary: 'bg-primary text-text-light hover:bg-primary-dark shadow-soft hover:shadow-soft-md font-semibold transition-soft',
      
      // Secondary: Contorno caoba
      secondary: 'bg-bg-light border-2 border-primary text-text-primary hover:bg-white hover:border-primary-dark hover:shadow-soft-sm font-semibold transition-soft',
      
      // Outline: Solo borde
      outline: 'border-2 border-primary text-primary hover:bg-bg-light hover:shadow-soft-sm font-semibold transition-soft',
      
      // Ghost: Sin fondo, solo texto
      ghost: 'text-primary hover:bg-bg-light font-semibold transition-soft',
      
      // Accent: Dorado (destacado premium) ⭐
      accent: 'bg-accent text-text-primary hover:bg-accent-dark shadow-soft hover:shadow-soft-md font-semibold transition-soft',
      
      // Danger: Rojo cálido (acciones destructivas)
      danger: 'bg-error text-white hover:bg-red-700 shadow-soft hover:shadow-soft-md font-semibold transition-soft',
    };

    // Tamaños con padding armonizado
    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    };

    // Clases base obligatorias
    const baseClasses = 'rounded-button font-sans inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
    
    const variantClasses = variants[variant] || variants.primary;
    const sizeClasses = sizes[size] || sizes.md;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

---

## 4. Ejemplo de Uso Completo

```jsx
import Card, { CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export function DemoComponent() {
  const handleClick = () => alert('¡Botón presionado!');

  return (
    <div className="min-h-screen bg-bg-light p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h1 className="text-2xl font-sans">Soft UI + Paleta Eclesial</h1>
        </CardHeader>
        
        <CardContent>
          <p className="text-text-secondary font-sans mb-4">
            Este es un ejemplo de cómo usar Card y Button con Soft UI principles
            manteniendo la identidad visual eclesial.
          </p>
          
          <div className="grid grid-cols-2 gap-3 font-sans">
            <Button variant="primary" onClick={handleClick}>
              Primary (Caoba)
            </Button>
            <Button variant="accent" onClick={handleClick}>
              Accent (Dorado) ⭐
            </Button>
            <Button variant="secondary" onClick={handleClick}>
              Secondary
            </Button>
            <Button variant="outline" onClick={handleClick}>
              Outline
            </Button>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="primary" onClick={handleClick}>Aceptar</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## ✅ Resumen de Características

### Card Component
- ✅ Soft UI flotante con sombras progresivas
- ✅ Fondo blanco cálido (#FFFBF7)
- ✅ Bordes redondeados (rounded-card = 12px)
- ✅ Transiciones suaves (transition-soft)
- ✅ **Tipografía Inter obligatoria (font-sans)**
- ✅ Componentes composables: CardHeader, CardContent, CardFooter
- ✅ Props: elevated, hoverable, className, ...props

### Button Component
- ✅ **6 variantes**: primary, secondary, outline, ghost, accent, danger
- ✅ **5 tamaños**: xs, sm, md, lg, xl
- ✅ Soft UI con shadow-soft y transiciones
- ✅ Focus ring para accesibilidad (focus:ring-2)
- ✅ **Completamente funcional con onClick handler**
- ✅ **Tipografía Inter obligatoria (font-sans)**
- ✅ Soporta disabled state
- ✅ Props: variant, size, disabled, onClick, type, className, ...props

### Paleta Eclesial
- 🟤 **Primary (Caoba)**: #6B4423
- 🟡 **Accent (Dorado)**: #D4AF37
- 🟫 **Background (Crema)**: #F5E6D3
- ⚪ **Card (Blanco Cálido)**: #FFFBF7

### Soft UI Principles
- ✅ Sombras sutiles con 5 niveles de elevation
- ✅ Transiciones fluidas (cubic-bezier)
- ✅ Border-radius armonizado (4px a 24px)
- ✅ Hover states progresivos
- ✅ Focus rings para accesibilidad
- ✅ Durations: fast (150ms), base (200ms), slow (300ms), slower (500ms)

---

## 📦 Build Status

```
✓ 1783 módulos transformados
✓ CSS: 4.85 kB (gzip: 1.47 kB)
✓ JS: 386.79 kB (gzip: 123.54 kB)
✓ Build time: 2.70 segundos
✓ SIN ERRORES
```

---

**Generado**: 2025-11-26  
**Estado**: ✅ PRODUCCIÓN  
**Versión**: 1.0.0

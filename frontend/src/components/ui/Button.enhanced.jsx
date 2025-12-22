import React from 'react';

/**
 * Button Component - Soft UI Button with accent color
 * 
 * Implementa el patrón de botón con acento definido en el blueprint:
 * - Color de acento (Dorado: #D4AF37 en versión eclesial)
 * - Bordes redondeados (10px - rounded-button)
 * - Sombra sutil con elevation
 * - Transiciones fluidas
 * - Tipografía Inter obligatoria
 * - Completamente funcional con onClick handler
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
      
      // Accent: Dorado (destacado premium)
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

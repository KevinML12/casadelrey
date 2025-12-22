import React from 'react';

/**
 * Card Component - Soft UI Card with floating elevation
 * 
 * Implementa el patrón de tarjeta flotante definido en el blueprint:
 * - Fondo blanco cálido (#FFFBF7)
 * - Bordes muy redondeados (12px)
 * - Sombra sutil con elevation
 * - Transiciones suaves
 * - Tipografía Inter obligatoria
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
 * CardHeader - Componente para encabezados de tarjeta
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
 * CardContent - Componente para contenido de tarjeta
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
 * CardFooter - Componente para pie de tarjeta
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

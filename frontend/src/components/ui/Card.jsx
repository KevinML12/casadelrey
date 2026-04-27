/**
 * M3 Card — https://m3.material.io/components/cards
 *
 * variant: 'elevated' | 'filled' | 'outlined'
 */

const variants = {
  elevated:
    'surf-1 shadow-elev-1 hover:shadow-elev-2 hover:-translate-y-0.5 ' +
    'transition-[box-shadow,transform] duration-200 ' +
    'relative overflow-hidden ' +
    'before:content-[""] before:absolute before:inset-0 before:bg-on-surf ' +
    'before:opacity-0 before:transition-opacity before:duration-150 ' +
    'hover:before:opacity-[.08]',
  filled:
    'bg-surf-high',
  outlined:
    'bg-surf border border-outline-var',
};

export default function Card({ variant = 'elevated', className = '', children, ...props }) {
  return (
    <div
      className={`rounded-md overflow-hidden ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardMedia({ src, alt = '', height = 160, children, className = '' }) {
  if (src) {
    return (
      <img
        src={src} alt={alt}
        className={`w-full object-cover ${className}`}
        style={{ height }}
      />
    );
  }
  return (
    <div
      className={`w-full flex items-center justify-center ${className}`}
      style={{ height }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardActions({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-2 px-3 pb-3 pt-0 ${className}`}>
      {children}
    </div>
  );
}

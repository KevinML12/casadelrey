import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Liquid Glass Button — mismo lenguaje de material que el sitio público
 * (GlassButton de Glass.jsx), adaptado a los 5 "variant" que ya usan las
 * 20 páginas del panel para no tener que tocar cada call site.
 *
 * variant: 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text' | 'glass'
 * size:    'sm' | 'md' | 'lg'
 * as:      'button' | 'a' | 'link' (react-router Link)
 */

const base =
  'inline-flex items-center justify-center gap-2 rounded-full border-none ' +
  'font-bold tracking-tightish leading-tight btn-spring ' +
  'cursor-pointer select-none whitespace-nowrap focus-ring ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none';

const variants = {
  // Primario — pill blanco (mismo CTA del sitio público)
  filled:   'bg-white text-bg shadow-card hover:shadow-card-lg',
  // Cristal — vidrio con borde, uso más frecuente en el panel
  tonal:    'liquid-glass text-white',
  glass:    'liquid-glass text-white',
  elevated: 'liquid-glass text-white shadow-card-lg',
  outlined: 'bg-transparent text-white border border-white/20 hover:bg-white/6 hover:border-white/35',
  text:     'bg-transparent text-white/60 hover:text-white hover:bg-white/6',
};

const sizes = {
  sm: 'text-[13px] px-3.5 py-1.5',
  md: 'text-[14px] px-5 py-2.5',
  lg: 'text-[15px] px-6 py-3.5',
};

const Button = forwardRef(function Button(
  { variant = 'filled', size = 'md', as = 'button', to, href, children, className = '', ...props },
  ref
) {
  const cls = `${base} ${variants[variant] || variants.filled} ${sizes[size]} ${className}`;

  if (as === 'link' && to)
    return <Link ref={ref} to={to} className={cls} {...props}>{children}</Link>;

  if (as === 'a' && href)
    return <a ref={ref} href={href} className={cls} {...props}>{children}</a>;

  return <button ref={ref} className={cls} {...props}>{children}</button>;
});

export default Button;

/* ── Icon Button ─────────────────────────────────────────────────── */

export function IconButton({ children, variant = 'standard', className = '', ...props }) {
  const variantCls = {
    standard: 'bg-transparent text-white/55 hover:text-white hover:bg-white/8',
    filled:   'bg-celeste text-white hover:bg-celeste-hov',
    tonal:    'liquid-glass text-white',
    outlined: 'bg-transparent text-white border border-white/20 hover:bg-white/8',
  }[variant];

  return (
    <button
      className={
        'inline-flex items-center justify-center w-10 h-10 rounded-full border-none ' +
        'cursor-pointer btn-spring transition-colors duration-200 ' +
        `${variantCls} ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}

/* ── FAB ─────────────────────────────────────────────────────────── */

export function FAB({ children, size = 'md', className = '', ...props }) {
  const sizeCls = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-14 h-14 rounded-[20px]',
    lg: 'w-24 h-24 rounded-[28px]',
  }[size];

  return (
    <button
      className={
        'inline-flex items-center justify-center gap-2 border-none ' +
        'bg-celeste text-white cursor-pointer btn-spring ' +
        'shadow-pop ' +
        `${sizeCls} ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}

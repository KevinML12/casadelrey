import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Botón del panel admin/líder/voluntario — MODO CLARO estilo Apple
 * (jul-2026): el panel es tinta navy sobre canvas off-white; este kit es
 * EXCLUSIVO del panel (el público usa GlassButton de Glass.jsx — la única
 * página pública que importaba este Button, EventsPage, ya se migró).
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
  // Primario — pill navy sólido (mismo CTA que el header público)
  filled:   'bg-bg text-white shadow-card hover:shadow-card-lg',
  // Escarchado — blanco translúcido con hairline, el más usado
  tonal:    'glass-light text-bg',
  glass:    'glass-light text-bg',
  elevated: 'glass-light text-bg shadow-card-lg',
  outlined: 'bg-transparent text-bg border border-bg/20 hover:bg-bg/5 hover:border-bg/35',
  text:     'bg-transparent text-bg/60 hover:text-bg hover:bg-bg/5',
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
    standard: 'bg-transparent text-bg/55 hover:text-bg hover:bg-bg/8',
    filled:   'bg-celeste text-white hover:bg-celeste-hov',
    tonal:    'glass-light text-bg',
    outlined: 'bg-transparent text-bg border border-bg/20 hover:bg-bg/5',
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

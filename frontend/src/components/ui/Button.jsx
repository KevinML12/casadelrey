import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * M3 Button — https://m3.material.io/components/buttons
 *
 * variant: 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text'
 * size:    'sm' | 'md' | 'lg'
 * as:      'button' | 'a' | 'link' (react-router Link)
 */

const base =
  'inline-flex items-center justify-center gap-2 rounded-full border-none ' +
  'font-sans font-semibold tracking-[.006em] leading-tight ' +
  'cursor-pointer select-none transition-shadow duration-200 ' +
  'relative overflow-hidden whitespace-nowrap ' +
  'disabled:opacity-[.38] disabled:cursor-not-allowed disabled:shadow-none ' +
  'before:content-[""] before:absolute before:inset-0 before:opacity-0 ' +
  'before:transition-opacity before:duration-150 before:pointer-events-none ';

const variants = {
  filled:
    'bg-pri text-on-pri shadow-elev-1 hover:shadow-elev-2 ' +
    'before:bg-on-pri hover:before:opacity-[.08] active:before:opacity-[.12] focus-visible:before:opacity-[.12]',
  tonal:
    'bg-sec-con text-on-sec-con hover:shadow-elev-1 ' +
    'before:bg-on-sec-con hover:before:opacity-[.08] active:before:opacity-[.12] focus-visible:before:opacity-[.12]',
  outlined:
    'bg-transparent text-pri border border-outline hover:border-pri ' +
    'before:bg-pri hover:before:opacity-[.08] active:before:opacity-[.12] focus-visible:before:opacity-[.12]',
  elevated:
    'bg-surf-low text-pri shadow-elev-1 hover:shadow-elev-2 ' +
    'before:bg-pri hover:before:opacity-[.08] active:before:opacity-[.12] focus-visible:before:opacity-[.12]',
  text:
    'bg-transparent text-pri px-3 ' +
    'before:bg-pri hover:before:opacity-[.08] active:before:opacity-[.12] focus-visible:before:opacity-[.12]',
  glass:
    'liquid-glass text-white border-none ' +
    'hover:bg-white/10 active:bg-white/15',
};

const sizes = {
  sm: 'text-label-m px-3 py-1.5',
  md: 'text-label-l px-6 py-2.5',
  lg: 'text-body-m  px-7 py-3.5',
};

const Button = forwardRef(function Button(
  { variant = 'filled', size = 'md', as = 'button', to, href, children, className = '', ...props },
  ref
) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

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
    standard: 'bg-transparent text-on-surf-var before:bg-on-surf',
    filled:   'bg-pri text-on-pri before:bg-on-pri',
    tonal:    'bg-sec-con text-on-sec-con before:bg-on-sec-con',
    outlined: 'bg-transparent text-pri border border-outline before:bg-pri',
  }[variant];

  return (
    <button
      className={
        'inline-flex items-center justify-center w-10 h-10 rounded-full border-none ' +
        'cursor-pointer relative overflow-hidden transition-all duration-150 ' +
        'before:content-[""] before:absolute before:inset-0 before:opacity-0 ' +
        'before:transition-opacity before:duration-150 ' +
        'hover:before:opacity-[.08] active:before:opacity-[.12] ' +
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
    sm: 'w-10 h-10 rounded-md',
    md: 'w-14 h-14 rounded-xl',
    lg: 'w-24 h-24 rounded-[28px]',
  }[size];

  return (
    <button
      className={
        'inline-flex items-center justify-center gap-2 border-none ' +
        'bg-pri-con text-on-pri-con cursor-pointer ' +
        'shadow-elev-3 hover:shadow-elev-4 transition-shadow duration-200 ' +
        'relative overflow-hidden ' +
        'before:content-[""] before:absolute before:inset-0 before:bg-on-pri-con ' +
        'before:opacity-0 before:transition-opacity ' +
        'hover:before:opacity-[.08] active:before:opacity-[.12] ' +
        `${sizeCls} ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}

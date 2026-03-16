const base = [
  'inline-flex items-center justify-center gap-2 font-semibold leading-none',
  'rounded-md transition-all duration-150 select-none',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const variants = {
  primary:   'bg-blue text-white hover:bg-blue-d active:scale-[0.98] shadow-sm',
  navy:      'bg-navy text-white hover:bg-navy-d active:scale-[0.98] shadow-sm',
  gold:      'bg-gold text-white hover:bg-gold-d active:scale-[0.98] shadow-sm shadow-gold-glow',
  secondary: 'bg-card-2 text-ink-2 hover:bg-line hover:text-ink active:scale-[0.98]',
  outline:   'border border-line dark:border-white/15 text-ink hover:border-blue hover:text-blue bg-transparent active:scale-[0.98]',
  ghost:     'text-ink-2 hover:bg-card-2 hover:text-ink active:scale-[0.98]',
  danger:    'bg-err text-white hover:opacity-90 active:scale-[0.98] shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  as: Tag = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <Tag
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

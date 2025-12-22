export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-base font-semibold transition-soft',
    secondary: 'bg-white border border-border-light text-text-primary hover:bg-bg-light-alt hover:border-border-medium shadow-sm hover:shadow-sm font-semibold transition-soft',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white font-semibold transition-soft',
    ghost: 'text-primary hover:bg-bg-light-alt font-semibold transition-soft',
    accent: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-base font-semibold transition-soft',
    danger: 'bg-error text-white hover:bg-red-700 shadow-sm hover:shadow-base font-semibold transition-soft',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };
  const baseClasses = 'rounded-lg font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-bg';
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

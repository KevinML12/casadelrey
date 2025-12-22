import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const baseClasses = `
    w-full
    border border-border-light
    dark:border-dark-border
    rounded-lg
    bg-card-bg
    dark:bg-dark-card-bg
    text-text-primary
    dark:text-dark-text-primary
    focus:outline-none
    focus:border-primary
    dark:focus:border-primary-light
    focus:ring-2
    focus:ring-primary focus:ring-opacity-10
    dark:focus:ring-primary-light dark:focus:ring-opacity-20
    transition-soft duration-200
    font-sans
    placeholder:text-text-muted
    dark:placeholder:text-dark-text-muted
  `;

  const sizeClasses = sizes[size] || sizes.md;
  const errorClasses = error ? 'border-error focus:border-error focus:ring-error dark:border-error' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-text-dark mb-2">
          {label}
        </label>
      )}
      <input
        className={`${baseClasses} ${sizeClasses} ${errorClasses} ${className} bg-white border border-[#0066FF] shadow-[0_2px_8px_rgba(0,102,255,0.03)]`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error font-medium">{error.message}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  rows = 4,
  className = '',
  ...props
}) {
  const baseClasses = `
    w-full
    px-4 py-2
    border border-border-light
    rounded-input
    bg-card-bg
    text-text-dark
    focus:outline-none
    focus:border-caoba
    focus:ring-2
    focus:ring-caoba focus:ring-opacity-20
    transition-soft duration-200
    font-sans
    placeholder:text-text-muted
    resize-vertical
  `;

  const errorClasses = error ? 'border-error focus:border-error focus:ring-error' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-text-dark mb-2">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error font-medium">{error.message}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
}
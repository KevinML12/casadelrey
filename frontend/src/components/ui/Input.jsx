const fieldBase = [
  'w-full rounded-md border border-line dark:border-white/10 bg-transparent text-ink',
  'placeholder:text-ink-3',
  'focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15',
  'transition-all duration-150 text-sm',
].join(' ');

const labelCls  = 'block text-sm font-medium text-ink mb-1.5';
const errorCls  = 'mt-1 text-xs text-err font-medium';
const helperCls = 'mt-1 text-xs text-ink-3';

export default function Input({
  label,
  error,
  helperText,
  size = 'md',
  className = '',
  ...props
}) {
  const sizeClass = size === 'sm' ? 'px-3 py-2' : size === 'lg' ? 'px-4 py-3.5' : 'px-4 py-2.5';
  const errRing   = error ? 'border-err focus:border-err focus:ring-err/15' : '';

  return (
    <div className="w-full">
      {label && <label className={labelCls}>{label}</label>}
      <input className={`${fieldBase} ${sizeClass} ${errRing} ${className}`} {...props} />
      {error     && <p className={errorCls}>{typeof error === 'string' ? error : error.message}</p>}
      {helperText && !error && <p className={helperCls}>{helperText}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Selecciona una opción',
  className = '',
  ...props
}) {
  const errRing = error ? 'border-err focus:border-err focus:ring-err/15' : '';

  return (
    <div className="w-full">
      {label && <label className={labelCls}>{label}</label>}
      <select
        className={`${fieldBase} pl-4 pr-10 py-2.5 appearance-none bg-[length:14px] bg-[right_14px_center] bg-no-repeat cursor-pointer ${errRing} ${className}`}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(({ value, label: optLabel }) => (
          <option key={value} value={value}>{optLabel}</option>
        ))}
      </select>
      {error && <p className={errorCls}>{typeof error === 'string' ? error : error.message}</p>}
      {helperText && !error && <p className={helperCls}>{helperText}</p>}
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
  const errRing = error ? 'border-err focus:border-err focus:ring-err/15' : '';

  return (
    <div className="w-full">
      {label && <label className={labelCls}>{label}</label>}
      <textarea
        rows={rows}
        className={`${fieldBase} px-4 py-2.5 resize-none ${errRing} ${className}`}
        {...props}
      />
      {error     && <p className={errorCls}>{typeof error === 'string' ? error : error.message}</p>}
      {helperText && !error && <p className={helperCls}>{helperText}</p>}
    </div>
  );
}

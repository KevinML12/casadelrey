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

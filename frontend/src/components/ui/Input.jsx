/**
 * M3 Text Fields — https://m3.material.io/components/text-fields
 * Variante: Outlined (la más usada en formularios)
 */

const fieldBase = [
  'w-full rounded border border-outline-var bg-transparent text-on-surf',
  'placeholder:text-on-surf-var',
  'hover:border-on-surf-var',
  'focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15',
  'transition-all duration-150 text-body-m',
  'disabled:opacity-[.38] disabled:cursor-not-allowed',
].join(' ');

const labelCls  = 'block text-label-l text-on-surf-var mb-1.5';
const errorCls  = 'mt-1.5 text-label-s text-err';
const helperCls = 'mt-1.5 text-label-s text-on-surf-var';

let uid = 0;
const nextId = (prefix) => `${prefix}-${++uid}`;

export default function Input({ label, error, helperText, size = 'md', className = '', id, ...props }) {
  const sizeCls = { sm: 'px-3 py-2', md: 'px-4 py-2.5', lg: 'px-4 py-3.5' }[size];
  const errCls  = error ? 'border-err focus:border-err focus:ring-err/15' : '';
  // htmlFor/id: sin esto el <label> es solo texto visual, no asociado al
  // input — rompe lectores de pantalla Y selectores de test getByLabel().
  const fieldId = id || (label ? nextId('field') : undefined);

  return (
    <div className="w-full">
      {label && <label htmlFor={fieldId} className={labelCls}>{label}</label>}
      <input id={fieldId} className={`${fieldBase} ${sizeCls} ${errCls} ${className}`} {...props} />
      {error      && <p className={errorCls}>{typeof error === 'string' ? error : error.message}</p>}
      {helperText && !error && <p className={helperCls}>{helperText}</p>}
    </div>
  );
}

export function Select({ label, error, helperText, options = [], placeholder = 'Selecciona una opción', className = '', id, ...props }) {
  const errCls = error ? 'border-err focus:border-err focus:ring-err/15' : '';
  const fieldId = id || (label ? nextId('field') : undefined);

  return (
    <div className="w-full">
      {label && <label htmlFor={fieldId} className={labelCls}>{label}</label>}
      <select
        id={fieldId}
        className={`${fieldBase} pl-4 pr-10 py-2.5 appearance-none cursor-pointer ${errCls} ${className}`}
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238F9099' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          backgroundSize: '14px',
        }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(({ value, label: optLabel }) => (
          <option key={value} value={value}>{optLabel}</option>
        ))}
      </select>
      {error      && <p className={errorCls}>{typeof error === 'string' ? error : error.message}</p>}
      {helperText && !error && <p className={helperCls}>{helperText}</p>}
    </div>
  );
}

export function Textarea({ label, error, helperText, rows = 4, className = '', id, ...props }) {
  const errCls = error ? 'border-err focus:border-err focus:ring-err/15' : '';
  const fieldId = id || (label ? nextId('field') : undefined);

  return (
    <div className="w-full">
      {label && <label htmlFor={fieldId} className={labelCls}>{label}</label>}
      <textarea
        id={fieldId}
        rows={rows}
        className={`${fieldBase} px-4 py-2.5 resize-none ${errCls} ${className}`}
        {...props}
      />
      {error      && <p className={errorCls}>{typeof error === 'string' ? error : error.message}</p>}
      {helperText && !error && <p className={helperCls}>{helperText}</p>}
    </div>
  );
}

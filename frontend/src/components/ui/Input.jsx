/**
 * Campos de formulario del panel — MODO CLARO estilo Apple.
 * Usan .input-light (index.css): blanco translúcido, hairline navy,
 * anillo celeste al enfocar. NO tocar .input-squircle (esa es la del
 * público sobre navy — Field/GlassField de Glass.jsx).
 */

const fieldBase = 'input-light';

const labelCls  = 'block text-[12.5px] font-bold tracking-tightish text-bg/60 mb-2';
const errorCls  = 'mt-1.5 text-[12.5px] font-medium text-rose';
const helperCls = 'mt-1.5 text-[12.5px] text-bg/45';

let uid = 0;
const nextId = (prefix) => `${prefix}-${++uid}`;

export default function Input({ label, error, helperText, size = 'md', className = '', id, ...props }) {
  const sizeCls = { sm: '!px-3 !py-2', md: '', lg: '!px-4 !py-4' }[size];
  const errCls  = error ? '!border-rose' : '';
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
  const errCls = error ? '!border-rose' : '';
  const fieldId = id || (label ? nextId('field') : undefined);

  return (
    <div className="w-full">
      {label && <label htmlFor={fieldId} className={labelCls}>{label}</label>}
      <select
        id={fieldId}
        className={`${fieldBase} pr-10 appearance-none cursor-pointer ${errCls} ${className}`}
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
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
  const errCls = error ? '!border-rose' : '';
  const fieldId = id || (label ? nextId('field') : undefined);

  return (
    <div className="w-full">
      {label && <label htmlFor={fieldId} className={labelCls}>{label}</label>}
      <textarea
        id={fieldId}
        rows={rows}
        className={`${fieldBase} resize-none ${errCls} ${className}`}
        {...props}
      />
      {error      && <p className={errorCls}>{typeof error === 'string' ? error : error.message}</p>}
      {helperText && !error && <p className={helperCls}>{helperText}</p>}
    </div>
  );
}

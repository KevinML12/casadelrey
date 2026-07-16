/**
 * Liquid Glass Chips — pastilla de cristal, mismo lenguaje que Badge/Eyebrow
 * del sitio público. Reemplaza el Chip M3 plano (bg-pri-con sólido).
 *
 * Chip (default):  assist / status — etiqueta no interactiva
 * FilterChip:      filtro interactivo, estado seleccionado + check
 */
import { Icon } from './Glass';

const colorMap = {
  default:   'bg-white/8 border border-white/12 text-white/75',
  primary:   'bg-celeste-soft/60 border border-celeste/30 text-celeste-hov',
  secondary: 'bg-white/8 border border-white/12 text-white',
  tertiary:  'bg-celeste-soft/60 border border-celeste/30 text-celeste-hov',
  error:     'bg-rose-soft/60 border border-rose/30 text-rose',
};

export default function Chip({ color = 'default', icon, children, className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full
        text-[12px] font-semibold whitespace-nowrap select-none
        ${colorMap[color]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} className="w-3.5 h-3.5" stroke={1.8} />}
      {children}
    </span>
  );
}

export function FilterChip({ selected, icon, count, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={
        'inline-flex items-center gap-1.5 h-8 px-4 rounded-full border ' +
        'text-[13px] font-semibold whitespace-nowrap ' +
        'cursor-pointer select-none transition-all duration-200 ' +
        (selected
          ? 'liquid-glass text-white border-white/25 '
          : 'bg-transparent text-white/50 border-white/12 hover:text-white hover:bg-white/6 '
        ) + className
      }
      {...props}
    >
      {selected && <Icon name="check" className="w-3.5 h-3.5" stroke={2.2} />}
      {!selected && icon && <Icon name={icon} className="w-3.5 h-3.5" stroke={1.8} />}
      <span>{children}</span>
      {count != null && (
        <span className={`text-[11px] ml-0.5 ${selected ? 'opacity-70' : 'opacity-50'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

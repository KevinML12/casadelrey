/**
 * Chips del panel — MODO CLARO estilo Apple (tinta navy sobre blanco).
 * Pastillas con tinte suave del color semántico, exclusivas del panel.
 *
 * Chip (default):  assist / status — etiqueta no interactiva
 * FilterChip:      filtro interactivo, estado seleccionado + check
 */
import { Icon } from './Glass';

const colorMap = {
  default:   'bg-bg/6 border border-bg/12 text-bg/70',
  primary:   'bg-celeste/12 border border-celeste/25 text-celeste',
  secondary: 'bg-bg/6 border border-bg/12 text-bg',
  tertiary:  'bg-celeste/10 border border-celeste/20 text-celeste',
  error:     'bg-rose/10 border border-rose/25 text-rose',
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
          ? 'bg-bg text-white border-bg shadow-card '
          : 'bg-transparent text-bg/55 border-bg/15 hover:text-bg hover:bg-bg/5 '
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

/**
 * M3 Chips — https://m3.material.io/components/chips
 *
 * Chip (default):  assist / status — non-interactive label, shape: small = 8dp
 * FilterChip:      interactive filter, selected state + check icon + state layer
 */

const colorMap = {
  default:   'bg-surf-high text-on-surf-var',
  primary:   'bg-pri-con text-on-pri-con',
  secondary: 'bg-sec-con text-on-sec-con',
  tertiary:  'bg-ter-con text-on-ter-con',
  error:     'bg-err-con text-on-err-con',
};

export default function Chip({ color = 'default', icon, children, className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1 h-7 px-3 rounded-lg
        text-label-m font-medium whitespace-nowrap select-none
        ${colorMap[color]} ${className}`}
      {...props}
    >
      {icon && <span className="ms" style={{ fontSize: 14 }}>{icon}</span>}
      {children}
    </span>
  );
}

export function FilterChip({ selected, icon, count, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={
        'inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border ' +
        'text-label-l font-medium whitespace-nowrap ' +
        'cursor-pointer select-none transition-all duration-150 ' +
        'relative overflow-hidden ' +
        'before:content-[""] before:absolute before:inset-0 before:opacity-0 ' +
        'before:transition-opacity before:duration-150 before:pointer-events-none ' +
        (selected
          ? 'bg-sec-con text-on-sec-con border-transparent before:bg-on-sec-con hover:before:opacity-[.08] active:before:opacity-[.12] '
          : 'bg-transparent text-on-surf-var border-outline-var before:bg-on-surf hover:before:opacity-[.08] active:before:opacity-[.12] '
        ) + className
      }
      {...props}
    >
      <span className="ms" style={{ fontSize: 16, opacity: selected ? 1 : 0, width: selected ? 'auto' : 0, overflow: 'hidden', transition: 'all .15s' }}>check</span>
      {!selected && icon && <span className="ms" style={{ fontSize: 16 }}>{icon}</span>}
      <span>{children}</span>
      {count != null && (
        <span className={`text-label-s ml-0.5 ${selected ? 'opacity-70' : 'opacity-60'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

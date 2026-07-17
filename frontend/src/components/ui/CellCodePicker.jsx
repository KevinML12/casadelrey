/**
 * CellCodePicker — selector de tipo y número de célula.
 *
 * Genera automáticamente el código estandarizado (H1, M2, J3, P1, N2).
 *
 * Props:
 *   cellCode  {string}   — valor actual del código, ej. "H2"
 *   cellType  {string}   — valor actual del tipo, ej. "hombres"
 *   onChange  {function} — recibe ({ cell_code, cell_type }) cuando cambia
 *   disabled  {boolean}  — deshabilita el picker
 *   className {string}   — clases extra para el contenedor
 */

export const CELL_TYPES = [
  { value: 'hombres', label: 'Hombres',      prefix: 'H' },
  { value: 'mujeres', label: 'Mujeres',      prefix: 'M' },
  { value: 'jovenes', label: 'Jóvenes',      prefix: 'J' },
  { value: 'prejus',  label: 'Prejuveniles', prefix: 'P' },
  { value: 'ninos',   label: 'Niños',        prefix: 'N' },
];

const PREFIX_TO_TYPE = Object.fromEntries(CELL_TYPES.map(t => [t.prefix, t.value]));

/** Descompone "H2" → { type: 'hombres', number: '2' } */
export function parseCode(code = '') {
  if (!code) return { type: '', number: '' };
  const prefix = code[0]?.toUpperCase();
  const number = code.slice(1);
  return { type: PREFIX_TO_TYPE[prefix] || '', number };
}

/** Construye "H2" desde type='hombres' y number='2' */
export function buildCode(type, number) {
  const t = CELL_TYPES.find(ct => ct.value === type);
  if (!t || !number) return '';
  return `${t.prefix}${number}`;
}

const selectCls = 'h-10 px-3 rounded-xl border border-bg/10 bg-transparent text-body-s text-bg hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all disabled:opacity-50 cursor-pointer';
const inputCls  = 'w-20 h-10 px-3 rounded-xl border border-bg/10 bg-transparent text-body-s text-bg text-center hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all disabled:opacity-50';

export default function CellCodePicker({ cellCode, cellType, onChange, disabled = false, className = '' }) {
  const parsed   = parseCode(cellCode);
  const type     = cellType  || parsed.type   || '';
  const number   = parsed.number || '';

  const emit = (newType, newNumber) => {
    const code = buildCode(newType, newNumber);
    onChange?.({ cell_code: code, cell_type: newType });
  };

  const handleType = e => emit(e.target.value, number);
  const handleNum  = e => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2); // solo dígitos, máx 2
    emit(type, val);
  };

  const preview = buildCode(type, number);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Selector de tipo */}
      <select value={type} onChange={handleType} disabled={disabled} className={selectCls}>
        <option value="">Tipo de célula…</option>
        {CELL_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label} ({t.prefix}X)</option>
        ))}
      </select>

      {/* Número */}
      <input
        type="text"
        inputMode="numeric"
        value={number}
        onChange={handleNum}
        placeholder="Nº"
        disabled={disabled || !type}
        className={inputCls}
      />

      {/* Preview del código generado */}
      {preview ? (
        <span className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-bg text-white text-label-l font-bold font-mono">
          {preview}
        </span>
      ) : (
        <span className="inline-flex items-center px-3 h-10 rounded-xl border border-dashed border-bg/15 text-label-m text-bg/40 font-mono">
          —
        </span>
      )}
    </div>
  );
}

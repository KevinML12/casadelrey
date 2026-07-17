import { Icon } from './Glass';

// Panel en MODO CLARO (jul-2026): card blanca escarchada (.glass-light)
// sobre canvas off-white, tinta navy. El pozo de ícono es estilo iOS
// Ajustes: cuadrado redondeado de color SÓLIDO con el glifo en blanco.
//
// pri/ter usaban celeste/celeste-hov (azul brillante saturado) — se leía
// "de juguete/IA". El acento por defecto pasa a ser el MISMO navy que ya
// es la tinta de todo el sitio público (--bg), no un azul nuevo — la
// marca es monocromática navy+blanco, el celeste queda solo para estados
// muy puntuales (enlaces, focus ring), nunca como color de bloque grande.
const TINTS = {
  pri: { well: 'bg-bg',          val: 'text-bg' },
  sec: { well: 'bg-amber',       val: 'text-bg' },
  ter: { well: 'bg-celeste-soft', val: 'text-bg' },
  err: { well: 'bg-rose',        val: 'text-bg' },
  ok:  { well: 'bg-emerald',     val: 'text-bg' },
};

// variant="dark" queda disponible por si algún contexto vuelve a canvas
// navy, pero el default del panel es claro.
export default function StatCard({ icon, label, value, tint = 'pri', sub, variant = 'light' }) {
  const t = TINTS[tint] || TINTS.pri;
  const light = variant !== 'dark';
  return (
    <div className={`${light ? 'glass-light' : 'liquid-glass'} rounded-[24px] card-spring p-5 flex flex-col gap-3`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-whisper ${t.well}`}>
        <Icon name={icon} className="w-5 h-5 text-white" stroke={2} />
      </div>
      <div>
        <p className={`text-[11px] uppercase tracking-widest mb-1 ${light ? 'text-bg/50' : 'text-white/40'}`}>{label}</p>
        <p className={`text-[28px] font-black leading-tight ${light ? t.val : 'text-white'}`}>{value ?? '—'}</p>
        {sub && <p className={`text-[11.5px] mt-0.5 ${light ? 'text-bg/45' : 'text-white/40'}`}>{sub}</p>}
      </div>
    </div>
  );
}

import { Icon } from './Glass';

// Promovido desde Dashboard.jsx (era local, duplicado en espíritu por
// otros bloques de stat ad-hoc del panel) — mismo lenguaje liquid-glass
// que el resto del sitio en vez de las cards MD3 planas bg-surf-low.
const TINTS = {
  pri: { chip: 'bg-celeste-soft/60 text-celeste-hov', val: 'text-white', chipLight: 'bg-celeste/15 text-celeste' },
  sec: { chip: 'bg-amber-soft/60 text-amber',         val: 'text-amber', chipLight: 'bg-amber/15 text-amber' },
  ter: { chip: 'bg-celeste-soft/60 text-celeste-hov', val: 'text-celeste-hov', chipLight: 'bg-celeste/15 text-celeste' },
  err: { chip: 'bg-rose-soft/60 text-rose',           val: 'text-rose', chipLight: 'bg-rose/15 text-rose' },
  ok:  { chip: 'bg-emerald-soft/60 text-emerald',     val: 'text-emerald', chipLight: 'bg-emerald/15 text-emerald' },
};

// variant="light": el acento blanco (.glass-light) — regla del sistema:
// donde el módulo/página no tiene foto de fondo, esta es la superficie
// por defecto (reemplaza a liquid-glass); listas/tablas densas pueden
// quedarse oscuras si la legibilidad lo pide. El chip de ícono conserva
// el color del tint (celeste/ámbar/rosa/esmeralda) sobre blanco — solo
// el texto pasa a navy.
export default function StatCard({ icon, label, value, tint = 'pri', sub, variant = 'dark' }) {
  const t = TINTS[tint] || TINTS.pri;
  const light = variant === 'light';
  return (
    <div className={`${light ? 'glass-light' : 'liquid-glass'} rounded-[24px] p-5 flex flex-col gap-3`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${light ? t.chipLight : t.chip}`}>
        <Icon name={icon} className="w-5 h-5" stroke={1.8} />
      </div>
      <div>
        <p className={`text-[11px] uppercase tracking-widest mb-1 ${light ? 'text-bg/55' : 'text-white/40'}`}>{label}</p>
        <p className={`text-[28px] font-black leading-tight ${light ? 'text-bg' : t.val}`}>{value ?? '—'}</p>
        {sub && <p className={`text-[11.5px] mt-0.5 ${light ? 'text-bg/50' : 'text-white/40'}`}>{sub}</p>}
      </div>
    </div>
  );
}

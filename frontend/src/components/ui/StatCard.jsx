import { Icon } from './Glass';

// Promovido desde Dashboard.jsx (era local, duplicado en espíritu por
// otros bloques de stat ad-hoc del panel) — mismo lenguaje liquid-glass
// que el resto del sitio en vez de las cards MD3 planas bg-surf-low.
const TINTS = {
  pri: { icon: 'text-celeste-hov', iconLight: 'text-celeste', val: 'text-white' },
  sec: { icon: 'text-amber',       iconLight: 'text-amber',   val: 'text-amber' },
  ter: { icon: 'text-celeste-hov', iconLight: 'text-celeste', val: 'text-celeste-hov' },
  err: { icon: 'text-rose',        iconLight: 'text-rose',    val: 'text-rose' },
  ok:  { icon: 'text-emerald',     iconLight: 'text-emerald', val: 'text-emerald' },
};

// variant="light": el acento blanco (.glass-light) — regla del sistema:
// donde el módulo/página no tiene foto de fondo, esta es la superficie
// por defecto (reemplaza a liquid-glass); listas/tablas densas pueden
// quedarse oscuras si la legibilidad lo pide.
//
// El pozo de ícono es CRISTAL, no un círculo de color plano — antes era
// solo bg-celeste/15 sin bisel ni brillo, se veía plano/plástico al lado
// del dropdown del header (que sí usa el material real). Ahora usa la
// misma clase .liquid-glass/.glass-light que la card exterior: hereda
// gradiente, bisel asimétrico y el brillo que sigue al cursor gratis (lo
// pinta useGlassSpecular.js, no hace falta nada extra aquí). El color del
// tint queda solo en el ícono, no en el fondo.
export default function StatCard({ icon, label, value, tint = 'pri', sub, variant = 'dark' }) {
  const t = TINTS[tint] || TINTS.pri;
  const light = variant === 'light';
  const material = light ? 'glass-light' : 'liquid-glass';
  return (
    <div className={`${material} rounded-[24px] p-5 flex flex-col gap-3`}>
      <div className={`${material} w-10 h-10 rounded-2xl flex items-center justify-center`}>
        <Icon name={icon} className={`w-5 h-5 ${light ? t.iconLight : t.icon}`} stroke={1.8} />
      </div>
      <div>
        <p className={`text-[11px] uppercase tracking-widest mb-1 ${light ? 'text-bg/55' : 'text-white/40'}`}>{label}</p>
        <p className={`text-[28px] font-black leading-tight ${light ? 'text-bg' : t.val}`}>{value ?? '—'}</p>
        {sub && <p className={`text-[11.5px] mt-0.5 ${light ? 'text-bg/50' : 'text-white/40'}`}>{sub}</p>}
      </div>
    </div>
  );
}

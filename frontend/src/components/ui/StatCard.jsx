// Panel en MODO CLARO (jul-2026): card blanca escarchada (.glass-light)
// sobre canvas off-white, tinta navy.
//
// Sin ícono a propósito (ago-2026) -- antes había un pozo cuadrado con un
// glifo adentro; ahora el color semántico tiñe directamente el número
// grande (el dato real), nada de pictograma decorativo. `icon` se
// conserva en la firma por compatibilidad con callers viejos pero ya no
// se usa para nada.
const TINTS = {
  pri: 'text-bg',
  sec: 'text-amber',
  ter: 'text-acento',
  err: 'text-rose',
  ok:  'text-emerald',
};

// variant="dark" queda disponible por si algún contexto vuelve a canvas
// navy, pero el default del panel es claro.
//
// nested=true: usa .glass-light-nested (más transparente) en vez de
// .glass-light — para cuando la card vive DENTRO de un contenedor
// .glass-light (ej. SectionContainer del Dashboard), así se distinguen
// como dos capas de verdad en vez de dos superficies con la misma
// opacidad. Si la card NO tiene un .glass-light detrás (ej.
// LeaderDashboard, que la pone directo sobre el canvas), deja nested en
// false — .glass-light-nested sin nada semi-opaco detrás se lava.
export default function StatCard({ label, value, tint = 'pri', sub, variant = 'light', nested = false }) {
  const valColor = TINTS[tint] || TINTS.pri;
  const light = variant !== 'dark';
  const material = light ? (nested ? 'glass-light-nested' : 'glass-light') : 'liquid-glass';
  return (
    <div className={`${material} rounded-[24px] card-spring p-5 flex flex-col gap-2`}>
      <p className={`text-11 uppercase tracking-widest ${light ? 'text-bg/50' : 'text-white/40'}`}>{label}</p>
      <p className={`text-28 font-black leading-tight ${valColor}`}>{value ?? '—'}</p>
      {sub && <p className={`text-12 ${light ? 'text-bg/45' : 'text-white/40'}`}>{sub}</p>}
    </div>
  );
}

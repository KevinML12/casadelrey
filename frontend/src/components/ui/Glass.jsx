// ============================================================
//  Casa del Rey — Liquid Glass LIGHT primitives
//  Icon · Halos · Badge · GlassButton · Eyebrow · Field · Surface
//  Apple HIG · Lienzo blanco · Squircles · Spring physics
// ============================================================

import { forwardRef } from 'react';

/* ---------- Minimal stroked icons ---------- */
const PATHS = {
  menu:      <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="14" x2="21" y2="14" /></>,
  close:     <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  arrow:     <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></>,
  play:      <polygon points="8 5 19 12 8 19 8 5" fill="currentColor" stroke="none" />,
  pin:       <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></>,
  clock:     <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></>,
  calendar:  <><rect x="3.5" y="5" width="17" height="16" rx="3" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="3" x2="8" y2="6.5" /><line x1="16" y1="3" x2="16" y2="6.5" /></>,
  spark:     <path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
  heart:     <path d="M12 20s-7-4.4-9.2-9C1.2 7.7 3 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.3.6-1.1 1.8-2.3 3.8-2.3 3.2 0 5 3.2 3.4 6.5C19 15.6 12 20 12 20Z" />,
  book:      <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><line x1="4" y1="18.5" x2="20" y2="18.5" /></>,
  users:     <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2" /><path d="M16 5.2a3 3 0 0 1 0 5.8M16.5 14.9c2.5.4 4 2.3 4 5.1" /></>,
  music:     <><circle cx="7" cy="18" r="2.6" /><circle cx="18" cy="16" r="2.6" /><path d="M9.6 18V7l11-2.2v11" /></>,
  chat:      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5V7a2 2 0 0 1 2-2Z" />,
  check:     <polyline points="5 12.5 10 17.5 19 7" />,
  mail:      <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
  phone:     <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></>,
  youtube:   <><rect x="3" y="6" width="18" height="12" rx="4" /><polygon points="11 9.5 15 12 11 14.5" fill="currentColor" stroke="none" /></>,
  crown:     <path d="M4 17h16M4 17l-1.5-9 5 4 4.5-7 4.5 7 5-4L20 17" />,
  user:      <><circle cx="12" cy="8" r="4" /><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" /></>,
  lock:      <><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  search:    <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>,
  gift:      <><rect x="3.5" y="9" width="17" height="11" rx="2" /><path d="M3.5 13h17M12 9v11" /><path d="M12 9C9 9 7.5 4 12 4M12 9c3 0 4.5-5 0-5" /></>,
};

export function Icon({ name, className = 'w-5 h-5', stroke = 1.6 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ---------- Soft halos (Apple-style luminous backdrop on white) ---------- */
export function Halos({ variant = 'hero' }) {
  if (variant === 'hero') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="halo" style={{ width: 640, height: 640, top: -180, right: -140, background: 'radial-gradient(circle, rgba(59,130,246,0.26), transparent 70%)', animation: 'haloPulse 11s ease-in-out infinite' }} />
        <div className="halo" style={{ width: 520, height: 520, top: '30%', left: -160, background: 'radial-gradient(circle, rgba(96,165,250,0.18), transparent 70%)', animation: 'haloPulse 13s ease-in-out infinite' }} />
        <div className="halo" style={{ width: 520, height: 380, bottom: -200, left: '35%', background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)', animation: 'haloPulse 15s ease-in-out infinite' }} />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="halo" style={{ width: 480, height: 480, top: '10%', left: '-10%', background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)' }} />
      <div className="halo" style={{ width: 420, height: 420, bottom: '-10%', right: '-6%', background: 'radial-gradient(circle, rgba(96,165,250,0.12), transparent 70%)' }} />
    </div>
  );
}

/* ---------- Squircle white card with whisper shadow ---------- */
export function Surface({ as: As = 'div', className = '', children, ...rest }) {
  return (
    <As className={`bg-bg border border-ink-soft shadow-card rounded-card ${className}`} {...rest}>
      {children}
    </As>
  );
}

/* ---------- Pill badge (chip) — sapphire tint ---------- */
export function Badge({ children, icon, className = '', tone = 'celeste' }) {
  const styles = tone === 'celeste'
    ? 'bg-celeste-soft text-celeste-hov'
    : 'bg-bg-soft text-ink';
  return (
    <span className={`inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-[12px] font-bold tracking-tightish ${styles} ${className}`}>
      {icon && <Icon name={icon} className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </span>
  );
}

/* ---------- Section eyebrow — pill de cristal: en liquid glass el
   material ES el acento, nada de colores planos ---------- */
export function Eyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-2.5 mb-4 px-4 py-1.5 rounded-full liquid-glass text-white/90 text-[12.5px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      {children}
    </div>
  );
}

/* ---------- Pill button (squircle 12, spring physics) ---------- */
export const GlassButton = forwardRef(function GlassButton(
  { children, variant = 'primary', icon, className = '', as: As = 'button', ...props },
  ref,
) {
  const base = 'group inline-flex items-center justify-center gap-2 rounded-sm font-bold tracking-tightish btn-spring select-none cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    // Primary — sapphire fill, navy text? no: white text. Pop shadow.
    primary: 'px-6 py-3.5 text-[15px] text-white bg-celeste shadow-pri hover:bg-celeste-hov hover:shadow-pri-lg',
    // Glass — white translucent over light bg, ink text
    glass:   'px-6 py-3.5 text-[15px] text-ink glass glass-sheen hover:bg-white',
    // Ink — solid navy chip
    ink:     'px-6 py-3.5 text-[15px] text-white bg-ink hover:bg-celeste shadow-whisper',
    // Ghost — minimal
    ghost:   'px-5 py-2.5 text-[14px] text-ink-2 hover:text-ink hover:bg-bg-soft',
  };
  return (
    <As ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
      {icon && <Icon name={icon} className="w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-0.5" stroke={2} />}
    </As>
  );
});

/* ---------- Form field (input/select/textarea) ---------- */
export function Field({ label, type = 'text', name, value, onChange, error, placeholder, as = 'input', children, ...rest }) {
  const cls = `input-squircle ${error ? '!border-rose' : ''}`;
  return (
    <label className="block">
      <span className="block mb-2 text-[12.5px] font-bold tracking-tightish text-ink-2">{label}</span>
      {as === 'select' ? (
        <select name={name} value={value} onChange={onChange} className={`${cls} appearance-none cursor-pointer pr-10`} {...rest}>
          {children}
        </select>
      ) : as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} className={`${cls} resize-none`} {...rest} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={cls} {...rest} />
      )}
      {error && <span className="mt-1.5 block text-[12.5px] text-rose font-bold">{error}</span>}
    </label>
  );
}

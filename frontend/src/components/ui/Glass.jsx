// ============================================================
//  Casa del Rey — Liquid Glass LIGHT primitives
//  Badge · GlassButton · Field · Surface
//  Apple HIG · Lienzo blanco · Squircles · Spring physics
// ============================================================

import { forwardRef } from 'react';

/* ---------- Pill badge (chip) — sapphire tint. Sin ícono a propósito
   (ago-2026) -- solo texto, `icon` se ignora si algún caller viejo aún
   lo pasa. ---------- */
export function Badge({ children, className = '', tone = 'acento' }) {
  const styles = tone === 'acento'
    ? 'bg-acento-soft text-acento-hov'
    : 'bg-bg-soft text-ink';
  return (
    <span className={`inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-12 font-bold tracking-tightish ${styles} ${className}`}>
      <span>{children}</span>
    </span>
  );
}

/* ---------- Pill button (lenguaje actual del sitio) ----------
   Antes: relleno bg-acento plano + rounded-sm — sobreviviente del
   sistema S9 viejo, se leía "botón genérico de IA". La guía es clara:
   el material ES el acento, nada de colores planos. El primario del
   sitio es el pill BLANCO (como en el hero/Login), el secundario es
   cristal con borde. */
// Sin íconos a propósito (pedido del usuario, ago-2026): el botón es solo
// texto -- ni siquiera la flechita que se deslizaba al hover. La prop
// `icon` se conserva en la firma por compatibilidad con callers viejos
// (si alguno todavía la pasa, se ignora en silencio) pero ya no renderiza
// nada; no queda ningún <Icon> en el componente.
export const GlassButton = forwardRef(function GlassButton(
  { children, variant = 'primary', className = '', as: As = 'button', ...props },
  ref,
) {
  const base = 'group inline-flex items-center justify-center gap-2 rounded-pill font-bold tracking-tightish btn-spring select-none cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    // Primario — pill blanco sobre navy (el CTA estándar del sitio)
    primary: 'px-6 py-3.5 text-15 text-bg bg-white shadow-card hover:shadow-card-lg',
    // Cristal — vidrio con borde, texto blanco
    glass:   'px-6 py-3.5 text-15 text-white liquid-glass border border-white/20 hover:border-white/40',
    // Ghost — mínimo
    ghost:   'px-5 py-2.5 text-14 text-white/60 hover:text-white hover:bg-white/5',
  };
  return (
    <As ref={ref} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </As>
  );
});

/* ---------- Campo de formulario público (sobre cristal/navy) ----------
   Para páginas públicas (auth, formularios sobre .liquid-glass). El
   Input de ui/Input.jsx es Material Design 3 y es EXCLUSIVO del panel
   admin — no mezclarlo en el público (docs/DISENO_LIQUID_GLASS.md §1). */
const glassFieldStyle = {
  background: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.12)',
  color: '#fff',
};

export function GlassField({ label, error, helperText, className = '', ...props }) {
  return (
    <label className="block text-left">
      {label && <span className="block text-13 font-semibold text-white/60 mb-2">{label}</span>}
      <input className={`input-squircle ${className}`} style={glassFieldStyle} {...props} />
      {error && <span className="block text-13 font-medium text-rose mt-1.5">{error}</span>}
      {helperText && !error && <span className="block text-13 text-white/40 mt-1.5">{helperText}</span>}
    </label>
  );
}

/* ---------- Form field (input/select/textarea) ---------- */
export function Field({ label, type = 'text', name, value, onChange, error, placeholder, as = 'input', children, ...rest }) {
  const cls = `input-squircle ${error ? '!border-rose' : ''}`;
  return (
    <label className="block">
      <span className="block mb-2 text-13 font-bold tracking-tightish text-ink-2">{label}</span>
      {as === 'select' ? (
        <select name={name} value={value} onChange={onChange} className={`${cls} appearance-none cursor-pointer pr-10`} {...rest}>
          {children}
        </select>
      ) : as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} className={`${cls} resize-none`} {...rest} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={cls} {...rest} />
      )}
      {error && <span className="mt-1.5 block text-13 text-rose font-bold">{error}</span>}
    </label>
  );
}

/* ---------- Form field, variante CLARA (formularios públicos sobre una
   card .glass-light -- Donar, Oración, Conéctate, Comprobante) ----------
   Antes esos 4 formularios pedían prestada `.input-light`, la clase del
   panel admin (index.css la documenta como tal), cada uno reimplementando
   su propio `fieldCls`/label local a mano -- funcionaba visualmente porque
   la clase en sí es correcta para un fondo claro, pero mezclaba el
   vocabulario del panel dentro del sitio público y dejó 4 copias casi
   idénticas del mismo campo. `FieldLight` centraliza eso en un componente
   propio del público (mismo patrón que `Field`, mismo `.input-light`) sin
   pedir prestado `components/ui/Input.jsx` del admin.
   Nota importante conservada de los comentarios que reemplaza: el fondo
   NO puede bajarse a algo translúcido tipo `bg-bg/4` -- el navegador pinta
   el fondo nativo de inputs/selects OSCURO cuando `color-scheme:dark` está
   activo en el `<html>` (todo el sitio público lo tiene), y una opacidad
   baja no lo tapa -- el campo se ve gris oscuro sólido en vez de claro.
   Bug real encontrado en producción; `.input-light` (blanco ~75% opaco) es
   lo mínimo que lo cubre de forma confiable. */
export function FieldLight({ label, type = 'text', name, value, onChange, error, placeholder, as = 'input', children, ...rest }) {
  const cls = `input-light ${error ? '!border-rose' : ''}`;
  // error acepta string simple O el objeto {message} que devuelve
  // react-hook-form (PrayerForm.jsx) -- mismo criterio que ya usa
  // components/ui/Input.jsx del panel.
  const errorMsg = typeof error === 'string' ? error : error?.message;
  return (
    <label className="block">
      <span className="block mb-2 text-13 font-bold tracking-tightish text-bg/60">{label}</span>
      {as === 'select' ? (
        <select name={name} value={value} onChange={onChange} className={`${cls} appearance-none cursor-pointer pr-10`} {...rest}>
          {children}
        </select>
      ) : as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} className={`${cls} resize-none`} {...rest} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={cls} {...rest} />
      )}
      {errorMsg && <span className="mt-1.5 block text-13 text-rose font-bold">{errorMsg}</span>}
    </label>
  );
}

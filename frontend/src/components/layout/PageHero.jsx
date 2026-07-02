import { Halos } from '../ui/Glass';

// Shared page hero — Liquid Glass Dark Mode.
// Backward-compatible: legacy callers pass `icon` (Material Symbol name string),
// `title`, `subtitle`, and optional `children` (CTAs underneath).
export default function PageHero({ icon, eyebrow, title, subtitle, children }) {
  return (
    <section className="relative pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden bg-bg">
      <Halos variant="hero" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center animate-rise">
        {(icon || eyebrow) && (
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 liquid-glass border border-white/20 mb-6">
            {icon && (
              <span className="material-symbols-rounded text-white/80" style={{ fontSize: 16 }}>{icon}</span>
            )}
            {eyebrow && (
              <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">{eyebrow}</span>
            )}
          </div>
        )}
        <h1
          className="display-mega text-white"
          style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 text-[17px] md:text-[19px] leading-relaxed text-white/70 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-9 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </section>
  );
}

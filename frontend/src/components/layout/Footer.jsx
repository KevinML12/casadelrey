import { Link } from 'react-router-dom';
import { Icon } from '../ui/Glass';

const NAV = [
  { id: '/',            label: 'Inicio' },
  { id: '/about',       label: 'Nosotros' },
  { id: '/blog',        label: 'Enseñanzas' },
  { id: '/events',      label: 'Eventos' },
  { id: '/volunteering',label: 'Voluntariado' },
  { id: '/donate',      label: 'Donar' },
];

const SOCIAL = [
  { name: 'instagram', href: '#' },
  { name: 'youtube',   href: '#' },
  { name: 'chat',      href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden pt-20 pb-10 bg-bg text-ink">
      {/* Halo celeste suave detrás del CTA — luz, no oscuridad */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="halo"
          style={{
            width: 720,
            height: 480,
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(59,130,246,0.20), transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* ── CTA band INVERTIDO: Dark Navy con texto blanco ── */}
        <div
          className="relative rounded-2xl overflow-hidden p-10 md:p-16 text-center"
          style={{
            background: 'linear-gradient(160deg, #0F172A 0%, #0A1526 100%)',
            boxShadow: '0 32px 80px -24px rgba(10,21,38,0.45), 0 0 0 1px rgba(10,21,38,0.08)',
          }}
        >
          {/* Halo interno celeste — vida sobre el navy */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="halo"
              style={{
                width: 520,
                height: 520,
                top: -180,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'radial-gradient(circle, rgba(59,130,246,0.45), transparent 70%)',
                opacity: 0.7,
              }}
            />
            <div
              className="halo"
              style={{
                width: 360,
                height: 360,
                bottom: -140,
                right: -80,
                background: 'radial-gradient(circle, rgba(96,165,250,0.30), transparent 70%)',
              }}
            />
          </div>

          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-celeste to-transparent" />
              <span className="text-celeste text-[11px] font-bold uppercase tracking-widest">
                Te esperamos
              </span>
              <span className="h-px w-10 bg-gradient-to-l from-celeste to-transparent" />
            </div>

            <h3
              className="display-mega text-white"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)' }}
            >
              Tu lugar ya está{' '}
              <span className="text-grad-celeste">guardado</span>
              <span className="text-celeste">.</span>
            </h3>
            <p className="mt-5 text-[17px] md:text-[18px] text-white/70 max-w-md mx-auto font-medium">
              Este domingo te esperamos. Ven con quien quieras.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-sm bg-celeste text-white text-[15px] font-bold tracking-tightish shadow-pri btn-spring hover:bg-celeste-hov hover:shadow-pri-lg focus-ring"
              >
                Planifica tu visita
                <Icon name="arrow" className="w-[18px] h-[18px]" stroke={2} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-sm bg-white/10 text-white text-[15px] font-bold tracking-tightish border border-white/15 btn-spring hover:bg-white/15 focus-ring"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                Conéctate
              </Link>
            </div>
          </div>
        </div>

        {/* ── Links row — light footer ── */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid place-items-center w-10 h-10 rounded-md bg-celeste text-white shadow-pri">
              <Icon name="crown" className="w-5 h-5" stroke={2} />
            </span>
            <span className="text-[16px] font-extrabold tracking-tightish text-ink">Casa del Rey</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {NAV.map(n => (
              <Link
                key={n.id}
                to={n.id}
                className="text-[14px] font-semibold text-ink-2 hover:text-celeste transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {SOCIAL.map(s => (
              <a
                key={s.name}
                href={s.href}
                className="grid place-items-center w-10 h-10 rounded-full bg-bg-soft text-ink-2 hover:bg-celeste-soft hover:text-celeste-hov transition-all card-spring"
                aria-label={s.name}
              >
                <Icon name={s.name} className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ink-soft flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-ink-3">
          <span>© 2026 Casa del Rey · Iglesia de jóvenes · Huehuetenango</span>
          <span>Hecho con luces encendidas ✦</span>
        </div>
      </div>
    </footer>
  );
}

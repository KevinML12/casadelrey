import { Link } from 'react-router-dom';
import { IconButton } from '../ui/Button';

const MINISTERIOS = [
  { label: 'Blog & Enseñanzas', to: '/blog' },
  { label: 'Eventos',           to: '/events' },
  { label: 'Galería',           to: '/gallery' },
  { label: 'Oración',          to: '/prayer' },
  { label: 'Voluntariado',     to: '/volunteering' },
  { label: 'Células',          to: '/cells' },
];

const IGLESIA = [
  { label: 'Conócenos',       to: '/about' },
  { label: 'Nuestros pastores', to: '/about' },
  { label: 'Visión & Misión', to: '/about' },
  { label: 'Donaciones',      to: '/donate' },
];

export default function Footer() {
  return (
    // Footer siempre usa hero-surf (navy fijo — no cambia con el tema)
    <footer className="hero-surf">
      <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">

          {/* Brand */}
          <div>
            <img
              src="/logo.png"
              alt="Casa del Rey"
              className="h-14 w-auto object-contain mb-4"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <p className="text-body-s leading-relaxed max-w-[280px]" style={{ color: 'rgba(255,255,255,.38)' }}>
              Iglesia cristiana de restauración familiar en Huehuetenango, Guatemala.
            </p>

            {/* Redes — M3 Icon Buttons */}
            <div className="flex gap-2 mt-5">
              <a href="https://instagram.com/ig.casadelrey" target="_blank" rel="noreferrer">
                <IconButton
                  className="text-white/50"
                  style={{ background: 'rgba(255,255,255,.06)' }}
                  aria-label="Instagram"
                >
                  <span className="ms" style={{ fontSize: 20 }}>photo_camera</span>
                </IconButton>
              </a>
              <a href="#" target="_blank" rel="noreferrer">
                <IconButton
                  className="text-white/50"
                  style={{ background: 'rgba(255,255,255,.06)' }}
                  aria-label="YouTube"
                >
                  <span className="ms" style={{ fontSize: 20 }}>play_circle</span>
                </IconButton>
              </a>
              <a href="#" target="_blank" rel="noreferrer">
                <IconButton
                  className="text-white/50"
                  style={{ background: 'rgba(255,255,255,.06)' }}
                  aria-label="Facebook"
                >
                  <span className="ms" style={{ fontSize: 20 }}>thumb_up</span>
                </IconButton>
              </a>
            </div>
          </div>

          {/* Ministerios */}
          <div>
            <p className="text-label-m mb-4" style={{ color: 'rgba(255,255,255,.3)' }}>
              Ministerios
            </p>
            <ul className="space-y-3">
              {MINISTERIOS.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-body-s transition-colors duration-150"
                    style={{ color: 'rgba(255,255,255,.55)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.85)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Iglesia */}
          <div>
            <p className="text-label-m mb-4" style={{ color: 'rgba(255,255,255,.3)' }}>
              Iglesia
            </p>
            <ul className="space-y-3">
              {IGLESIA.map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-body-s transition-colors duration-150"
                    style={{ color: 'rgba(255,255,255,.55)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.85)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <p className="text-label-m mb-4" style={{ color: 'rgba(255,255,255,.3)' }}>
              Contacto
            </p>
            <ul className="space-y-3 text-body-s" style={{ color: 'rgba(255,255,255,.55)' }}>
              <li className="flex items-start gap-2">
                <span className="ms mt-0.5" style={{ fontSize: 16, color: 'rgba(255,255,255,.3)' }}>location_on</span>
                7a. calle 12-66 zona 4, Huehuetenango
              </li>
              <li className="flex items-center gap-2">
                <span className="ms" style={{ fontSize: 16, color: 'rgba(255,255,255,.3)' }}>schedule</span>
                Domingos · 10:00 AM
              </li>
              <li className="flex items-center gap-2">
                <span className="ms" style={{ fontSize: 16, color: 'rgba(255,255,255,.3)' }}>schedule</span>
                Miércoles · 7:00 PM
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 border-t text-body-s"
          style={{ borderColor: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.2)' }}
        >
          <span>© 2026 Casa del Rey — Luz para las Naciones</span>
          <span>Huehuetenango, Guatemala</span>
        </div>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import { useApi } from '../../lib/feed';
import { socialProfiles } from '../../lib/socialProfiles';

// Solo datos CONFIRMADOS (CONTEXTO_IGLESIA jul-2026): dirección real,
// redes oficiales, podcast y fundadores. Nada inventado — teléfono,
// correo y horarios se agregan cuando el pastor los entregue.
const NAV = [
  { id: '/',             label: 'Inicio' },
  { id: '/about',        label: 'Nosotros' },
  { id: '/celulas',      label: 'Células' },
  { id: '/volunteering', label: 'Voluntariado' },
  { id: '/events',       label: 'Eventos' },
  { id: '/blog',         label: 'Blog' },
  { id: '/gallery',      label: 'Galería' },
  { id: '/donate',       label: 'Dar' },
];

// Sin logo/ícono de plataforma a propósito (ago-2026) -- el nombre de la
// red como texto identifica igual de bien a dónde lleva cada link, sin
// pictogramas.
export default function Footer() {
  const settings = useApi('/settings') || {};
  return (
    <footer className="relative bg-bg pt-14 sm:pt-20 pb-8 border-t border-white/5 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6">

        <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-10 md:gap-12 mb-10 sm:mb-14">
          {/* Marca */}
          <div className="flex flex-col items-start gap-5">
            <Link to="/" className="flex items-center gap-4 rounded-lg focus-ring">
              <img
                src="/logo.png"
                alt="Casa del Rey"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
              />
              <div>
                <span className="block text-20 font-bold tracking-tightish text-white">Casa del Rey</span>
                <span className="block text-13 text-white/70 font-medium">Iglesia cristiana · Huehuetenango</span>
              </div>
            </Link>
            {settings.about_founders_names && <p className="text-14 text-white/70 font-medium leading-relaxed max-w-xs">{settings.about_founders_names}</p>}
            <div className="flex flex-wrap items-center gap-2.5">
              {socialProfiles(settings).map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-action min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-[12px] liquid-glass text-13 font-semibold text-white/85 hover:text-white focus-ring"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <nav aria-label="Explora la iglesia">
            <p className="text-13 font-semibold text-white/60 mb-3">Explora</p>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-5">
              {NAV.map(n => (
                <li key={n.id}>
                  <Link to={n.id} className="inline-flex min-h-11 items-center rounded-lg text-14 font-semibold text-white/80 hover:text-white transition-colors duration-150 focus-ring">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Visítanos + podcast */}
          <div>
            <p className="text-13 font-semibold text-white/60 mb-5">Visítanos</p>
            {settings.about_address && (settings.about_map_url ? <a href={settings.about_map_url} target="_blank" rel="noopener noreferrer" className="block min-h-11 rounded-lg text-14 text-white/80 hover:text-white leading-relaxed focus-ring">{settings.about_address}</a> : <p className="text-14 text-white/70 leading-relaxed">{settings.about_address}</p>)}
            {settings.about_podcast_schedule && <div className="mt-5 text-14 text-white/70 leading-relaxed"><p className="font-bold text-white">{settings.about_podcast_title}</p><p>{settings.about_podcast_schedule}</p></div>}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-white/60 text-13 font-medium border-t border-white/5 pt-8">
          <p>© {new Date().getFullYear()} Iglesia Cristiana Casa del Rey. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

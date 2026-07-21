import { Link } from 'react-router-dom';
import { Icon } from '../ui/Glass';

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

const SOCIAL = [
  { name: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/ig.casadelrey/' },
  { name: 'heart',     label: 'Facebook',  href: 'https://www.facebook.com/casadelreyhuehue' },
  { name: 'music',     label: 'TikTok',    href: 'https://www.tiktok.com/@leoneldeleongt' },
  { name: 'spark',     label: 'X',         href: 'https://x.com/pastorleoneli' },
];

export default function Footer() {
  return (
    <footer className="relative bg-bg pt-20 pb-10 border-t border-white/5 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6">

        <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-12 mb-14">
          {/* Marca */}
          <div className="flex flex-col items-start gap-5">
            <Link to="/" className="flex items-center gap-4 group">
              <img
                src="/logo.png"
                alt="Casa del Rey"
                className="w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-500"
              />
              <div>
                <span className="block text-20 font-extrabold tracking-tightish text-white">Casa del Rey</span>
                <span className="block text-13 text-white/50 font-medium">Iglesia cristiana · Huehuetenango</span>
              </div>
            </Link>
            <p className="text-14 text-white/50 font-medium leading-relaxed max-w-xs">
              Fundada por el Pastor José de León y Desidería López.
            </p>
            <div className="flex items-center gap-2.5">
              {SOCIAL.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid place-items-center w-11 h-11 rounded-full liquid-glass text-white/60 hover:text-white transition-all duration-300 hover:scale-110"
                  aria-label={s.label}
                >
                  <Icon name={s.name} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <div>
            <p className="text-13 font-semibold text-white/40 mb-5">Explora</p>
            <ul className="space-y-3">
              {NAV.map(n => (
                <li key={n.id}>
                  <Link to={n.id} className="text-15 font-semibold text-white/70 hover:text-white transition-colors">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visítanos + podcast */}
          <div>
            <p className="text-13 font-semibold text-white/40 mb-5">Visítanos</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Casa+del+Rey+7a+Calle+12-66+zona+4+Huehuetenango"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 text-14 text-white/70 hover:text-white transition-colors font-medium leading-relaxed"
            >
              <Icon name="pin" className="w-4 h-4 mt-1 shrink-0" />
              <span>7ª. Calle 12-66 zona 4,<br />carretera a las Ruinas de Zaculeu,<br />Huehuetenango</span>
            </a>
            <div className="flex items-start gap-3 mt-5 text-14 text-white/70 font-medium leading-relaxed">
              <Icon name="music" className="w-4 h-4 mt-1 shrink-0" />
              <span>
                Podcast <span className="text-white font-bold">Inusual Youth</span><br />
                92.9 FM Radio Stereo Cumbre<br />
                Viernes · 3:00 PM
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-white/40 text-13 font-medium border-t border-white/5 pt-8">
          <p>© {new Date().getFullYear()} Iglesia Cristiana Casa del Rey. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import { Icon } from '../ui/Glass';

const NAV = [
  { id: '/',            label: 'Inicio' },
  { id: '/about',       label: 'Ministerios' },
  { id: '/blog',        label: 'Enseñanzas' },
  { id: '/events',      label: 'Eventos' },
  { id: '/donate',      label: 'Dar' },
];

const SOCIAL = [
  { name: 'instagram', href: '#' },
  { name: 'youtube',   href: '#' },
  { name: 'chat',      href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative bg-bg pt-20 pb-10 border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col items-center">
        {/* Top: Logo & Socials */}
        <div className="flex flex-col items-center gap-8 mb-12">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="grid place-items-center w-12 h-12 rounded-[14px] bg-white text-bg group-hover:scale-105 transition-transform duration-500">
              <Icon name="crown" className="w-6 h-6" stroke={2} />
            </span>
            <span className="text-[20px] font-extrabold tracking-tightish text-white">Casa del Rey</span>
          </Link>

          <div className="flex items-center gap-3">
            {SOCIAL.map(s => (
              <a
                key={s.name}
                href={s.href}
                className="grid place-items-center w-12 h-12 rounded-full liquid-glass text-white/60 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label={s.name}
              >
                <Icon name={s.name} className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

        {/* Bottom: Copyright */}
        <div className="text-center text-white/40 text-[13px] font-medium">
          <p>© {new Date().getFullYear()} Iglesia Cristiana Casa del Rey. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const LINKS = [
  { label: 'Conócenos',  to: '/about' },
  { label: 'Blog',       to: '/blog' },
  { label: 'Eventos',    to: '/events' },
  { label: 'Oración',    to: '/prayer' },
  { label: 'Células',    to: '/cells' },
  { label: 'Donaciones', to: '/donate' },
  { label: 'Voluntarios',to: '/volunteering' },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white/70">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-gold font-black text-sm">CR</span>
              </div>
              <span className="font-black text-white text-base">Casa del Rey</span>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              Iglesia en Huehuetenango, Guatemala. Luz para las naciones, amor para cada vida.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/casadelreyhuehue" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
                <Facebook size={15} />
              </a>
              <a href="https://www.instagram.com/ig.casadelrey/" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
                <Instagram size={15} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
                <Youtube size={15} />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Navegación</h4>
            <ul className="space-y-2.5">
              {LINKS.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Servicios</h4>
            <ul className="space-y-2.5 text-sm">
              <li>Domingo 10:00 AM</li>
              <li>Miércoles 7:00 PM</li>
              <li className="pt-1 text-white/50 text-xs">Células cada semana</li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="mt-0.5 shrink-0 text-gold" />
                <span>7a. Calle 12-66, Huehuetenango, Guatemala</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-gold" />
                <a href="tel:+50254260369" className="hover:text-white transition-colors">+502 5426-0369</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0 text-gold" />
                <a href="mailto:info@casadelreyhuehue.com" className="hover:text-white transition-colors">
                  info@casadelreyhuehue.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Casa del Rey — Huehuetenango, Guatemala</span>
          <span>Hecho con fe</span>
        </div>
      </div>
    </footer>
  );
}

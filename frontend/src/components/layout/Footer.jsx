import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const LINKS = [
  { label: 'Conócenos',  to: '/about' },
  { label: 'Blog',       to: '/blog' },
  { label: 'Eventos',    to: '/events' },
  { label: 'Oración',    to: '/prayer' },
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
              <a href="https://x.com/pastorleoneli" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors hover:bg-white/20"
                aria-label="X (Twitter)">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@leoneldeleongt" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors"
                aria-label="TikTok">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
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
                <span>7a. calle 12-66 zona 4, Carretera a las Ruinas de Zaculeu, Huehuetenango, Guatemala</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-gold" />
                <a href="tel:+50247600636" className="hover:text-white transition-colors">4760 0636</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0 text-gold" />
                <a href="mailto:casadelreyhuehue@gmail.com" className="hover:text-white transition-colors">
                  casadelreyhuehue@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <a href="https://wa.me/50247600636" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-gold" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>+502 4760 0636</span>
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

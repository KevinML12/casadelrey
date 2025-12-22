import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-dark-bg border-t border-border-light dark:border-dark-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo y Descripción */}
          <div>
            <h3 className="text-xl font-bold text-primary dark:text-primary-light mb-2">Casa del Rey</h3>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Comunidad de fe dedicada al servicio, la oración y el crecimiento espiritual.
            </p>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-4">Navegación</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors">
                  Eventos
                </Link>
              </li>
              <li>
                <Link to="/prayer" className="text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors">
                  Oración
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                <Mail size={16} />
                <a href="mailto:info@casadelrey.com" className="hover:text-primary dark:hover:text-primary-light transition-colors">
                  info@casadelrey.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                <Phone size={16} />
                <a href="tel:+1234567890" className="hover:text-primary dark:hover:text-primary-light transition-colors">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                <MapPin size={16} />
                <span>Calle Principal 123</span>
              </li>
            </ul>
          </div>

          {/* Redes Sociales */}
          <div>
            <h4 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-4">Síguenos</h4>
            <div className="flex gap-4">
              <a href="https://facebook.com" className="text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" className="text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-light dark:border-dark-border pt-8">
          <p className="text-center text-text-muted dark:text-dark-text-muted text-sm">
            © {currentYear} Casa del Rey. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

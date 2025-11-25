import { PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import NewsletterSignup from '../NewsletterSignup';
import { useSiteConfig } from '../../context/SiteConfigContext';

const Footer = () => {
  const { config, isLoading } = useSiteConfig();

  return (
    <footer className="bg-white dark:bg-gray-950 text-dark-text dark:text-gray-300 transition-colors border-t border-gray-200/50 dark:border-gray-800/50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xs font-display font-bold text-dark-text dark:text-white uppercase tracking-widest">
              {config.church_name || 'CASA DEL REY'}
            </h3>
            <p className="text-sm text-dark-text/60 dark:text-gray-400 leading-relaxed font-normal">
              Una comunidad transformada por el amor de Cristo, sirviendo a nuestra ciudad con pasión y autenticidad.
            </p>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h4 className="text-xs font-display font-bold text-dark-text dark:text-white uppercase tracking-widest flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-accent-blue" />
              Contacto
            </h4>
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  {config.phone && (
                    <a 
                      href={`tel:${config.phone}`}
                      className="text-sm text-dark-text/70 dark:text-gray-400 hover:text-accent-blue transition-colors font-normal"
                    >
                      {config.phone}
                    </a>
                  )}
                  {config.email && (
                    <a 
                      href={`mailto:${config.email}`}
                      className="block text-sm text-dark-text/70 dark:text-gray-400 hover:text-accent-blue transition-colors font-normal truncate"
                    >
                      {config.email}
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h4 className="text-xs font-display font-bold text-dark-text dark:text-white uppercase tracking-widest flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-accent-blue" />
              Ubicación
            </h4>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ) : (
              config.address ? (
                <p className="text-sm text-dark-text/70 dark:text-gray-400 leading-relaxed font-normal whitespace-pre-line">
                  {config.address}
                </p>
              ) : null
            )}
          </div>

          {/* Horario */}
          <div className="space-y-4">
            <h4 className="text-xs font-display font-bold text-dark-text dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-accent-blue" />
              Horario
            </h4>
            <div className="space-y-2 text-sm text-dark-text/70 dark:text-gray-400 font-normal">
              <p><span className="text-dark-text/50 dark:text-gray-500">Dom:</span> 9:00 - 13:00</p>
              <p><span className="text-dark-text/50 dark:text-gray-500">Mié:</span> 19:00 - 21:00</p>
              <p><span className="text-dark-text/50 dark:text-gray-500">Vie:</span> 19:00 - 22:00</p>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <NewsletterSignup />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200/50 dark:border-gray-800/50 pt-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            {/* Social Links - Shopify style */}
            <div className="flex items-center gap-4">
              {isLoading ? (
                <div className="flex gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <>
                  {config.facebook_url && (
                    <a
                      href={config.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-dark-text/60 dark:text-gray-400 hover:bg-accent-blue/10 hover:text-accent-blue transition-all flex items-center justify-center"
                      aria-label="Facebook"
                    >
                      <FaFacebook className="w-4 h-4" />
                    </a>
                  )}
                  {config.instagram_url && (
                    <a
                      href={config.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-dark-text/60 dark:text-gray-400 hover:bg-accent-blue/10 hover:text-accent-blue transition-all flex items-center justify-center"
                      aria-label="Instagram"
                    >
                      <FaInstagram className="w-4 h-4" />
                    </a>
                  )}
                  {config.youtube_url && (
                    <a
                      href={config.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-dark-text/60 dark:text-gray-400 hover:bg-accent-blue/10 hover:text-accent-blue transition-all flex items-center justify-center"
                      aria-label="YouTube"
                    >
                      <FaYoutube className="w-4 h-4" />
                    </a>
                  )}
                  {config.twitter_url && (
                    <a
                      href={config.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-dark-text/60 dark:text-gray-400 hover:bg-accent-blue/10 hover:text-accent-blue transition-all flex items-center justify-center"
                      aria-label="Twitter"
                    >
                      <FaTwitter className="w-4 h-4" />
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Copyright */}
            <p className="text-xs text-dark-text/50 dark:text-gray-500 font-normal tracking-wide">
              © {new Date().getFullYear()} {config.church_name || 'Casa del Rey'}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import NewsletterSignup from '../NewsletterSignup';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Llámenos */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Llámenos</h3>
            </div>
            <div className="space-y-2">
              <p className="flex items-center space-x-2">
                <span className="text-gray-400">Teléfono:</span>
                <a 
                  href="tel:+1234567890" 
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                >
                  +1 (234) 567-890
                </a>
              </p>
              <p className="flex items-center space-x-2">
                <span className="text-gray-400">Email:</span>
                <a 
                  href="mailto:info@casadelrey.org" 
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                >
                  info@casadelrey.org
                </a>
              </p>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPinIcon className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Ubicación</h3>
            </div>
            <div className="space-y-2">
              <p>Calle Principal 123</p>
              <p>Ciudad, Estado 12345</p>
              <p>País</p>
            </div>
          </div>

          {/* Horario Laboral */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Horario Laboral</h3>
            </div>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="text-gray-400">Domingo:</span>
                <span>9:00 AM - 1:00 PM</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Miércoles:</span>
                <span>7:00 PM - 9:00 PM</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Viernes:</span>
                <span>7:00 PM - 10:00 PM</span>
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <NewsletterSignup />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Casa del Rey. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

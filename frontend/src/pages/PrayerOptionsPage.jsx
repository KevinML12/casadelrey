import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const PrayerOptionsPage = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 to-indigo-700 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SparklesIcon className="w-16 h-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Ministerio de Oración
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
              Estamos aquí para orar contigo y por ti. Tu petición es importante para nosotros.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Options Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-text dark:text-white mb-4">
              ¿Cómo Podemos Orar por Ti?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Elige la opción que mejor se adapte a tu necesidad
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Tarjeta 1: Pedir Oración Confidencial */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border-2 border-transparent hover:border-purple-600 h-full flex flex-col">
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-8 text-white text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                    <HeartIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Pedir Oración Confidencial</h3>
                  <p className="text-purple-100">Comparte tu necesidad en privado</p>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">100% confidencial y privado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Equipo dedicado orará por ti</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Respuesta en menos de 24 horas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Sin juicios, solo amor y apoyo</span>
                    </li>
                  </ul>

                  <Link
                    to="/oracion/confidencial"
                    className="w-full bg-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-purple-700 transition duration-300 shadow-lg hover:shadow-xl text-center block group-hover:scale-105 transform"
                  >
                    Enviar Petición de Oración
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta 2: Unirse al Equipo de Oración */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border-2 border-transparent hover:border-indigo-600 h-full flex flex-col">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                    <UserGroupIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Unirse al Equipo de Oración</h3>
                  <p className="text-indigo-100">Sé parte de este ministerio</p>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Ora por las necesidades de otros</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Flexibilidad de horarios</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Capacitación y acompañamiento</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Comunidad de intercesores</span>
                    </li>
                  </ul>

                  <Link
                    to="/registro"
                    className="w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-lg hover:shadow-xl text-center block group-hover:scale-105 transform"
                  >
                    Quiero Ser Intercesor
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12"
          >
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                El Poder de la Oración
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="text-center">
                  "La oración eficaz del justo puede mucho." - Santiago 5:16
                </p>
                <p className="text-center text-sm">
                  Creemos en el poder de la oración y estamos comprometidos a interceder por cada 
                  petición que recibimos. No estás solo en tus luchas; estamos aquí para apoyarte 
                  espiritualmente.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Emergency Contact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 text-center"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
              <p className="text-gray-700 text-sm">
                <strong>¿Necesitas ayuda urgente?</strong> Si estás pasando por una crisis o emergencia,
                por favor comunícate directamente con nosotros al teléfono de la iglesia o busca ayuda
                profesional inmediata.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrayerOptionsPage;

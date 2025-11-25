import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCardIcon, HeartIcon } from '@heroicons/react/24/outline';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const DonationPage = () => {
  const handlePayPalDonation = () => {
    window.open('https://www.paypal.com/donate', '_blank');
  };

  return (
    <div className="w-full overflow-x-hidden bg-white dark:bg-gray-950 transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-950 text-dark-text dark:text-white py-28 sm:py-40 pt-44 transition-colors">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <HeartIcon className="w-16 h-16 text-accent-blue mx-auto mb-6" />
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold mb-6 tracking-tight transition-colors leading-tight">
              Tu Generosidad<br />Importa
            </h1>
            <p className="text-xl sm:text-2xl text-dark-text/70 dark:text-gray-300 max-w-3xl mx-auto transition-colors font-normal">
              Cada donación nos ayuda a continuar con nuestra misión de servir a la comunidad
            </p>
          </motion.div>
        </div>
      </section>

      {/* Options Section */}
      <section className="py-20 sm:py-32 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl sm:text-6xl font-display font-bold text-dark-text dark:text-white mb-4 tracking-tight transition-colors">
              Elige tu Método
            </h2>
            <p className="text-lg text-dark-text/60 dark:text-gray-400 max-w-2xl mx-auto transition-colors font-normal">
              Selecciona la opción que prefieras para hacer tu contribución
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Tarjeta 1: Donar con Tarjeta */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="group"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50 h-full flex flex-col hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="bg-gradient-to-br from-accent-blue to-blue-600 p-8 text-white text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-lg mb-4">
                    <CreditCardIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2 tracking-tight">Donar con Tarjeta</h3>
                  <p className="text-blue-100 font-normal text-sm">Pago seguro con Stripe</p>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-normal text-dark-text/70 dark:text-gray-400">Pago instantáneo y seguro</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-normal text-dark-text/70 dark:text-gray-400">Acepta todas las tarjetas principales</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-normal text-dark-text/70 dark:text-gray-400">Encriptación de nivel bancario</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-normal text-dark-text/70 dark:text-gray-400">Recibo automático por email</span>
                    </li>
                  </ul>

                  <Link
                    to="/donaciones/tarjeta"
                    className="w-full bg-accent-blue text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all text-center block text-xs uppercase tracking-widest"
                  >
                    Continuar con Tarjeta
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta 2: Donar con PayPal */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="group"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50 h-full flex flex-col hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="bg-gradient-to-br from-accent-blue to-blue-600 p-8 text-white text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-lg mb-4">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.633h8.78c2.86 0 4.834 1.487 4.834 4.242 0 3.24-2.313 5.395-5.706 5.395H9.95l-1.26 7.636a.663.663 0 0 1-.654.556zm9.986-17.067h-4.83c-.24 0-.447.175-.485.41l-1.32 7.99a.5.5 0 0 0 .493.58h2.83c2.97 0 5.146-1.885 5.146-4.45 0-2.037-1.354-3.53-3.834-3.53z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2 tracking-tight">Donar con PayPal</h3>
                  <p className="text-blue-100 font-normal text-sm">Pago rápido y confiable</p>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-normal text-dark-text/70 dark:text-gray-400">No requiere crear cuenta</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-normal text-dark-text/70 dark:text-gray-400">Protección del comprador</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-normal text-dark-text/70 dark:text-gray-400">Aceptado mundialmente</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-normal text-dark-text/70 dark:text-gray-400">Proceso simple en un clic</span>
                    </li>
                  </ul>

                  <button
                    onClick={handlePayPalDonation}
                    className="w-full bg-accent-blue text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all text-xs uppercase tracking-widest"
                  >
                    Continuar con PayPal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-xl p-8 max-w-3xl mx-auto shadow-sm hover:shadow-md transition-all">
              <p className="text-dark-text dark:text-white mb-3 font-display font-bold text-lg tracking-tight transition-colors">
                ¿Tienes preguntas sobre las donaciones?
              </p>
              <p className="text-dark-text/70 dark:text-gray-400 text-sm font-normal transition-colors leading-relaxed">
                Todas las donaciones son seguras y están protegidas. Recibirás un recibo automático para tus registros. Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DonationPage;

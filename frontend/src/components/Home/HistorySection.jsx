import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const HistorySection = () => {
  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título Principal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-display font-bold text-dark-text dark:text-white mb-6 tracking-tight transition-colors">
            NUESTRA HISTORIA
          </h2>
          <p className="text-xl md:text-2xl text-dark-text/70 dark:text-gray-300 max-w-3xl mx-auto transition-colors font-normal">
            Un legado de fe, esperanza y comunidad transformada
          </p>
        </motion.div>

        {/* Previsualización de Historia */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-12 lg:p-16 max-w-4xl mx-auto border border-gray-200/50 dark:border-gray-800/50 transition-colors"
        >
          <div className="space-y-6 text-dark-text/70 dark:text-gray-300 leading-relaxed text-lg font-normal transition-colors">
            <p>
              Hace más de 15 años, en un pequeño salón de reuniones, un grupo de
              creyentes apasionados por Dios se reunió con el deseo de crear una
              iglesia diferente: una comunidad donde cada persona pudiera
              experimentar el amor de Cristo de manera tangible y transformadora.
            </p>
            <p>
              Hoy, la Casa del Rey es una iglesia vibrante donde cientos de
              personas se reúnen semanalmente para adorar, aprender y servir.
              Hemos crecido no solo en números, sino en madurez espiritual y en
              nuestro impacto genuino en la comunidad.
            </p>
          </div>

          {/* Botón Explorar Más */}
          <div className="mt-12 text-center">
            <Link
              to="/historia"
              className="inline-flex items-center gap-3 bg-accent-blue text-white font-semibold py-3 px-8 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 uppercase text-xs tracking-widest rounded-lg"
            >
              <span>Ver Historia Completa</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HistorySection;

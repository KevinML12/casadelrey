import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/solid';

const HistorySection = () => {
  return (
    <section className="py-16 sm:py-24 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SparklesIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-gray-800 mb-10"
        >
          Nuestra Historia: Más que un Edificio
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl border-t-4 border-blue-600 transition duration-500 hover:shadow-blue-600/20"
        >
          <div className="md:flex md:space-x-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="md:w-1/2 text-left mb-6 md:mb-0"
            >
              <h3 className="text-xl font-bold text-blue-600 mb-4">
                Iniciamos con una Visión
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Nacimos hace más de 15 años con la firme convicción de impactar a nuestra ciudad. Desde reuniones en una pequeña sala, crecimos impulsados por el amor de Jesús y el deseo de ver vidas transformadas y familias restauradas.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="md:w-1/2 text-left"
            >
              <h3 className="text-xl font-bold text-blue-600 mb-4">
                Hoy: Una Comunidad Viva
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Hoy, Casa del Rey es una comunidad vibrante de jóvenes, familias y líderes que buscan a Dios con pasión. Creemos que el mejor momento de la iglesia está por venir, y estamos listos para alcanzar a la próxima generación.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HistorySection;

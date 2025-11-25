import { motion } from 'framer-motion';
import { SparklesIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const HistoryPage = () => {
  return (
    <div className="w-full overflow-x-hidden bg-white dark:bg-gray-950 transition-colors">
      <Header />
      
      {/* Hero Section - Limpio y minimalista */}
      <section className="relative bg-white dark:bg-gray-950 py-28 sm:py-40 pt-44 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-display font-bold text-dark-text dark:text-white mb-6 tracking-tight transition-colors leading-tight">
              Nuestra
              <br />
              Historia
            </h1>
            <p className="text-xl sm:text-2xl text-dark-text/70 dark:text-gray-300 max-w-3xl mx-auto font-medium tracking-wide transition-colors">
              Más que un edificio, somos una familia transformada por el poder de Dios
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 sm:py-32 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          
          {/* Origen */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-1 h-12 bg-gradient-to-b from-accent-blue to-transparent rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h2 className="text-5xl sm:text-6xl font-display font-bold text-dark-text dark:text-white tracking-tight transition-colors">
                    Los Primeros Pasos
                  </h2>
                </div>
              </div>
              <p className="text-lg sm:text-xl text-dark-text/70 dark:text-gray-300 leading-relaxed font-normal ml-5 transition-colors">
                Casa del Rey nació hace más de 15 años con una visión clara: impactar a nuestra ciudad 
                con el mensaje transformador del evangelio. Lo que comenzó como pequeñas reuniones en 
                una sala modesta, hoy se ha convertido en una comunidad vibrante de cientos de personas 
                que buscan a Dios con pasión y autenticidad.
              </p>
              <p className="text-lg sm:text-xl text-dark-text/70 dark:text-gray-300 leading-relaxed font-normal ml-5 transition-colors">
                Desde el principio, nuestra misión ha sido clara: no solo ser una iglesia que se reúne 
                los domingos, sino una familia que camina junta en la fe, apoyándose mutuamente y 
                alcanzando a quienes están lejos de Dios.
              </p>
            </div>
          </motion.div>

          {/* Crecimiento */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-1 h-12 bg-gradient-to-b from-accent-blue to-transparent rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h2 className="text-5xl sm:text-6xl font-display font-bold text-dark-text dark:text-white tracking-tight transition-colors">
                    Años de Crecimiento
                  </h2>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-8 sm:p-12 border-l-4 border-accent-blue ml-5 rounded-lg transition-colors">
                <blockquote className="text-2xl sm:text-3xl text-dark-text dark:text-white font-display font-bold mb-4 transition-colors leading-tight">
                  "No edificamos una iglesia, edificamos vidas. No construimos paredes, construimos familias."
                </blockquote>
                <p className="text-dark-text/60 dark:text-gray-400 font-semibold uppercase text-xs sm:text-sm tracking-widest transition-colors">— Visión fundacional</p>
              </div>

              <p className="text-lg sm:text-xl text-dark-text/70 dark:text-gray-300 leading-relaxed font-normal ml-5 transition-colors">
                A lo largo de los años, hemos visto cómo Dios ha obrado milagros en nuestra congregación. 
                Familias restauradas, adicciones vencidas, jóvenes encontrando propósito, y matrimonios 
                renovados. Cada testimonio es una confirmación de que Dios está vivo y activo en medio de nosotros.
              </p>
              <p className="text-lg sm:text-xl text-dark-text/70 dark:text-gray-300 leading-relaxed font-normal ml-5 transition-colors">
                Nuestro crecimiento no ha sido solo numérico, sino espiritual. Hemos aprendido a ser una 
                comunidad que ama, sirve y comparte sin reservas. Una iglesia donde todos son bienvenidos, 
                sin importar su pasado o su condición actual.
              </p>
            </div>
          </motion.div>

          {/* Presente */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-1 h-12 bg-gradient-to-b from-accent-blue to-transparent rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h2 className="text-5xl sm:text-6xl font-display font-bold text-dark-text dark:text-white tracking-tight transition-colors">
                    Hoy: Una Comunidad Viva
                  </h2>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 ml-5">
                <div className="bg-gray-50 dark:bg-gray-900 p-8 sm:p-10 border-l-4 border-accent-blue rounded-lg transition-colors">
                  <h3 className="text-2xl font-display font-bold text-dark-text dark:text-white mb-4 transition-colors">Nuestra Misión</h3>
                  <p className="text-lg text-dark-text/70 dark:text-gray-300 font-normal leading-relaxed transition-colors">
                    Hacer discípulos de Jesús que transformen su entorno, guiados por el Espíritu Santo 
                    y fundamentados en la Palabra de Dios.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-8 sm:p-10 border-l-4 border-accent-blue rounded-lg transition-colors">
                  <h3 className="text-2xl font-display font-bold text-dark-text dark:text-white mb-4 transition-colors">Nuestra Visión</h3>
                  <p className="text-lg text-dark-text/70 dark:text-gray-300 font-normal leading-relaxed transition-colors">
                    Ser una iglesia multigeneracional que alcanza a la ciudad con el amor de Cristo, 
                    formando líderes que impacten cada esfera de la sociedad.
                  </p>
                </div>
              </div>

              <p className="text-lg sm:text-xl text-dark-text/70 dark:text-gray-300 leading-relaxed font-normal ml-5 transition-colors">
                Hoy, Casa del Rey es una comunidad vibrante de jóvenes, familias y líderes comprometidos 
                con el reino de Dios. Nos caracterizamos por una adoración auténtica, una enseñanza bíblica 
                sólida, y un corazón para servir a nuestra ciudad.
              </p>
            </div>
          </motion.div>

          {/* Valores */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-1 h-12 bg-gradient-to-b from-accent-blue to-transparent rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h2 className="text-5xl sm:text-6xl font-display font-bold text-dark-text dark:text-white tracking-tight transition-colors">
                    Nuestros Valores
                  </h2>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 ml-5">
                {[
                  { title: "Autenticidad", desc: "Somos reales, vulnerables y honestos en nuestro caminar con Dios." },
                  { title: "Comunidad", desc: "Creemos en la fuerza del cuerpo de Cristo reunido en unidad y amor." },
                  { title: "Transformación", desc: "Buscamos que cada persona experimente el poder transformador de Jesús." },
                  { title: "Servicio", desc: "Nuestro gozo es servir a otros sin esperar reconocimiento." }
                ].map((valor, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-900 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors hover:border-accent-blue/50 dark:hover:border-accent-blue/50">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckBadgeIcon className="w-6 h-6 text-accent-blue flex-shrink-0 mt-1" />
                      <h3 className="text-xl font-display font-bold text-dark-text dark:text-white transition-colors">{valor.title}</h3>
                    </div>
                    <p className="text-dark-text/70 dark:text-gray-300 font-normal leading-relaxed transition-colors">{valor.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HistoryPage;

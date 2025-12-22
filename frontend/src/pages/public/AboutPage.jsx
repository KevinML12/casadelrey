import React from 'react';
import { PlayCircle, Mic, Rss, Youtube, Facebook } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AboutPage() {
  return (
    <main className="bg-white dark:bg-dark-bg text-text-primary dark:text-dark-text-primary">
      {/* Hero Section */}
      <section className="relative py-32 bg-primary dark:bg-gradient-to-br dark:from-dark-bg dark:via-dark-card-bg dark:to-black">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-4 animate-fade-in-down text-white">Conócenos</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto font-light animate-fade-in-up text-white">
            Somos una familia apasionada por Dios, por su casa y por su gente.
          </p>
        </div>
      </section>

      {/* History and Mission Section */}
      <section className="py-24 bg-gray-50 dark:bg-dark-card-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Nuestra Historia y Misión</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Desde nuestros humildes comienzos hasta hoy, nuestra visión ha sido la misma: ser un faro de esperanza y un hogar para todos.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="prose prose-lg dark:prose-invert max-w-none bg-white dark:bg-dark-bg p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-bold text-primary dark:text-primary-light">Historia</h3>
              <p>
                Casa del Rey nació en [Año de Fundación] en el corazón de un pequeño grupo de creyentes. Lo que comenzó en una sala de estar, floreció por la gracia de Dios en una comunidad vibrante que hoy impacta a miles de vidas.
              </p>
              <p>
                Cada paso de nuestro viaje ha sido un testimonio de la fidelidad de Dios.
              </p>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none bg-white dark:bg-dark-bg p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-bold text-primary dark:text-primary-light">Misión y Visión</h3>
              <p>
                <strong>Misión:</strong> Exaltar a Cristo, equipar a la iglesia y extender el Reino de Dios en cada esfera de la sociedad.
              </p>
              <p>
                <strong>Visión:</strong> Ser una comunidad influyente, reconocida por nuestro amor genuino, servicio desinteresado y la transformación de vidas a través del Evangelio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multimedia Section */}
      <section className="py-24 bg-white dark:bg-dark-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Conéctate: Prédicas y Contenido</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">
              Revive nuestras últimas prédicas, conferencias y momentos especiales desde nuestras plataformas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-lg">
                <div className="relative aspect-video bg-black flex items-center justify-center cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <PlayCircle size={80} className="text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 p-6 text-white">
                    <p className="text-sm font-semibold text-primary-light">ÚLTIMA PRÉDICA</p>
                    <h3 className="text-2xl lg:text-3xl font-bold">El Poder de la Esperanza</h3>
                  </div>
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-md flex items-center gap-2">
                    <Youtube size={20} />
                    <span>YouTube</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold border-b-2 border-primary-light pb-2 mb-4 dark:text-white">Más Contenido</h3>
              <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <div className="w-28 h-20 bg-gray-300 dark:bg-gray-700 rounded-md flex-shrink-0 flex items-center justify-center">
                  <Facebook size={32} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold dark:text-white">Testimonios en Facebook</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Momentos de fe</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
                <div className="w-28 h-20 bg-gray-300 dark:bg-gray-700 rounded-md flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold dark:text-white">Conferencia Juvenil</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Resumen en YouTube</p>
                </div>
              </div>
              <Button variant="primary" className="w-full mt-4">
                <Youtube size={20} className="mr-2"/> Ver Canal de YouTube
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Podcast Section */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4">
           <div className="text-center mb-12">
            <h2 className="text-4xl font-black">Blog en Audio</h2>
            <p className="text-lg text-primary-light mt-4 max-w-2xl mx-auto">
              ¿Prefieres escuchar? Convierte nuestros artículos en tu podcast personal de crecimiento.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <Mic size={80} className="text-white flex-shrink-0" />
              <div>
                <h3 className="text-3xl font-bold mb-3">Escucha Nuestro Podcast</h3>
                <p className="text-primary-light mb-6">
                  Lleva nuestras enseñanzas contigo a donde vayas. Ideal para tu devocional, el gimnasio o mientras viajas. ¡Es gratis!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-primary font-bold">
                    <Rss size={20} className="mr-2" /> Acceder al Podcast
                  </Button>
                   <Button variant="ghost" size="lg" className="text-white hover:bg-white/20">
                    Último Episodio
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

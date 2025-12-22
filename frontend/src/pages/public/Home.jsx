import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { BookOpen, Calendar, MessageSquare, Heart, Users, Zap, Sparkles, ArrowRight, Star, HandHeart, Newspaper, PlayCircle } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-bg-light dark:bg-dark-bg">
      {/* Hero Section */}
      <section className="relative py-40 overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-8 border border-white/20 hover:border-white/40 transition-all">
              <Sparkles size={16} className="text-white" />
              <span className="text-sm font-medium text-white">Bienvenido a Casa del Rey</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              Casa del <span className="text-blue-300">Rey</span>
            </h1>
            <p className="text-xl md:text-2xl text-white mb-12 max-w-3xl mx-auto font-light leading-relaxed opacity-90">
              Tu comunidad de fe, crecimiento espiritual y transformación integral
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/register">
                <Button variant="primary" size="lg">
                  <span className="flex items-center gap-2">Comenzar Ahora <ArrowRight size={20} /></span>
                </Button>
              </Link>
              <Link to="/events">
                 <Button variant="primary" size="lg">
                  Explorar Eventos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gray-50 dark:bg-dark-card-bg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-primary rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition"></div>
                <div className="relative bg-primary text-white p-6 rounded-2xl">
                  <Users size={40} />
                </div>
              </div>
              <div className="text-5xl font-black text-primary dark:text-primary-light mb-2">5K+</div>
              <p className="text-xl text-text-primary dark:text-dark-text-primary font-semibold">Miembros Activos</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-2">Creciendo cada día en comunidad</p>
            </div>
            <div className="text-center group">
               <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-primary rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition"></div>
                <div className="relative bg-primary text-white p-6 rounded-2xl">
                  <Calendar size={40} />
                </div>
              </div>
              <div className="text-5xl font-black text-primary dark:text-primary-light mb-2">200+</div>
              <p className="text-xl text-text-primary dark:text-dark-text-primary font-semibold">Eventos Anuales</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-2">Actividades diversas para conectar</p>
            </div>
            <div className="text-center group">
               <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-primary rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition"></div>
                <div className="relative bg-primary text-white p-6 rounded-2xl">
                  <Zap size={40} />
                </div>
              </div>
              <div className="text-5xl font-black text-primary dark:text-primary-light mb-2">24/7</div>
              <p className="text-xl text-text-primary dark:text-dark-text-primary font-semibold">Apoyo Continuo</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-2">Siempre aquí para ti</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-dark-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary dark:text-primary-light mb-4 font-semibold text-sm">
              <Star size={16} />
              Nuestros Servicios
            </div>
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Lo que nos hace especial</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Múltiples formas de conectar, crecer y hacer un impacto real en tu comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link to="/prayer">
              <Card className="text-center group h-full">
                  <div className="mb-4 inline-block p-4 rounded-2xl bg-primary/10">
                    <MessageSquare size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Oración</h3>
                  <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
                    Comparte tus peticiones con una comunidad que se preocupa genuinamente por ti.
                  </p>
              </Card>
            </Link>

            <Link to="/events">
              <Card className="text-center group h-full">
                  <div className="mb-4 inline-block p-4 rounded-2xl bg-primary/10">
                    <Calendar size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Eventos</h3>
                  <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
                    Participa en reuniones, talleres y celebraciones que transforman vidas.
                  </p>
              </Card>
            </Link>

            <Link to="/blog">
              <Card className="text-center group h-full">
                  <div className="mb-4 inline-block p-4 rounded-2xl bg-primary/10">
                    <BookOpen size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Blog</h3>
                  <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
                    Artículos profundos, reflexiones y enseñanzas para tu crecimiento espiritual.
                  </p>
              </Card>
            </Link>

            <Link to="/donate">
              <Card className="text-center group h-full">
                  <div className="mb-4 inline-block p-4 rounded-2xl bg-primary/10">
                    <Heart size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Donativos</h3>
                  <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
                    Apoya nuestro ministerio y amplifica el impacto en vidas y comunidades.
                  </p>
              </Card>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Volunteer Section */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
            <HandHeart size={48} className="text-white mx-auto mb-6" />
            <h2 className="text-5xl font-black text-white mb-6">Sé Parte del Cambio</h2>
            <p className="text-xl text-white mb-12 max-w-3xl mx-auto font-light leading-relaxed opacity-90">
              Tu tiempo y talentos pueden hacer una gran diferencia. Únete a uno de nuestros equipos de voluntariado.
            </p>
            <Link to="/volunteering">
              <Button variant="primary-on-dark" size="lg">
                Quiero Servir
              </Button>
            </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-40 bg-gray-50 dark:bg-dark-card-bg">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-5xl font-black text-text-primary dark:text-dark-text-primary mb-6">¿Listo para transformar tu vida?</h2>
          <p className="text-xl text-text-secondary dark:text-dark-text-secondary mb-12 max-w-2xl mx-auto">
            Miles de personas ya están experimentando fe, comunidad y propósito. Únete hoy mismo.
          </p>
          
          <Link to="/register">
            <Button variant="primary" size="lg">
              <span className="flex items-center gap-2">
                Crear mi Cuenta Ahora <ArrowRight size={20} />
              </span>
            </Button>
          </Link>
        </div>
      </section>

    </main>
  );
}

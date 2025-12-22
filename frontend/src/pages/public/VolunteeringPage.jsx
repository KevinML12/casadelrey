import React from 'react';
import Button from '../../components/ui/Button.jsx';
import { HandHeart } from 'lucide-react';

export default function VolunteeringPage() {
  return (
    <main className="min-h-screen bg-bg-light dark:bg-dark-bg py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <HandHeart className="mx-auto text-primary" size={48} />
          <h1 className="text-6xl font-black text-text-primary dark:text-dark-text-primary mt-4 mb-6">
            Únete al Equipo de Voluntarios
          </h1>
          <p className="text-2xl text-text-secondary dark:text-dark-text-secondary max-w-3xl mx-auto">
            El servicio es una de las maneras más poderosas de crecer en tu fe y de impactar la vida de otros. ¡En Casa del Rey, hay un lugar para ti!
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-dark-card-bg p-8 md:p-12 rounded-2xl shadow-soft-lg">
          <h2 className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-8">Áreas de Servicio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-3">Equipo de Bienvenida</h3>
              <p className="text-text-secondary dark:text-dark-text-secondary">
                Sé la primera sonrisa que las personas ven al llegar. Ayuda a crear un ambiente cálido y acogedor para todos nuestros invitados.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary mb-3">Ministerio de Niños</h3>
              <p className="text-text-secondary dark:text-dark-text-secondary">
                Invierte en la próxima generación enseñando a los niños sobre Jesús de una manera divertida y segura.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary mb-3">Equipo de Producción</h3>
              <p className="text-text-secondary dark:text-dark-text-secondary">
                Ayuda a crear una experiencia de adoración sin distracciones operando cámaras, luces, sonido o presentando en línea.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary mb-3">Grupos de Conexión</h3>
              <p className="text-text-secondary dark:text-dark-text-secondary">
                Facilita un grupo pequeño, ayudando a las personas a conectarse entre sí y a crecer en su caminar con Dios.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary mb-3">Equipo de Alcance</h3>
              <p className="text-text-secondary dark:text-dark-text-secondary">
                Participa en proyectos y eventos que sirven a nuestra comunidad local y muestran el amor de Dios de manera práctica.
              </p>
            </div>
             <div>
              <h3 className="text-2xl font-bold text-primary mb-3">Ministerio de Oración</h3>
              <p className="text-text-secondary dark:text-dark-text-secondary">
                Únete al equipo que intercede por las peticiones de nuestra iglesia y comunidad durante los servicios y a lo largo de la semana.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <h3 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary mb-4">¿Listo para dar el siguiente paso?</h3>
            <p className="text-lg text-text-secondary dark:text-dark-text-secondary mb-8">
              Completa el formulario de interés y uno de nuestros líderes se pondrá en contacto contigo.
            </p>
            <Button variant="primary" size="lg">
              Formulario de Interés de Voluntariado
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

import { motion } from 'framer-motion';
import InfoCard from './InfoCard';

const NewMembersSection = () => {
  const cards = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop',
      title: 'Conviértete en Voluntario',
      description: 'Únete a nuestro equipo de voluntarios y marca la diferencia en la comunidad. Hay muchas áreas donde puedes servir y usar tus dones para ayudar a otros.',
      buttonText: 'Quiero Ser Voluntario',
      onClick: () => {
        console.log('Redirect to volunteer form');
      }
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=600&fit=crop',
      title: 'Podcasts Semanales',
      description: 'Escucha nuestros podcasts donde compartimos enseñanzas, testimonios y contenido inspirador para fortalecer tu fe durante la semana.',
      buttonText: 'Escuchar Ahora',
      onClick: () => {
        console.log('Redirect to podcasts');
      }
    }
  ];

  return (
    <section className="bg-blue-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Forma Parte de la Comunidad
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre las diferentes formas en que puedes involucrarte y crecer junto a nosotros
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <InfoCard
                image={card.image}
                title={card.title}
                description={card.description}
                buttonText={card.buttonText}
                onButtonClick={card.onClick}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewMembersSection;

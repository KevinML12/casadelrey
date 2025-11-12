import InfoCard from '../ui/InfoCard';

const NewMembersSection = () => {
  const cards = [
    {
      title: 'Conviértete en Voluntario',
      description: 'Únete a nuestro equipo de voluntarios y marca la diferencia en la comunidad. Hay muchas oportunidades para servir y usar tus dones.',
      buttonText: 'Leer Más'
    },
    {
      title: 'Nuevos Miembros',
      description: '¿Eres nuevo en nuestra iglesia? Descubre cómo puedes conectarte con nuestra comunidad y comenzar tu camino de fe con nosotros.',
      buttonText: 'Leer Más'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map((card, index) => (
            <InfoCard
              key={index}
              title={card.title}
              description={card.description}
              buttonText={card.buttonText}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewMembersSection;

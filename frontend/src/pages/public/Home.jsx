import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Eyebrow } from '../../components/ui/Glass';

// ════════════════════════════════════════════════════════════════════
// MOCK DATA (Simulando respuesta del Backend/Admin Panel)
// ════════════════════════════════════════════════════════════════════

const MOCK_HEROES = [
  { 
    id: 1, 
    title: 'LUZ PARA\nLAS NACIONES', 
    subtitle: 'Una generación encendida que adora, sirve y lleva esperanza a cada rincón de la ciudad.', 
    image: '/images/bg-hero.jpg', 
    buttonText: 'Planifica tu visita',
    highlightTitle: 'Próximo servicio',
    highlightTime: '7:30',
    highlightPeriod: 'PM',
    highlightDesc: 'Viernes · Noche de Jóvenes'
  }
];

const MOCK_EVENTS = [
  { id: 1, day: '15', month: 'AGO', title: 'Noche de Jóvenes', time: 'Viernes · 7:30 PM', loc: 'Auditorio Central', isFeatured: true },
  { id: 2, day: '18', month: 'AGO', title: 'Encuentro de Líderes', time: 'Jueves · 6:00 PM', loc: 'Salón 2', isFeatured: false },
  { id: 3, day: '23', month: 'AGO', title: 'Retiro "Reinicio"', time: 'Sábado · Todo el día', loc: 'Casa de campo', isFeatured: false },
  { id: 4, day: '24', month: 'AGO', title: 'Servicio General', time: 'Domingo · 10:00 AM', loc: 'Auditorio Central', isFeatured: false }
];

const MOCK_CELLS = [
  { category: 'Adolescentes', age: '15 a 24 años', description: 'Reuniones dinámicas para adolescentes.', image: '/images/celulas/adolescentes.jpg' },
  { category: 'Jóvenes Adultos', age: 'Solteros', description: 'Comunidad para jóvenes profesionales y universitarios.', image: '/images/celulas/jovenes.jpg' },
  { category: 'Prejuveniles', age: '12 a 15 años', description: 'Un espacio seguro y divertido para crecer.', image: '/images/celulas/prejuveniles.jpg' },
  { category: 'Varones', age: 'Casados', description: 'Hombres compartiendo la palabra y construyendo familia.', image: '/images/celulas/varones.jpg' },
  { category: 'Mujeres', age: 'Mujeres de Palabra', description: 'Formación y hermandad para mujeres de fe.', image: '/images/celulas/mujeres.jpg' }
];

const MOCK_SERMONS = [
  { id: 1, title: 'El Precio del Propósito', date: 'Agosto 2026' },
  { id: 2, title: 'Identidad Inquebrantable', date: 'Julio 2026' },
  { id: 3, title: 'Fe en la Tormenta', date: 'Junio 2026' },
];


// ════════════════════════════════════════════════════════════════════
// 1 · HERO CAROUSEL
// ════════════════════════════════════════════════════════════════════
function HeroCarousel({ onPlan }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const hero = MOCK_HEROES[currentIdx];

  return (
    <section id="inicio" className="relative min-h-[100svh] overflow-hidden bg-bg">
      <img
        src={hero.image}
        alt={hero.title}
        className="absolute inset-0 w-full h-full object-cover animate-hero-1"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/30 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 flex flex-col items-center justify-center text-center min-h-[100svh] pb-24 pt-32">
        <div className="flex items-center justify-center gap-3 mb-6 text-white tracking-widest text-[11px] font-bold uppercase">
          Casa del Rey · Huehuetenango
        </div>

        <h1
          className="display-mega text-white animate-hero-2"
          style={{ fontSize: 'clamp(4rem, 10vw, 9rem)', lineHeight: '0.9' }}
          dangerouslySetInnerHTML={{ __html: hero.title.replace('\\n', '<br />') }}
        />

        <p className="mt-8 max-w-2xl text-[18px] md:text-[22px] leading-relaxed text-white/80 font-medium animate-hero-3">
          {hero.subtitle}
        </p>

        <div className="mt-12 animate-hero-4">
          <button
            onClick={onPlan}
            className="inline-flex items-center justify-center gap-4 rounded-full liquid-glass text-white px-8 py-5 text-[16px] font-bold tracking-tightish btn-spring focus-ring"
          >
            {hero.buttonText}
            <Icon name="arrow" className="w-5 h-5" stroke={2} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2 · AGENDA (Eventos)
// ════════════════════════════════════════════════════════════════════
function Agenda() {
  const featured = MOCK_EVENTS.find(e => e.isFeatured) || MOCK_EVENTS[0];
  const others = MOCK_EVENTS.filter(e => !e.isFeatured);

  return (
    <section id="agenda" className="relative min-h-[80svh] bg-bg overflow-hidden flex items-center border-t border-white/5">
      <img src="/images/bg-eventos.jpg" alt="Eventos" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-bg/20" />
      
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 py-20">
        <div className="flex flex-col justify-center">
          <div className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-4">
            Agenda Mensual
          </div>
          <h2 className="display-mega text-white leading-[0.85] tracking-tighter mb-12" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
            PRÓXIMOS<br />EVENTOS
          </h2>
          
          <div className="rounded-[32px] p-8 md:p-10 liquid-glass card-spring flex flex-col md:flex-row items-center gap-8">
            <div className="text-center shrink-0">
              <div className="text-[72px] font-extrabold text-white leading-none tracking-tighter">{featured.day}</div>
              <div className="text-[14px] font-bold text-white tracking-widest mt-2">{featured.month}</div>
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 inline-block">Destacado</span>
              <h3 className="text-[28px] font-bold text-white tracking-tight mb-3">{featured.title}</h3>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-[14px] text-white/60">
                <span className="flex items-center gap-1.5"><Icon name="clock" className="w-4 h-4" /> {featured.time}</span>
                <span className="flex items-center gap-1.5"><Icon name="pin" className="w-4 h-4" /> {featured.loc}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="liquid-glass rounded-[32px] p-8 md:p-12 border border-white/10">
          <div className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-8">
            También este mes
          </div>
          <div className="space-y-4">
            {others.map((ev) => (
              <div key={ev.id} className="group rounded-[24px] bg-white/5 border border-white/10 p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 cursor-pointer hover:bg-white/10 transition-colors btn-spring">
                <div className="text-center sm:text-left shrink-0">
                  <div className="text-[32px] font-extrabold text-white leading-none">{ev.day}</div>
                  <div className="text-[10px] text-white font-bold tracking-widest mt-1">{ev.month}</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-white/10" />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-[18px] font-bold text-white mb-1">{ev.title}</h3>
                  <div className="flex items-center justify-center sm:justify-start gap-4 text-[13px] text-white/50 font-medium">
                    <span className="flex items-center gap-1.5"><Icon name="clock" className="w-3.5 h-3.5" /> {ev.time}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/20 transition-all shrink-0">
                  <Icon name="arrow" className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3 · CÉLULAS Y COMUNIDAD
// ════════════════════════════════════════════════════════════════════
function CelulasSection() {
  return (
    <section id="celulas" className="relative py-28 md:py-36 bg-bg border-t border-white/5">
      <img src="/images/bg-celulas.jpg" alt="Comunidad" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="mb-16 text-center">
          <Eyebrow>Comunidad</Eyebrow>
          <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            Grupos de Vida
          </h2>
          <p className="mt-6 text-[18px] text-white/70 max-w-2xl mx-auto">
            No somos solo un edificio, somos una familia. Tenemos espacios diseñados para cada etapa de tu vida.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-[minmax(180px,auto)]">
          {MOCK_CELLS.map((cat, i) => {
            let gridSpan = 'md:col-span-1';
            if (i === 0) gridSpan = 'md:col-span-2 md:row-span-2 lg:col-span-2'; // Adolescentes
            else if (i === 4) gridSpan = 'md:col-span-2 lg:col-span-2'; // Mujeres

            return (
            <div key={i} className={`relative rounded-[32px] flex flex-col card-spring ${gridSpan}`}>
              <div className="absolute inset-0 rounded-[32px] overflow-hidden">
                <img src={cat.image} alt={cat.category} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-bg/40" />
              </div>
              <div className="relative z-10 w-full h-full liquid-glass rounded-[32px] p-8 text-center flex flex-col items-center justify-center">
                <span className="bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4">
                  {cat.age}
                </span>
                <h3 className={`font-bold text-white mb-2 ${i === 0 ? 'text-[32px]' : 'text-[20px]'}`}>{cat.category}</h3>
                <p className={`text-white/80 ${i === 0 ? 'text-[16px] max-w-sm' : 'text-[14px]'}`}>{cat.description}</p>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4 · MENSAJES (Prédicas en Liquid Glass)
// ════════════════════════════════════════════════════════════════════
function MensajesCarousel() {
  return (
    <section id="mensajes" className="relative py-20 md:py-32 bg-bg border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-[#0F192B] to-bg/40" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 mb-12">
        <Eyebrow>Últimas Prédicas</Eyebrow>
        <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
          Alimenta tu <span className="text-white">espíritu</span>.
        </h2>
      </div>

      <div className="relative z-10 flex overflow-x-auto gap-6 px-6 pb-12 snap-x snap-mandatory scrollbar-hide" style={{ scrollPaddingLeft: '1.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        <div className="w-[1px] shrink-0 md:w-[calc((100vw-72rem)/2)] hidden md:block" />
        
        {MOCK_SERMONS.map((s) => (
          <a href="#" key={s.id} className="group relative shrink-0 w-[300px] md:w-[400px] aspect-[4/5] md:aspect-video rounded-[32px] liquid-glass hover:border-white/30 snap-start card-spring">
              <div className="relative aspect-video rounded-t-[24px] overflow-hidden bg-white/5 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
                <Icon name="play" className="w-12 h-12 text-white/20 group-hover:text-white transition-colors duration-500" stroke={1} />
              </div>
            <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent rounded-[32px]" />
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Icon name="play" className="w-6 h-6 text-white ml-1" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/80 mb-2">{s.date}</div>
              <h3 className="text-[20px] md:text-[24px] font-bold text-white leading-tight">{s.title}</h3>
            </div>
          </a>
        ))}
        <div className="w-6 shrink-0" />
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 5 · UBICACIÓN (Visítanos)
// ════════════════════════════════════════════════════════════════════
function Ubicacion({ onPlan }) {
  return (
    <section id="ubicacion" className="relative py-20 md:py-32 bg-bg border-t border-white/5">
      <img src="/images/bg-ensenanzas.jpg" alt="Ubicación" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/10" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="rounded-[32px] liquid-glass p-10 md:p-14 flex flex-col justify-center card-spring">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20 mb-8">
              <Icon name="pin" className="w-6 h-6 text-white" />
            </div>
            <h3 className="display-mega text-white mb-4" style={{ fontSize: '2.5rem' }}>Visítanos</h3>
            <p className="text-[16px] text-white/70 font-medium mb-8 max-w-sm">
              7ª. Calle 12-66 zona 4,<br />
              carretera a las Ruinas de Zaculeu,<br />
              Huehuetenango
            </p>
            <a href="#" className="inline-flex items-center justify-between px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white text-[14px] font-bold hover:bg-white/20 transition-all btn-spring w-full md:w-max">
              Ver en Google Maps
              <Icon name="arrow" className="w-4 h-4 ml-4" />
            </a>
          </div>

          <div className="rounded-[32px] liquid-glass p-10 md:p-14 flex flex-col justify-center card-spring">
            <h3 className="display-mega text-white mb-4" style={{ fontSize: '2.5rem' }}>¿Es tu primera vez?</h3>
            <p className="text-[16px] text-white/70 font-medium mb-8 max-w-sm">
              Queremos conocerte. Planifica tu visita y nos aseguraremos de que te sientas en casa desde el primer minuto.
            </p>
            <button onClick={onPlan} className="inline-flex items-center justify-between px-6 py-4 rounded-full bg-white text-bg text-[14px] font-bold hover:bg-white/90 transition-all btn-spring w-full md:w-max liquid-glass">
              Planificar Visita
              <Icon name="arrow" className="w-4 h-4 ml-4" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}


// ════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function Home() {
  const handlePlan = () => {
    alert("Aquí iría la integración con el formulario o modal para planificar visita.");
  };

  return (
    <main className="bg-bg w-full">
      <HeroCarousel onPlan={handlePlan} />
      <Agenda />
      <CelulasSection />
      <MensajesCarousel />
      <Ubicacion onPlan={handlePlan} />
    </main>
  );
}

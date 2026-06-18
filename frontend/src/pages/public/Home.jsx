import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import apiClient from '../../lib/apiClient';

// ════════════════════════════════════════════════════════════════════
// 1 · HERO CAROUSEL
// ════════════════════════════════════════════════════════════════════
function HeroCarousel({ onPlan }) {
  const [hero, setHero] = useState(null);

  useEffect(() => {
    apiClient.get('/hero/active')
      .then(res => {
        if (res.data) setHero({
          title: `${res.data.title_line_1 || ''}\n${res.data.title_line_2 || ''}`,
          subtitle: res.data.subtitle,
          image: res.data.fallback_image_url || res.data.desktop_video_url,
          buttonText: res.data.cta_primary_text || 'Planifica tu visita',
          url: res.data.cta_primary_url
        });
        else throw new Error("No data");
      })
      .catch(err => {
        // Fallback elegante (inyectado para prueba R2/Video)
        setHero({
          title: 'LUZ PARA\nLAS NACIONES', 
          subtitle: 'Una generación encendida que adora, sirve y lleva esperanza a cada rincón de la ciudad.', 
          image: 'https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/sample-hero.mp4', 
          buttonText: 'Planifica tu visita',
        });
      });
  }, []);

  if (!hero) return <div className="min-h-[100svh] bg-bg" />;

  return (
    <section id="inicio" className="relative min-h-[100svh] overflow-hidden bg-bg">
      {hero.image && hero.image.endsWith('.mp4') ? (
        <video 
          src={hero.image} 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover animate-hero-1"
        />
      ) : (
        <img
          src={hero.image || hero.image_url || 'https://images.unsplash.com/photo-1438283173091-5dbf5c5a3206?auto=format&fit=crop&q=80'}
          alt={hero.title}
          className="absolute inset-0 w-full h-full object-cover animate-hero-1"
        />
      )}
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
            {hero.buttonText || 'Planifica tu visita'}
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
  const [events, setEvents] = useState([]);

  useEffect(() => {
    apiClient.get('/events')
      .then(res => {
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map(ev => {
            const date = new Date(ev.date + 'T12:00:00');
            return {
              id: ev.ID,
              day: date.getDate().toString(),
              month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
              title: ev.title,
              time: ev.time || 'Por definir',
              loc: ev.location,
              isFeatured: ev.is_featured
            };
          });
          setEvents(formatted);
        } else {
          throw new Error("Empty events");
        }
      })
      .catch(err => {
        setEvents([
          { id: 1, day: '15', month: 'AGO', title: 'Noche de Jóvenes', time: 'Viernes · 7:30 PM', loc: 'Auditorio Central', isFeatured: true },
          { id: 2, day: '18', month: 'AGO', title: 'Encuentro de Líderes', time: 'Jueves · 6:00 PM', loc: 'Salón 2', isFeatured: false },
          { id: 3, day: '23', month: 'AGO', title: 'Retiro "Reinicio"', time: 'Sábado · Todo el día', loc: 'Casa de campo', isFeatured: false }
        ]);
      });
  }, []);

  if (events.length === 0) return null;

  const featured = events.find(e => e.isFeatured) || events[0];
  const others = events.filter(e => e.id !== featured.id).slice(0, 3);

  return (
    <section id="agenda" className="relative min-h-[80svh] bg-bg overflow-hidden flex items-center border-t border-white/5">
      {/* Liquid glowing orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-celeste/20 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-rose/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-blob" style={{ animationDelay: '2s' }} />
      
      {/* Background image - Unsplash para asegurar que cargue siempre */}
      <img src="https://images.unsplash.com/photo-1540039155732-d674d4040a46?auto=format&fit=crop&q=80" alt="Eventos" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/70 to-bg/30" />
      
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
              <div key={ev.id} className="group rounded-[24px] bg-transparent border border-white/5 p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 cursor-pointer hover:bg-white/10 transition-colors btn-spring">
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
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiClient.get('/cell-categories')
      .then(res => {
        if (res.data && res.data.length > 0) setCategories(res.data);
        else throw new Error("No categories");
      })
      .catch(err => {
        setCategories([
          { name: 'Adolescentes', age_group: '15 a 24 años', description: 'Reuniones dinámicas para adolescentes.', image_url: 'https://images.unsplash.com/photo-1529156069898-49953eb1f5bc?auto=format&fit=crop&q=80' },
          { name: 'Jóvenes Adultos', age_group: 'Solteros', description: 'Comunidad para jóvenes profesionales y universitarios.', image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80' },
          { name: 'Prejuveniles', age_group: '12 a 15 años', description: 'Un espacio seguro y divertido para crecer.', image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80' },
          { name: 'Varones', age_group: 'Hombres', description: 'Hombres compartiendo la palabra y construyendo familia.', image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb046ebf?auto=format&fit=crop&q=80' },
          { name: 'Mujeres', age_group: 'Mujeres', description: 'Un espacio de formación espiritual, apoyo mutuo y hermandad.', image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80' }
        ]);
      });
  }, []);

  if (categories.length === 0) return null;

  return (
    <section id="celulas" className="relative py-28 md:py-36 bg-bg border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-celeste/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald/20 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob" style={{ animationDelay: '4s' }} />

      <img src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80" alt="Comunidad" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30" />
      
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
          {categories.map((cat, i) => {
            let gridSpan = 'md:col-span-1';
            if (i === 0) gridSpan = 'md:col-span-2 md:row-span-2 lg:col-span-2'; 
            else if (i === categories.length - 1 && categories.length % 2 !== 0) gridSpan = 'md:col-span-2 lg:col-span-2'; 

            return (
            <div key={i} className={`group relative rounded-[32px] flex flex-col card-spring liquid-glass ${gridSpan}`}>
              <div className="absolute inset-0 rounded-[32px] overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/40 to-bg/10" />
              </div>
              <div className="relative z-10 w-full h-full p-8 flex flex-col justify-end text-left min-h-[200px]">
                <div>
                  <span className="bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4 inline-block backdrop-blur-md">
                    {cat.age_group}
                  </span>
                  <h3 className={`font-bold text-white mb-2 tracking-tight ${i === 0 ? 'text-[40px]' : 'text-[24px]'}`}>{cat.name}</h3>
                  <p className={`text-white/80 ${i === 0 ? 'text-[16px] max-w-sm' : 'text-[14px] max-w-xs'}`}>{cat.description}</p>
                </div>
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
  const [sermons, setSermons] = useState([]);

  useEffect(() => {
    setSermons([
      { id: 1, title: 'El Precio del Propósito', date: 'Agosto 2026', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80' },
      { id: 2, title: 'Identidad Inquebrantable', date: 'Julio 2026', image: 'https://images.unsplash.com/photo-1510563800743-aed236490d08?auto=format&fit=crop&q=80' },
      { id: 3, title: 'Fe en la Tormenta', date: 'Junio 2026', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80' },
    ]);
  }, []);

  if (sermons.length === 0) return null;

  return (
    <section id="mensajes" className="relative py-20 md:py-32 bg-bg border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber/10 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-blob" style={{ animationDelay: '1s' }} />
      
      <img src="https://images.unsplash.com/photo-1445384763658-0400939829cd?auto=format&fit=crop&q=80" alt="Mensajes Background" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-[#0F192B]/90 to-bg/50" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 mb-12">
        <Eyebrow>Últimas Prédicas</Eyebrow>
        <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
          Alimenta tu <span className="text-white">espíritu</span>.
        </h2>
      </div>

      <div className="relative z-10 flex overflow-x-auto gap-6 px-6 pb-12 snap-x snap-mandatory scrollbar-hide" style={{ scrollPaddingLeft: '1.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        <div className="w-[1px] shrink-0 md:w-[calc((100vw-72rem)/2)] hidden md:block" />
        
        {sermons.map((s) => (
          <a href="#" key={s.id} className="group relative shrink-0 w-[300px] md:w-[400px] aspect-[4/5] md:aspect-video rounded-[32px] liquid-glass hover:border-white/30 snap-start card-spring overflow-hidden">
            <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full liquid-glass flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                <Icon name="play" className="w-6 h-6 text-white ml-1" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 p-8 w-full z-10">
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
    <section id="ubicacion" className="relative py-20 md:py-32 bg-bg border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-celeste/20 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-blob" style={{ animationDelay: '3s' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob" />

      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" alt="Ubicación" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="rounded-[32px] liquid-glass p-10 md:p-14 flex flex-col justify-center card-spring">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20 mb-8 backdrop-blur-md">
              <Icon name="pin" className="w-6 h-6 text-white" />
            </div>
            <h3 className="display-mega text-white mb-4" style={{ fontSize: '2.5rem' }}>Visítanos</h3>
            <p className="text-[16px] text-white/70 font-medium mb-8 max-w-sm">
              7ª. Calle 12-66 zona 4,<br />
              carretera a las Ruinas de Zaculeu,<br />
              Huehuetenango
            </p>
            <a href="#" className="inline-flex items-center justify-between px-6 py-4 rounded-full bg-transparent border border-white/20 text-white text-[14px] font-bold hover:bg-white/10 transition-all btn-spring w-full md:w-max backdrop-blur-md">
              Ver en Google Maps
              <Icon name="arrow" className="w-4 h-4 ml-4" />
            </a>
          </div>

          <div className="rounded-[32px] liquid-glass p-10 md:p-14 flex flex-col justify-center card-spring">
            <h3 className="display-mega text-white mb-4" style={{ fontSize: '2.5rem' }}>¿Es tu primera vez?</h3>
            <p className="text-[16px] text-white/70 font-medium mb-8 max-w-sm">
              Queremos conocerte. Planifica tu visita y nos aseguraremos de que te sientas en casa desde el primer minuto.
            </p>
            <button onClick={onPlan} className="inline-flex items-center justify-between px-6 py-4 rounded-full liquid-glass text-white text-[14px] font-bold hover:border-white/40 transition-all btn-spring w-full md:w-max">
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

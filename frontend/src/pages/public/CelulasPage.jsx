// ============================================================
//  CelulasPage — módulo público de células. Cada tipo se
//  despliega mostrando sus células: nombre · líder · zona.
//  PRIVACIDAD: nunca direcciones exactas ni teléfonos (el
//  directorio completo es solo interno, ver CONTEXTO_IGLESIA).
//  API-first (GET /cells + /cell-categories) con fallback del
//  directorio real jul-2026 en su versión pública segura.
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import { useApi } from '../../lib/feed';

// Directorio público seguro (jul 2026) — solo célula · líder · zona
const GROUPS_FALLBACK = [
  {
    key: 'adolescentes', name: 'Adolescentes', age: '15 a 24 años',
    image: '/images/celulas/adolescentes.jpg',
    cells: [
      { name: 'Wild Youth', leader: 'Cristian de León', zone: 'Zona 4' },
      { name: 'Rain',       leader: 'Sucely Rivas',     zone: 'Zona 4' },
      { name: 'By Grace',   leader: 'Hugo Maldonado',   zone: 'Zona 2' },
      { name: 'Haven',      leader: 'Paula Ríos',       zone: 'Brasilia, Zona 7' },
    ],
  },
  {
    key: 'jovenes', name: 'Jóvenes Adultos', age: 'Solteros',
    image: '/images/celulas/jovenes.jpg',
    cells: [{ name: 'Kingdom', leader: 'David Oliveros', zone: 'Zona 8' }],
  },
  {
    key: 'prejuveniles', name: 'Prejuveniles', age: '12 a 15 años',
    image: '/images/celulas/prejuveniles.jpg',
    cells: [{ name: 'Esencia', leader: 'Heidy Marroquín', zone: 'Zona 8' }],
  },
  {
    key: 'varones', name: 'Varones', age: 'Hombres',
    image: '/images/celulas/varones.jpg',
    cells: [
      { name: 'Célula de varones', leader: 'Sergio Martínez',  zone: 'Zona 5' },
      { name: 'Célula de varones', leader: 'Rosendo Jiménez',  zone: 'Zona 4' },
      { name: 'Célula de varones', leader: 'Stephan Cruz',     zone: 'Zona 5' },
      { name: 'Célula de varones', leader: 'Henry Hernández',  zone: 'Zona 1' },
      { name: 'Célula de varones', leader: 'Aroldo Hernández', zone: 'Zona 2' },
      { name: 'Célula de varones', leader: 'Estuardo Vásquez', zone: 'San Lorenzo' },
    ],
  },
  {
    key: 'mujeres', name: 'Mujeres', age: 'Red Mujeres de Palabra',
    image: '/images/celulas/mujeres.jpg',
    cells: [
      { name: 'Conquistadoras',             leader: 'Pastora Ismeina Castillo', zone: 'Zona 4' },
      { name: 'Conquistadoras de Promesas', leader: 'Evelin Martínez',          zone: 'Zona 1' },
      { name: 'Conquistadoras del Rey',     leader: 'Arely García',             zone: 'Zona 4' },
      { name: 'Mujer Conquistadora',        leader: 'Vaneska Rivas',            zone: 'Zona 4' },
    ],
  },
];

// Mapea el `type` del backend (hombres|mujeres|jovenes|prejus|ninos)
// al grupo visual correspondiente
const TYPE_TO_KEY = {
  hombres: 'varones', varones: 'varones',
  mujeres: 'mujeres',
  jovenes: 'jovenes', adolescentes: 'adolescentes',
  prejus: 'prejuveniles', prejuveniles: 'prejuveniles',
  ninos: 'ninos', niños: 'ninos',
};

export default function CelulasPage() {
  const [params] = useSearchParams();
  const apiCells = useApi('/cells');
  const [open, setOpen] = useState(null);

  // Si el backend ya tiene células cargadas, sustituyen al fallback
  // dentro de su grupo; los grupos sin datos de API conservan el suyo.
  const groups = useMemo(() => {
    if (!Array.isArray(apiCells) || apiCells.length === 0) return GROUPS_FALLBACK;
    const byKey = {};
    apiCells.forEach(c => {
      const key = TYPE_TO_KEY[(c.type || '').toLowerCase()] || 'otros';
      (byKey[key] ||= []).push({ name: c.name, leader: c.leader, zone: c.zone, code: c.code });
    });
    return GROUPS_FALLBACK.map(g => byKey[g.key] ? { ...g, cells: byKey[g.key] } : g);
  }, [apiCells]);

  // ?tipo=Adolescentes (desde las cards del Home) abre ese grupo
  useEffect(() => {
    const tipo = params.get('tipo');
    if (!tipo) { setOpen(groups[0]?.key ?? null); return; }
    const hit = groups.find(g => g.name.toLowerCase().startsWith(tipo.toLowerCase().slice(0, 5)));
    setOpen(hit ? hit.key : groups[0]?.key ?? null);
  }, [params, groups]);

  return (
    <main className="bg-bg w-full min-h-screen">
      {/* Encabezado */}
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img src="/images/bg-ministerios.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/30" />
        </div>
        <Reveal className="relative z-10 max-w-6xl mx-auto px-6">
          <Eyebrow>Comunidad</Eyebrow>
          <h1 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
            Células
          </h1>
          <p className="mt-6 text-[18px] text-white/70 max-w-2xl">
            Grupos que se reúnen en casas durante la semana. Encuentra el tuyo
            por etapa de vida y zona — te esperamos.
          </p>
        </Reveal>
      </section>

      {/* Acordeón por tipo */}
      <section className="relative max-w-6xl mx-auto px-6 pb-24 flex flex-col gap-5">
        {groups.map((g, gi) => {
          const isOpen = open === g.key;
          return (
            <Reveal key={g.key} delay={gi * 0.05}>
              <div className={`liquid-glass rounded-[24px] overflow-hidden transition-colors ${isOpen ? 'border-white/25' : ''}`}>
                {/* Cabecera del grupo */}
                <button
                  onClick={() => setOpen(isOpen ? null : g.key)}
                  className="w-full flex items-center gap-6 p-6 md:p-8 text-left focus-ring"
                  aria-expanded={isOpen}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[16px] overflow-hidden shrink-0 border border-white/10">
                    <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[24px] md:text-[30px] font-bold text-white tracking-tight">{g.name}</h2>
                    <p className="text-[14px] text-white/60 font-semibold mt-1">
                      {g.age} · {g.cells.length} {g.cells.length === 1 ? 'célula' : 'células'}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0"
                  >
                    <Icon name="arrow" className="w-4 h-4" />
                  </motion.div>
                </button>

                {/* Células del grupo */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <RevealList className="grid sm:grid-cols-2 gap-3 px-6 md:px-8 pb-6 md:pb-8">
                        {g.cells.map((c, i) => (
                          <RevealItem key={`${c.name}-${i}`}>
                            <Tilt max={4} className="rounded-[16px] bg-white/5 border border-white/10 p-5 flex items-center gap-4 h-full">
                              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                                <Icon name="users" className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[16px] font-bold text-white leading-tight">{c.name}</p>
                                <p className="text-[13px] text-white/60 font-medium mt-0.5">{c.leader}</p>
                              </div>
                              <span className="ml-auto shrink-0 bg-white/10 border border-white/15 text-white/80 px-3 py-1 rounded-full text-[12px] font-semibold">
                                {c.zone}
                              </span>
                            </Tilt>
                          </RevealItem>
                        ))}
                      </RevealList>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}

        {/* CTA de contacto — sin exponer direcciones: escríbenos y te conectamos */}
        <Reveal delay={0.1}>
          <div className="liquid-glass rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h3 className="text-[22px] font-bold text-white">¿No sabes cuál es para ti?</h3>
              <p className="text-[15px] text-white/70 mt-2 max-w-lg">
                Escríbenos y te conectamos con el líder de la célula más cercana a ti.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <motion.a
                href="https://www.instagram.com/ig.casadelrey/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-pill bg-white text-bg text-[14px] font-bold focus-ring"
              >
                <Icon name="instagram" className="w-4 h-4" />
                Escríbenos
              </motion.a>
              <Link
                to="/"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-pill liquid-glass text-white text-[14px] font-bold focus-ring"
              >
                Visítanos
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

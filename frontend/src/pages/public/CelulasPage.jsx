// ============================================================
//  CelulasPage — módulo público de células, en un layout de
//  panel maestro-detalle (sidebar de categorías + ventana de
//  contenido), al estilo de Ajustes del Sistema de macOS: dos
//  superficies de cristal separadas en vez de un único acordeón.
//  Cada célula muestra solo nombre · líder · zona (PRIVACIDAD:
//  nunca direcciones exactas — el directorio completo es interno,
//  ver CONTEXTO_IGLESIA). API-first (GET /cells + /cell-categories)
//  con fallback del directorio real jul-2026 en su versión segura.
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import { useApi } from '../../lib/feed';

const PRESS = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.94 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

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
  const apiCategories = useApi('/cell-categories');
  const [active, setActive] = useState(null);

  // Si el backend ya tiene células cargadas, sustituyen al fallback
  // dentro de su grupo; los grupos sin datos de API conservan el suyo.
  // La FOTO de cada grupo también prefiere la que suba el admin en
  // AdminSitePhotos (CellCategory.image_url) sobre el fallback local.
  const groups = useMemo(() => {
    const imageByName = {};
    if (Array.isArray(apiCategories)) {
      apiCategories.forEach(cat => { if (cat.image_url) imageByName[cat.name] = cat.image_url; });
    }

    const withImages = GROUPS_FALLBACK.map(g =>
      imageByName[g.name] ? { ...g, image: imageByName[g.name] } : g
    );

    if (!Array.isArray(apiCells) || apiCells.length === 0) return withImages;
    const byKey = {};
    apiCells.forEach(c => {
      const key = TYPE_TO_KEY[(c.type || '').toLowerCase()] || 'otros';
      (byKey[key] ||= []).push({ name: c.name, leader: c.leader, zone: c.zone, code: c.code });
    });
    return withImages.map(g => byKey[g.key] ? { ...g, cells: byKey[g.key] } : g);
  }, [apiCells, apiCategories]);

  // ?tipo=Adolescentes (desde las cards del Home) selecciona ese grupo
  useEffect(() => {
    const tipo = params.get('tipo');
    if (!tipo) { setActive(groups[0]?.key ?? null); return; }
    const hit = groups.find(g => g.name.toLowerCase().startsWith(tipo.toLowerCase().slice(0, 5)));
    setActive(hit ? hit.key : groups[0]?.key ?? null);
  }, [params, groups]);

  const current = groups.find(g => g.key === active) || groups[0];

  return (
    <main className="bg-bg w-full min-h-screen">
      {/* Encabezado */}
      <section className="relative pt-40 pb-14 overflow-hidden">
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

      {/* Panel maestro-detalle: dos ventanas de cristal separadas */}
      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        {current && (
          <Reveal className="grid lg:grid-cols-[300px_1fr] gap-5 items-start">

            {/* Ventana izquierda — lista de categorías */}
            <nav
              aria-label="Categorías de células"
              className="liquid-glass rounded-[24px] p-3 lg:sticky lg:top-28 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible"
            >
              {groups.map(g => {
                const isActive = g.key === current.key;
                return (
                  <button
                    key={g.key}
                    onClick={() => setActive(g.key)}
                    className="relative shrink-0 lg:w-full flex items-center gap-3 px-3.5 py-3 rounded-[16px] text-left focus-ring transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="cell-nav-active"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 bg-white/10 border border-white/15 rounded-[16px]"
                      />
                    )}
                    <div className="relative z-10 w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10">
                      <img src={g.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative z-10 min-w-0">
                      <p className={`text-[14px] font-bold whitespace-nowrap lg:whitespace-normal leading-tight ${isActive ? 'text-white' : 'text-white/70'}`}>
                        {g.name}
                      </p>
                      <p className="text-[11.5px] text-white/45 font-medium mt-0.5 hidden sm:block">
                        {g.cells.length} {g.cells.length === 1 ? 'célula' : 'células'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Ventana derecha — detalle del grupo seleccionado */}
            <div className="liquid-glass rounded-[24px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {/* Banner de la categoría */}
                  <div className="relative h-40 md:h-48">
                    <img src={current.image} alt={current.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 md:p-8">
                      <h2 className="text-[26px] md:text-[32px] font-bold text-white tracking-tight">{current.name}</h2>
                      <p className="text-[13.5px] text-white/70 font-semibold mt-1">
                        {current.age} · {current.cells.length} {current.cells.length === 1 ? 'célula' : 'células'}
                      </p>
                    </div>
                  </div>

                  {/* Células del grupo */}
                  <RevealList className="grid sm:grid-cols-2 gap-3 p-6 md:p-8">
                    {current.cells.map((c, i) => (
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
              </AnimatePresence>
            </div>
          </Reveal>
        )}

        {/* CTA de contacto — sin exponer direcciones: escríbenos y te conectamos */}
        <Reveal delay={0.1} className="mt-5">
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
                {...PRESS}
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

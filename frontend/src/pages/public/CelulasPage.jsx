// ============================================================
//  CelulasPage — módulo público de células. Layout COLLAGE: un hero
//  de fondo presente en toda la página, y encima las categorías como
//  "recortes" de cristal inclinados y de tamaños distintos (no un grid
//  monótono). Al pasar el cursor cada recorte se endereza. Al elegir
//  una categoría, sus células aparecen debajo, también sueltas.
//  Cada célula muestra solo nombre · líder · zona (PRIVACIDAD: nunca
//  direcciones exactas — el directorio completo es interno, ver
//  CONTEXTO_IGLESIA). API-first (GET /cells + /cell-categories) con
//  fallback del directorio real jul-2026 en su versión segura.
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal from '../../components/ui/Reveal';
import ParallaxImg from '../../components/ui/ParallaxImg';
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

const TYPE_TO_KEY = {
  hombres: 'varones', varones: 'varones',
  mujeres: 'mujeres',
  jovenes: 'jovenes', adolescentes: 'adolescentes',
  prejus: 'prejuveniles', prejuveniles: 'prejuveniles',
  ninos: 'ninos', niños: 'ninos',
};

// COLLAGE — cada recorte con su tamaño, inclinación y desfase vertical
// propios. Determinístico por índice (no aleatorio en cada render) para
// que el "desorden" sea estable. La card grande ancla la composición.
const COLLAGE = [
  { span: 'col-span-2 row-span-2', rot: -2.4, y: 0 },
  { span: 'col-span-1 row-span-1', rot: 2.8,  y: 26 },
  { span: 'col-span-1 row-span-1', rot: -1.8, y: -8 },
  { span: 'col-span-1 row-span-1', rot: 3.2,  y: 34 },
  { span: 'col-span-2 row-span-1', rot: -2.6, y: 12 },
  { span: 'col-span-1 row-span-1', rot: 2.0,  y: -4 },
];
// inclinaciones sutiles para las cards de células dentro del detalle
const CELL_ROT = [-1.6, 1.4, -0.8, 2.0, -2.0, 1.0, -1.2, 1.8];

export default function CelulasPage() {
  const [params] = useSearchParams();
  const apiCells = useApi('/cells');
  const apiCategories = useApi('/cell-categories');
  const [active, setActive] = useState(null);

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

  useEffect(() => {
    const tipo = params.get('tipo');
    if (!tipo) { setActive(groups[0]?.key ?? null); return; }
    const hit = groups.find(g => g.name.toLowerCase().startsWith(tipo.toLowerCase().slice(0, 5)));
    setActive(hit ? hit.key : groups[0]?.key ?? null);
  }, [params, groups]);

  const current = groups.find(g => g.key === active) || groups[0];

  return (
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      {/* Hero de fondo presente en TODA la página — las cards de cristal
          lo dejan ver, apenas suavizado. */}
      <ParallaxImg src="/images/bg-ministerios.jpg" alt="" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg pointer-events-none" />

      <div className="relative z-10">
        {/* Encabezado */}
        <section className="pt-40 pb-8 max-w-6xl mx-auto px-6">
          <Reveal>
            <Eyebrow>Comunidad</Eyebrow>
            <h1 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
              Células
            </h1>
            <p className="mt-6 text-[18px] text-white/70 max-w-2xl">
              Grupos que se reúnen en casas durante la semana. Elige tu etapa de
              vida — cada recorte es una comunidad esperándote.
            </p>
          </Reveal>
        </section>

        {/* COLLAGE de categorías */}
        <section className="max-w-6xl mx-auto px-6 pt-6 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[150px] sm:auto-rows-[165px] gap-x-5 gap-y-9">
            {groups.map((g, i) => {
              const c = COLLAGE[i % COLLAGE.length];
              const isActive = g.key === current?.key;
              const big = c.span.includes('row-span-2');
              return (
                <motion.button
                  key={g.key}
                  onClick={() => setActive(g.key)}
                  initial={{ opacity: 0, y: 24 + c.y, rotate: c.rot }}
                  whileInView={{ opacity: 1, y: c.y, rotate: c.rot }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ type: 'spring', stiffness: 120, damping: 16, delay: i * 0.06 }}
                  whileHover={{ rotate: 0, scale: 1.05, y: c.y - 6, zIndex: 30 }}
                  className={`liquid-glass liquid-shine group relative ${c.span} rounded-[22px] overflow-hidden text-left focus-ring ${isActive ? 'ring-2 ring-white/60' : 'ring-1 ring-white/10'}`}
                  style={{ transformOrigin: 'center' }}
                  aria-pressed={isActive}
                >
                  <img
                    src={g.image}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isActive ? 'opacity-70' : 'opacity-45 group-hover:opacity-65'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/45 to-bg/5" />
                  <div className="relative z-10 h-full w-full flex flex-col justify-end p-4 sm:p-5">
                    <span className="self-start bg-white/12 border border-white/20 text-white/90 px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-auto backdrop-blur-md">
                      {g.age}
                    </span>
                    <h3 className={`font-bold text-white tracking-tight leading-none ${big ? 'text-[28px] sm:text-[34px]' : 'text-[17px] sm:text-[19px]'}`}>
                      {g.name}
                    </h3>
                    <p className="text-[12.5px] text-white/60 font-medium mt-1.5">
                      {g.cells.length} {g.cells.length === 1 ? 'célula' : 'células'}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* DETALLE del grupo elegido — sus células, sueltas */}
        <section className="max-w-6xl mx-auto px-6 pt-6 pb-16">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                  <div>
                    <p className="text-[13px] font-semibold text-white/50">{current.age}</p>
                    <h2 className="text-[28px] md:text-[34px] font-bold text-white tracking-tight leading-tight">
                      {current.name}
                    </h2>
                  </div>
                  <p className="text-[14px] text-white/60 font-medium">
                    {current.cells.length} {current.cells.length === 1 ? 'célula activa' : 'células activas'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {current.cells.map((c, i) => (
                    <motion.div
                      key={`${c.name}-${i}`}
                      initial={{ opacity: 0, y: 18, rotate: CELL_ROT[i % CELL_ROT.length] }}
                      animate={{ opacity: 1, y: 0, rotate: CELL_ROT[i % CELL_ROT.length] }}
                      transition={{ type: 'spring', stiffness: 140, damping: 17, delay: i * 0.04 }}
                      whileHover={{ rotate: 0, scale: 1.035, zIndex: 20 }}
                      className="liquid-glass liquid-shine rounded-[18px] p-5 flex items-center gap-4 grow basis-[260px] max-w-[420px]"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                        <Icon name="users" className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[16px] font-bold text-white leading-tight truncate">{c.name}</p>
                        <p className="text-[13px] text-white/60 font-medium mt-0.5 truncate">{c.leader}</p>
                      </div>
                      <span className="ml-auto shrink-0 bg-white/10 border border-white/15 text-white/80 px-3 py-1 rounded-full text-[12px] font-semibold">
                        {c.zone}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA de contacto — sin exponer direcciones */}
          <Reveal delay={0.1} className="mt-12">
            <div className="liquid-glass liquid-shine rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 justify-between">
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
      </div>
    </main>
  );
}

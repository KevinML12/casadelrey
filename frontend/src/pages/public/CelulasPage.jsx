// ============================================================
//  CelulasPage — módulo de VENTANAS SOBREPUESTAS (filosofía macOS
//  Liquid Glass). Base: un hero de fondo + las 5 categorías como
//  recortes de cristal en collage. Al elegir una, se abre una
//  ventana de cristal flotante SOBRE TODO con la galería de células
//  de ese tipo; detrás asoman los otros tipos apilados como cartas,
//  y saltas entre ellos trayéndolos al frente. Este patrón de
//  ventanas apiladas es el lenguaje de diseño del sitio.
//
//  Cada célula muestra solo nombre · líder · zona (PRIVACIDAD: nunca
//  direcciones exactas — el directorio completo es interno, ver
//  CONTEXTO_IGLESIA). API-first (GET /cells + /cell-categories) con
//  fallback del directorio real jul-2026 en su versión segura.
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal from '../../components/ui/Reveal';
import ParallaxImg from '../../components/ui/ParallaxImg';
import WindowStack from '../../components/ui/WindowStack';
import Tilt from '../../components/ui/Tilt';
import { useApi, useSitePhoto } from '../../lib/feed';

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

// Foto genérica para una categoría creada desde el panel que aún no tiene
// foto propia en /admin/site-photos (mismo fallback genérico que usan los
// departamentos de voluntariado) -- nunca un hueco en blanco.
const DEFAULT_CATEGORY_IMAGE = '/images/nosotros/comunidad.jpg';

// COLLAGE base — recortes de tamaños/inclinaciones distintos
const COLLAGE = [
  { span: 'col-span-2 row-span-2', rot: -2.4, y: 0 },
  { span: 'col-span-1 row-span-1', rot: 2.8,  y: 26 },
  { span: 'col-span-1 row-span-1', rot: -1.8, y: -8 },
  { span: 'col-span-1 row-span-1', rot: 3.2,  y: 34 },
  { span: 'col-span-2 row-span-1', rot: -2.6, y: 12 },
  { span: 'col-span-1 row-span-1', rot: 2.0,  y: -4 },
];

// Normaliza nombres para matchear célula ↔ directorio de líderes
// ("Cristian de León" vs "cristian de leon")
const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export default function CelulasPage() {
  const heroImg = useSitePhoto('hero_celulas', '/images/bg-ministerios.jpg');
  const [params] = useSearchParams();
  const apiCells = useApi('/cells');
  const apiCategories = useApi('/cell-categories');
  // Directorio de líderes (foto + WhatsApp) — curado por el admin en
  // /admin/leaders. Si el líder de una célula está en el directorio, su
  // card gana foto real y el botón escribe DIRECTO a su WhatsApp.
  const apiLeaders = useApi('/leaders');
  const [openKey, setOpenKey] = useState(null); // ventana abierta (o null)

  const leaderByName = useMemo(() => {
    const map = {};
    (Array.isArray(apiLeaders) ? apiLeaders : []).forEach(l => { map[norm(l.name)] = l; });
    return map;
  }, [apiLeaders]);

  // Categorías 100% administrables (/admin/cell-categories): nombre, edad,
  // descripción y type_key (a qué tipo estructural de célula pertenece)
  // vienen de la API. GROUPS_FALLBACK SOLO se usa si el admin aún no ha
  // creado ninguna categoría o la API falla -- nunca pisa datos reales.
  const groups = useMemo(() => {
    const cats = Array.isArray(apiCategories) ? apiCategories.filter(c => c.is_active !== false) : [];
    const cellsByType = {};
    (Array.isArray(apiCells) ? apiCells : []).forEach(c => {
      const t = (c.type || '').toLowerCase();
      (cellsByType[t] ||= []).push({ name: c.name, leader: c.leader, zone: c.zone, code: c.code, description: c.description });
    });

    if (cats.length === 0) {
      const byKey = {};
      Object.entries(cellsByType).forEach(([type, cells]) => {
        const key = TYPE_TO_KEY[type] || 'otros';
        byKey[key] = [...(byKey[key] || []), ...cells];
      });
      return GROUPS_FALLBACK.map(g => byKey[g.key] ? { ...g, cells: byKey[g.key] } : g);
    }

    const base = cats.map(cat => ({
      key: `cat-${cat.ID}`,
      name: cat.name,
      age: cat.age_group,
      image: cat.image_url || DEFAULT_CATEGORY_IMAGE,
      cells: cat.type_key ? (cellsByType[cat.type_key.toLowerCase()] || []) : [],
    }));

    // Células cuyo tipo no tiene ninguna categoría activa que lo reclame
    // -- "Otros" las recoge en vez de desaparecer en silencio (mismo
    // patrón de seguridad que usa VolunteeringPage con sus departamentos).
    const claimedTypes = new Set(cats.filter(c => c.type_key).map(c => c.type_key.toLowerCase()));
    const leftover = Object.entries(cellsByType)
      .filter(([type]) => !claimedTypes.has(type))
      .flatMap(([, cells]) => cells);

    return leftover.length > 0
      ? [...base, { key: 'otros', name: 'Otros', age: '', image: DEFAULT_CATEGORY_IMAGE, cells: leftover }]
      : base;
  }, [apiCells, apiCategories]);

  // ?tipo=Adolescentes (desde el Home) abre directo esa ventana
  useEffect(() => {
    const tipo = params.get('tipo');
    if (!tipo) return;
    const hit = groups.find(g => g.name.toLowerCase().startsWith(tipo.toLowerCase().slice(0, 5)));
    if (hit) setOpenKey(hit.key);
  }, [params, groups]);

  // Ítems para la pila de ventanas (WindowStack)
  const windowItems = useMemo(
    () => groups.map(g => ({ key: g.key, image: g.image, badge: g.age, title: g.name })),
    [groups]
  );

  return (
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      {/* Hero de fondo presente en toda la página */}
      <ParallaxImg src={heroImg} alt="" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg pointer-events-none" />

      <div className="relative z-10">
        <section className="pt-40 pb-8 max-w-6xl mx-auto px-6">
          <Reveal>
            <Eyebrow>Comunidad</Eyebrow>
            <h1 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
              Células
            </h1>
            <p className="mt-6 text-[18px] text-white/70 max-w-2xl">
              Grupos que se reúnen en casas durante la semana. Toca un tipo para
              abrir su ventana — y salta entre ellas.
            </p>
          </Reveal>
        </section>

        {/* COLLAGE de tipos — cada recorte abre su ventana */}
        <section className="max-w-6xl mx-auto px-6 pt-6 pb-28">
          <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[150px] sm:auto-rows-[165px] gap-x-5 gap-y-9">
            {groups.map((g, i) => {
              const c = COLLAGE[i % COLLAGE.length];
              const big = c.span.includes('row-span-2');
              return (
                // Wrapper solo para la ENTRADA en 3D (rotateX): Tilt ya es
                // dueño de rotateX/rotateY para el tilt de cursor/scroll, así
                // que la profundidad de aparición vive en un nodo aparte —
                // si compartieran la misma propiedad, una de las dos se
                // pisaría en silencio.
                <motion.div
                  key={g.key}
                  className={c.span}
                  initial={{ opacity: 0, rotateX: 16, scale: 0.92 }}
                  whileInView={{ opacity: 1, rotateX: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ type: 'spring', stiffness: 120, damping: 16, delay: i * 0.06 }}
                  style={{ transformPerspective: 1000, transformOrigin: 'center' }}
                >
                  <Tilt
                    as="button"
                    max={4}
                    scrollMax={3}
                    onClick={() => setOpenKey(g.key)}
                    whileHover={{ rotate: 0, scale: 1.05, y: c.y - 6, zIndex: 30 }}
                    glass
                    className="liquid-glass group relative w-full h-full rounded-[22px] overflow-hidden text-left focus-ring ring-1 ring-white/10"
                    style={{ rotate: c.rot, y: c.y, transformOrigin: 'center' }}
                  >
                    <img
                      src={g.image}
                      alt=""
                      className="parallax-layer absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-65 transition-all duration-700"
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
                        {g.cells.length} {g.cells.length === 1 ? 'célula' : 'células'} · abrir
                      </p>
                    </div>
                  </Tilt>
                </motion.div>
              );
            })}
          </div>

          {/* Contacto — sin exponer direcciones */}
          <Reveal delay={0.1} depth className="mt-14">
            <Tilt max={3} glass className="glass-light rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className="text-[22px] font-bold text-bg">¿No sabes cuál es para ti?</h3>
                <p className="text-[15px] text-bg/70 mt-2 max-w-lg">
                  Escríbenos y te conectamos con el líder de la célula más cercana a ti.
                </p>
              </div>
              <a
                href="https://www.instagram.com/ig.casadelrey/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-pill bg-bg text-white text-[14px] font-bold focus-ring shrink-0"
              >
                <Icon name="instagram" className="w-4 h-4" />
                Escríbenos
              </a>
            </Tilt>
          </Reveal>
        </section>
      </div>

      {/* ═══════ VENTANAS SOBREPUESTAS ═══════ */}
      <WindowStack
        items={windowItems}
        openKey={openKey}
        onChange={setOpenKey}
        renderContent={(it) => {
          const g = groups.find(gr => gr.key === it.key);
          if (!g) return null;
          return (
            <>
              <p className="text-[13px] font-semibold text-white/70 mb-4">
                {g.cells.length} {g.cells.length === 1 ? 'célula activa' : 'células activas'}
              </p>
              <div className="flex flex-wrap gap-3">
                {g.cells.map((c, i) => {
                  // Si el líder está en el directorio: foto real + WhatsApp
                  // directo a SU número (antes el wa.me iba sin destino).
                  const dir = leaderByName[norm(c.leader)];
                  const waText = encodeURIComponent(`Hola${dir ? ` ${c.leader.split(' ')[0]}` : ''}, me interesa unirme a la célula "${c.name}" (${g.name}, ${c.zone}). ¿Me pueden dar más información?`);
                  const href = dir?.phone
                    ? `https://wa.me/${dir.phone.replace(/\D/g, '')}?text=${waText}`
                    : `https://wa.me/?text=${waText}`;
                  return (
                  <Tilt
                    as="a"
                    key={`${c.name}-${i}`}
                    max={3}
                    href={href}
                    target="_blank" rel="noopener noreferrer"
                    aria-label={`Escribir al líder de la célula ${c.name}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.035 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    glass
                    className="glass-light group rounded-[16px] p-4 flex flex-col gap-3 grow basis-[260px] focus-ring cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      {dir?.photo_url ? (
                        <img src={dir.photo_url} alt={c.leader}
                          className="w-10 h-10 rounded-full object-cover border border-bg/15 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center text-bg shrink-0">
                          <Icon name="users" className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-bg leading-tight truncate">{c.name}</p>
                        <p className="text-[12.5px] text-bg/60 font-medium mt-0.5 truncate">
                          {c.leader}{dir?.phone ? ' · WhatsApp' : ''}
                        </p>
                      </div>
                      {c.zone && (
                        <span className="shrink-0 bg-bg/8 border border-bg/12 text-bg/80 px-2.5 py-1 rounded-full text-[11.5px] font-semibold">
                          {c.zone}
                        </span>
                      )}
                      <span className="shrink-0 w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-bg/45 group-hover:text-bg group-hover:bg-bg/8 transition-all">
                        <Icon name="arrow" className="w-4 h-4" />
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-[13px] text-bg/55 leading-relaxed line-clamp-2 pt-3 border-t border-bg/10">
                        {c.description}
                      </p>
                    )}
                  </Tilt>
                  );
                })}
              </div>
            </>
          );
        }}
      />
    </main>
  );
}

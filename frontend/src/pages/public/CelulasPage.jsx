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
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from '../../components/ui/Reveal';
import PageHero from '../../components/layout/PageHero';
import StatTrio from '../../components/ui/StatTrio';
import WindowStack from '../../components/ui/WindowStack';
import ModalWrapper from '../../components/ui/ModalWrapper';
import Tilt from '../../components/ui/Tilt';
import { useApi } from '../../lib/feed';
import { PRESS_PRIMARY } from '../../lib/motion';

const btnPrimary = 'w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-bg text-white px-6 py-4 text-15 font-bold focus-ring shadow-card hover:opacity-90';
const btnGhost = 'w-full inline-flex items-center justify-center gap-2 rounded-pill text-bg/55 hover:text-bg hover:bg-bg/5 px-6 py-3.5 text-14 font-semibold transition-colors';

// Halo ambiental que se enciende bajo la categoría que tiene el cursor.
// SIEMPRE el mismo tono (el acento único del sitio): lo que cambia al
// pasar de una card a otra es la posición del halo, no su color.
//
// Antes era un arreglo de 5 colores asignados por índice -- y esos 5
// resultaron ser literalmente la rampa 500 de Tailwind en su orden de
// fábrica (blue, rose, amber, emerald, violet), duplicada verbatim aquí
// y en VolunteeringPage. Un arcoíris repartido por posición de array no
// comunica nada sobre la categoría: es color decorativo, que es justo
// lo que el sitio no quiere.
const GLOW = '#E8823C';

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

// Compartido entre la lista de células (dentro del WindowStack) y el
// resultado del quiz -- antes vivía duplicado inline en el .map de la
// lista, ahora es una sola fuente de verdad para el link de WhatsApp.
function waHrefFor(cell, groupName, leaderByName) {
  const dir = leaderByName[norm(cell.leader)];
  const waText = encodeURIComponent(`Hola${dir ? ` ${cell.leader.split(' ')[0]}` : ''}, me interesa unirme a la célula "${cell.name}" (${groupName}, ${cell.zone}). ¿Me pueden dar más información?`);
  return dir?.phone
    ? `https://wa.me/${dir.phone.replace(/\D/g, '')}?text=${waText}`
    : `https://wa.me/?text=${waText}`;
}

// Cuerpo de la ventana de una categoría -- componente propio (no una
// función inline en renderContent) para que el filtro de zona tenga su
// propio estado LOCAL: WindowStack solo monta este cuerpo mientras esa
// categoría está al frente, así que el filtro se resetea solo cada vez
// que se abre/reabre una ventana, sin lógica extra de reset.
function CellCategoryDetail({ group, leaderByName }) {
  const [zoneFilter, setZoneFilter] = useState(null);
  const zones = [...new Set(group.cells.map(c => c.zone).filter(Boolean))];
  const filtered = zoneFilter ? group.cells.filter(c => c.zone === zoneFilter) : group.cells;

  return (
    <>
      <p className="text-13 font-semibold text-white/70 mb-4">
        {group.cells.length} {group.cells.length === 1 ? 'célula activa' : 'células activas'}
      </p>

      {/* Chips de zona -- solo si hay más de una, filtrar una sola zona
          no aporta nada. Mismo patrón que los chips de interés de
          Voluntariado, pero el dato real filtrable aquí es la zona, no
          hay un equivalente a "interés" en una célula. */}
      {zones.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setZoneFilter(null)}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-12 font-semibold transition-colors ${!zoneFilter ? 'bg-white text-bg' : 'bg-white/8 text-white/60 hover:bg-white/14 hover:text-white/85'}`}
          >
            Todas las zonas
          </button>
          {zones.map(z => (
            <button
              key={z}
              type="button"
              onClick={() => setZoneFilter(cur => cur === z ? null : z)}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-12 font-semibold transition-colors ${zoneFilter === z ? 'bg-white text-bg' : 'bg-white/8 text-white/60 hover:bg-white/14 hover:text-white/85'}`}
            >
              {z}
            </button>
          ))}
        </div>
      )}

      {/* Lista tipo directorio, no tarjetas con avatar -- de 16 células
          reales solo 1 líder tiene foto en el directorio (/admin/leaders),
          así que un círculo-avatar era casi siempre el mismo placeholder
          gris repetido fila tras fila -- eso es justo lo que se siente
          "de plantilla". Sin fingir una foto que no existe: tipografía
          grande para el nombre, un separador fino entre filas; toda la
          fila es el link de WhatsApp (aria-label lo deja explícito). */}
      <div className="flex flex-col divide-y divide-white/10">
        {filtered.map((c, i) => {
          const href = waHrefFor(c, group.name, leaderByName);
          return (
            <motion.a
              key={`${c.name}-${i}`}
              href={href}
              target="_blank" rel="noopener noreferrer"
              aria-label={`Escribir al líder de la célula ${c.name}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.03 }}
              className="group flex items-center gap-4 py-4 px-3 -mx-3 first:pt-0 last:pb-0 rounded-[12px] hover:bg-white/5 transition-colors focus-ring cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-17 font-bold text-white leading-tight truncate">{c.name}</p>
                <p className="text-13 text-white/50 font-medium mt-1 truncate">
                  {c.leader}{c.zone ? ` · ${c.zone}` : ''}
                </p>
                {c.description && (
                  <p className="text-13 text-white/40 leading-relaxed line-clamp-2 mt-1.5">
                    {c.description}
                  </p>
                )}
              </div>
            </motion.a>
          );
        })}
      </div>
    </>
  );
}

// Quiz/matchmaker de 2 pasos -- a diferencia del de Voluntariado (10
// departamentos planos), aquí la pregunta 1 (rango de edad/estado) ya
// resuelve la categoría casi siempre a simple vista, así que el valor
// real está en la pregunta 2 (zona): recomienda una CÉLULA ESPECÍFICA,
// no solo la categoría. La pregunta 2 se salta sola si la categoría
// elegida solo tiene una zona (o una sola célula) -- nada que filtrar.
function CellQuizModal({ groups, leaderByName, onViewDetail }) {
  const [step, setStep] = useState('category'); // 'category' | 'zone' | 'result'
  const [category, setCategory] = useState(null);
  const [zone, setZone] = useState(null);

  const chooseCategory = (g) => {
    setCategory(g);
    const zones = [...new Set(g.cells.map(c => c.zone).filter(Boolean))];
    setStep(zones.length > 1 ? 'zone' : 'result');
  };
  const chooseZone = (z) => { setZone(z); setStep('result'); };
  const restart = () => { setStep('category'); setCategory(null); setZone(null); };

  if (step === 'zone' && category) {
    const zones = [...new Set(category.cells.map(c => c.zone).filter(Boolean))];
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setStep('category')} className="text-12 font-bold text-bg/60 hover:text-bg transition-colors shrink-0">
            Atrás
          </button>
          <p className="text-13 font-semibold text-bg">{category.name}</p>
        </div>
        {/* Caja normal, no versales: unas micro-mayúsculas con tracking
            encima del titular son la fórmula del eyebrow que se quitó del
            sitio, solo que escrita a mano en vez de con el componente. */}
        <p className="text-13 font-semibold text-bg/50 mb-2">Pregunta 2 de 2</p>
        <h3 className="text-19 font-bold text-bg tracking-tight mb-5">¿En qué zona estás?</h3>
        <div className="flex flex-wrap gap-2">
          {zones.map(z => (
            <button
              key={z}
              type="button"
              onClick={() => chooseZone(z)}
              className="px-4 py-2.5 rounded-pill border border-bg/15 text-14 font-semibold text-bg hover:bg-bg hover:text-white hover:border-bg transition-colors"
            >
              {z}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (step === 'result' && category) {
    const cell = zone ? category.cells.find(c => c.zone === zone) : category.cells[0];
    const href = cell ? waHrefFor(cell, category.name, leaderByName) : null;
    return (
      <div className="text-center">
        {/* "Por tu edad y zona" en vez de "Tu célula ideal es": el
            resultado sale de las dos respuestas y nombrarlas es más
            honesto -- y evita que este modal y el de Voluntariado
            rematen con la misma frase ("Tu ___ ideal es"), que es lo que
            los hacía leer como el mismo widget parametrizado. */}
        <p className="text-13 font-semibold text-bg/50 mb-2">Por tu edad y zona</p>
        <h3 className="text-24 font-bold text-bg tracking-tight mb-1">{cell ? cell.name : category.name}</h3>
        <p className="text-14 text-bg/55 mb-4">{category.name}{cell?.zone ? ` · ${cell.zone}` : ''}</p>
        {category.image && (
          <div className="w-full h-36 rounded-[16px] overflow-hidden mb-4">
            <img src={category.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {cell && (
          <p className="text-14 text-bg/65 leading-relaxed mb-6">
            La lidera {cell.leader}. Escríbele por WhatsApp y te reciben en la próxima reunión.
          </p>
        )}
        <div className="flex flex-col gap-2.5">
          {href && (
            <motion.a {...PRESS_PRIMARY} href={href} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
              Escribir por WhatsApp
            </motion.a>
          )}
          <button type="button" onClick={() => onViewDetail(category.key)} className={btnGhost}>
            Ver todas las de {category.name}
          </button>
          <button type="button" onClick={restart} className="text-13 font-semibold text-bg/45 hover:text-bg/70 transition-colors mt-1">
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-13 font-semibold text-bg/50 mb-2">Pregunta 1 de 2</p>
      {/* Antes "¿Cuál te describe mejor?" -- una letra de diferencia con
          la pregunta 1 del quiz de Voluntariado ("¿Qué te describe
          mejor?"). Aquí lo que se pregunta de verdad es a qué grupo de
          edad/etapa pertenece, así que se dice eso. */}
      <h3 className="text-19 font-bold text-bg tracking-tight mb-5">¿A qué grupo perteneces?</h3>
      {/* Fichas con foto real -- mismo tratamiento que el collage de
          categorías de la página (foto + degradado + nombre), no filas
          genéricas de icono-en-círculo. Así el quiz se siente parte de
          la página, no un widget de encuesta genérico pegado encima. */}
      <div className="grid grid-cols-2 gap-3">
        {groups.filter(g => g.cells.length > 0).map(g => (
          <button
            key={g.key}
            type="button"
            onClick={() => chooseCategory(g)}
            className="group relative rounded-[22px] overflow-hidden aspect-[4/5] text-left focus-ring"
          >
            {g.image && (
              <img
                src={g.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            {/* Texto anclado abajo → .scrim-card. Antes era un gradiente
                inline propio de esta ficha; el sitio tenía 25 variantes
                así, cada una inventada donde tocó escribirla. */}
            <div className="scrim-card" />
            <div className="relative z-10 h-full flex flex-col justify-end p-3.5">
              <p className="text-15 font-bold text-white leading-tight">{g.name}</p>
              {g.age && <p className="text-11 text-white/65 mt-0.5">{g.age}</p>}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

export default function CelulasPage() {
  const [params] = useSearchParams();
  const apiCells = useApi('/cells');
  const apiCategories = useApi('/cell-categories');
  // Directorio de líderes (foto + WhatsApp) — curado por el admin en
  // /admin/leaders. Si el líder de una célula está en el directorio, su
  // card gana foto real y el botón escribe DIRECTO a su WhatsApp.
  const apiLeaders = useApi('/leaders');
  const [openKey, setOpenKey] = useState(null); // ventana abierta (o null)
  const [quizOpen, setQuizOpen] = useState(false);
  const [hoverCategory, setHoverCategory] = useState(null); // key bajo el cursor -- colorea el halo ambiental

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

  // Stats reales (nada inventado): se CUENTAN sobre los grupos ya
  // resueltos desde la API -- cuántas células hay, cuántos grupos por
  // edad, en cuántas zonas distintas. La ficha que las pinta es
  // <StatTrio>, compartida con Voluntariado (antes el markup estaba
  // duplicado carácter por carácter en los dos archivos); lo que cambia
  // entre las dos páginas son estos datos, no la caja.
  const stats = useMemo(() => {
    const allCells = groups.flatMap(g => g.cells);
    const zonesCount = new Set(allCells.map(c => c.zone).filter(Boolean)).size;
    return [
      { n: String(allCells.length), label: allCells.length === 1 ? 'Célula activa' : 'Células activas' },
      { n: String(groups.length), label: 'Grupos por edad' },
      { n: String(zonesCount), label: zonesCount === 1 ? 'Zona alcanzada' : 'Zonas alcanzadas' },
    ];
  }, [groups]);

  return (
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      <PageHero
        title="Células"
        subtitle="Grupos que se reúnen en casas durante la semana. Toca un tipo para abrir su ventana — y salta entre ellas."
        photoSlot="hero_celulas"
        photoFallback="/images/bg-ministerios.jpg"
      >
        {/* "Busca por edad y zona", no "Descubre tu célula ideal": es
            literalmente lo que hace el quiz (pregunta 1 = grupo de edad,
            pregunta 2 = zona) y deja de rimar con el botón gemelo de
            Voluntariado, que decía "Descubre tu lugar ideal". Dos
            "Descubre tu ___ ideal" en el mismo sitio delatan un widget
            parametrizado, no dos herramientas distintas. */}
        <motion.button
          {...PRESS_PRIMARY}
          type="button"
          onClick={() => setQuizOpen(true)}
          className="inline-flex items-center gap-2 rounded-pill bg-white text-bg px-5 py-3 text-14 font-bold shadow-card hover:opacity-90"
        >
          Busca por edad y zona
        </motion.button>
      </PageHero>

      <div className="relative z-10">
        <section className="pb-8 max-w-6xl mx-auto px-6">
          <StatTrio stats={stats} className="mt-10" />
        </section>

        {/* COLLAGE de tipos — cada recorte abre su ventana */}
        <section className="relative max-w-6xl mx-auto px-6 pt-6 pb-28">
          {/* Halo ambiental -- cambia de color según la categoría bajo el
              cursor, mismo lenguaje que VolunteeringPage. Transición CSS
              plana (no framer-motion animate): en Voluntariado el
              animate={{opacity}} de motion.div no se comprometía al
              inline style de forma confiable, una transición CSS normal
              funciona igual de bien para un fade así de directo. */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: hoverCategory ? 0.5 : 0,
              background: `radial-gradient(680px circle at 50% 10%, ${GLOW}33, transparent 70%)`,
            }}
          />
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 auto-rows-[150px] sm:auto-rows-[165px] gap-x-5 gap-y-9">
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
                    onMouseEnter={() => setHoverCategory(g.key)}
                    onMouseLeave={() => setHoverCategory(null)}
                    whileHover={{ rotate: 0, scale: 1.05, y: c.y - 6, zIndex: 30 }}
                    glass
                    className="liquid-glass group relative w-full h-full rounded-[22px] overflow-hidden text-left focus-ring ring-1 ring-white/10"
                    style={{ rotate: c.rot, y: c.y, transformOrigin: 'center' }}
                  >
                    {/* Foto a color pleno. Antes llegaba al 45% (65% en
                        hover) Y con un degradado navy encima: las caras
                        de la congregación se leían como textura gris. El
                        contraste lo pone .scrim-card, que oscurece solo
                        el tercio de abajo, que es donde vive el texto. */}
                    <img
                      src={g.image}
                      alt=""
                      className="parallax-layer absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="scrim-card" />
                    <div className="relative z-10 h-full w-full flex flex-col justify-end p-4 sm:p-5">
                      <span className="self-start bg-white/12 border border-white/20 text-white/90 px-2.5 py-0.5 rounded-full text-11 font-semibold mb-auto backdrop-blur-md">
                        {g.age}
                      </span>
                      <h3 className={`font-bold text-white tracking-tight leading-none ${big ? 'text-28 sm:text-34' : 'text-17 sm:text-19'}`}>
                        {g.name}
                      </h3>
                      <p className="text-13 text-white/60 font-medium mt-1.5">
                        {g.cells.length} {g.cells.length === 1 ? 'célula' : 'células'} · abrir
                      </p>
                    </div>
                  </Tilt>
                </motion.div>
              );
            })}
          </div>

          {/* Contacto — sin exponer direcciones */}
          <Reveal delay={0.1} depth className="relative z-10 mt-14">
            {/* Sin Tilt: el panel no es navegable (el navegable es el
                link de adentro), así que inclinarlo prometía una
                interacción que no existe. El bisel de cristal vive en
                .glass-light y .liquid-shine -- lo único que se pierde es
                la rotación, y .liquid-shine se agrega a mano porque
                antes la ponía el prop `glass` de Tilt. */}
            <div className="glass-light liquid-shine rounded-[28px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className="text-22 font-bold text-bg">¿No sabes cuál es para ti?</h3>
                <p className="text-15 text-bg/70 mt-2 max-w-lg">
                  Escríbenos y te conectamos con el líder de la célula más cercana a ti.
                </p>
              </div>
              <a
                href="https://www.instagram.com/ig.casadelrey/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-pill bg-bg text-white text-14 font-bold focus-ring shrink-0"
              >
                Escríbenos
              </a>
            </div>
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
          return <CellCategoryDetail group={g} leaderByName={leaderByName} />;
        }}
      />

      {/* Quiz/matchmaker -- alternativa a hojear las 5 categorías para
          quien no sabe cuál célula es la suya. */}
      <AnimatePresence>
        {quizOpen && (
          <ModalWrapper onClose={() => setQuizOpen(false)}>
            <CellQuizModal
              groups={groups}
              leaderByName={leaderByName}
              onViewDetail={(key) => { setQuizOpen(false); setOpenKey(key); }}
            />
          </ModalWrapper>
        )}
      </AnimatePresence>
    </main>
  );
}

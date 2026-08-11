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
//  CONTEXTO_IGLESIA). 100% API (GET /cells + /cell-categories +
//  /leaders): si la API no trae categorías se pinta un estado vacío
//  explícito, nunca un directorio hardcodeado — el que vivía aquí ya
//  tenía nombres desactualizados respecto a la API.
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

// NOTA (ago-2026): aquí vivía GROUPS_FALLBACK, una copia hardcodeada del
// directorio de células. Solo se pintaba si /cell-categories devolvía 0
// categorías —- la API devuelve 5 activas, así que era código muerto—- y
// mientras tanto se había quedado atrás: decía "Célula de varones" x6
// donde la API dice "Célula de Sergio Martínez", y "Pastora Ismeina
// Castillo" donde la API dice "Ismeina Castillo de De León". El día que
// llegara a pintarse habría publicado nombres equivocados de personas
// reales. Ahora, sin categorías, se pinta un estado vacío explícito.

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

// El campo `zone` de una célula mezcla la zona con el punto de referencia
// ("Zona 4, Arco de la Feria", "Hotel Premier, Zona 8"), así que contar
// strings distintos daba 11 zonas donde solo hay 7 reales (1, 2, 4, 5, 7,
// 8 y San Lorenzo) y generaba casi un chip de filtro por célula -- en
// Varones salían 6 chips para 6 células y cada uno dejaba 1 sola fila.
// Esto extrae solo la zona; si no hay patrón "Zona N" (ej. "San Lorenzo")
// devuelve el string completo, que ahí SÍ es la zona entera. La referencia
// fina sigue visible en la fila, que es donde ayuda a decidir si queda
// cerca de casa.
const zonaCanonica = (z) => {
  const m = /zona\s*(\d+)/i.exec(z || '');
  return m ? `Zona ${m[1]}` : (z || '').trim();
};

// Zonas canónicas distintas de una lista de células, en orden de aparición.
const zonasDe = (cells) =>
  [...new Set(cells.map(c => zonaCanonica(c.zone)).filter(Boolean))];

// Compartido entre la lista de células (dentro del WindowStack) y el
// resultado del quiz -- antes vivía duplicado inline en el .map de la
// lista, ahora es una sola fuente de verdad para el link de WhatsApp.
//
// Devuelve null cuando el líder no tiene teléfono en /admin/leaders.
// Antes caía a `https://wa.me/?text=...` (sin número): eso abre WhatsApp
// con un selector de contactos VACÍO. Hoy ninguno de los 16 líderes está
// en el directorio, así que las 16 filas prometían un contacto que no
// existe y la iglesia ni se enteraba del intento. Con null, quien llama
// decide: fila informativa en vez de link roto. El día que el dueño
// cargue los números, las filas reviven solas sin tocar código.
function waHrefFor(cell, groupName, leaderByName) {
  const phone = (leaderByName[norm(cell.leader)]?.phone || '').replace(/\D/g, '');
  if (!phone) return null;
  const nombre = (cell.leader || '').split(' ')[0];
  const contexto = [groupName, cell.zone].filter(Boolean).join(', ');
  const waText = encodeURIComponent(
    `Hola${nombre ? ` ${nombre}` : ''}, me interesa unirme a la célula "${cell.name}"${contexto ? ` (${contexto})` : ''}. ¿Me pueden dar más información?`
  );
  return `https://wa.me/${phone}?text=${waText}`;
}

// Una fila de célula, compartida por la ventana (tono oscuro sobre
// .liquid-glass) y el resultado del quiz (tono claro sobre ModalWrapper).
// Es <a> SOLO si hay teléfono real; si no, es un <div> informativo con la
// misma tipografía y el mismo divide-y, pero sin href, sin aria-label de
// acción, sin cursor-pointer y sin hover -- nada que prometa un clic que
// no lleva a ningún lado.
function CellRow({ cell, groupName, leaderByName, index = 0, tone = 'dark' }) {
  const href = waHrefFor(cell, groupName, leaderByName);
  const dark = tone === 'dark';
  const Comp = href ? motion.a : motion.div;
  const linkProps = href
    ? {
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `Escribir por WhatsApp al líder de la célula ${cell.name}`,
      }
    : {};

  return (
    <Comp
      {...linkProps}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.03 }}
      className={`flex items-center gap-4 py-4 px-3 -mx-3 first:pt-0 last:pb-0 rounded-[12px] transition-colors ${
        href ? `cursor-pointer focus-ring ${dark ? 'hover:bg-white/5' : 'hover:bg-bg/5'}` : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-17 font-bold leading-tight truncate ${dark ? 'text-white' : 'text-bg'}`}>
          {cell.name}
        </p>
        <p className={`text-13 font-medium mt-1 truncate ${dark ? 'text-white/50' : 'text-bg/55'}`}>
          {cell.leader}{cell.zone ? ` · ${cell.zone}` : ''}
        </p>
        {cell.description && (
          <p className={`text-13 leading-relaxed line-clamp-2 mt-1.5 ${dark ? 'text-white/40' : 'text-bg/45'}`}>
            {cell.description}
          </p>
        )}
      </div>
    </Comp>
  );
}

// Cuerpo de la ventana de una categoría -- componente propio (no una
// función inline en renderContent) para que el filtro de zona tenga su
// propio estado LOCAL: WindowStack solo monta este cuerpo mientras esa
// categoría está al frente, así que el filtro se resetea solo cada vez
// que se abre/reabre una ventana, sin lógica extra de reset.
function CellCategoryDetail({ group, leaderByName }) {
  const [zoneFilter, setZoneFilter] = useState(null);
  const zones = zonasDe(group.cells);
  const filtered = zoneFilter
    ? group.cells.filter(c => zonaCanonica(c.zone) === zoneFilter)
    : group.cells;

  return (
    <>
      {/* La descripción la escribe el dueño en /admin/cell-categories y es
          lo único que explica de qué va la categoría ("Un espacio de
          formación espiritual, apoyo mutuo y hermandad."). Se descartaba al
          construir `groups`, así que al abrir "Mujeres" lo único que se
          leía era "4 células activas". En el collage NO va: las tarjetas ya
          llevan nombre + edad + conteo. */}
      {group.description && (
        <p className="text-15 text-white/70 leading-relaxed mb-5">{group.description}</p>
      )}

      <p className="text-13 font-semibold text-white/70 mb-4">
        {group.cells.length} {group.cells.length === 1 ? 'célula activa' : 'células activas'}
      </p>

      {/* Chips de zona -- solo si hay más de una zona canónica Y menos que
          células en el grupo: un filtro 1:1 con la lista (un chip por fila)
          no filtra nada, solo duplica la lista en forma de botones. Mismo
          patrón que los chips de interés de Voluntariado, pero el dato real
          filtrable aquí es la zona, no hay un equivalente a "interés" en
          una célula. */}
      {zones.length > 1 && zones.length < group.cells.length && (
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
          grande para el nombre, un separador fino entre filas. La fila es
          el link de WhatsApp solo cuando hay teléfono real (ver CellRow). */}
      <div className="flex flex-col divide-y divide-white/10">
        {filtered.map((c, i) => (
          <CellRow
            key={`${c.name}-${i}`}
            cell={c}
            groupName={group.name}
            leaderByName={leaderByName}
            index={i}
          />
        ))}
      </div>

      {/* Salida de la ventana. Mientras /admin/leaders no tenga los
          teléfonos de los líderes, NINGUNA fila es clicable y el visitante
          se quedaría sin forma de continuar. /conectate es el formulario de
          contacto REAL del sitio (los envíos caen en /admin/connect-cards),
          así que la iglesia sí se entera del intento. No se inventa aquí
          ningún teléfono ni correo: el único teléfono en la API
          (settings.contact_whatsapp) está documentado en el panel como
          respaldo de DONACIONES, no como contacto general. */}
      <div className="mt-6 pt-5 border-t border-white/10">
        <p className="text-13 text-white/55 leading-relaxed mb-3">
          {filtered.some(c => waHrefFor(c, group.name, leaderByName))
            ? '¿Prefieres que te contactemos nosotros? Déjanos tus datos.'
            : 'Déjanos tus datos y te conectamos con el líder de la célula más cercana a ti.'}
        </p>
        <Link
          to="/conectate"
          className="inline-flex items-center justify-center rounded-pill bg-white text-bg px-5 py-3 text-14 font-bold focus-ring hover:opacity-90 transition-opacity"
        >
          Conéctate
        </Link>
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
    // Zona canónica: con el string crudo, "Zona 5, Pradera" y "Zona 5,
    // atrás de los bomberos" contaban como dos zonas distintas y la
    // pregunta 2 pedía elegir entre puntos de referencia, no entre zonas.
    setStep(zonasDe(g.cells).length > 1 ? 'zone' : 'result');
  };
  const chooseZone = (z) => { setZone(z); setStep('result'); };
  const restart = () => { setStep('category'); setCategory(null); setZone(null); };

  if (step === 'zone' && category) {
    const zones = zonasDe(category.cells);
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
    // .filter(), no .find(): con datos reales una mujer de Zona 4 tiene 3
    // células disponibles y el resultado le enseñaba UNA, escondiendo las
    // otras dos bajo un titular que decía "por tu edad y zona". Si el
    // filtro deja fuera todo (zona sin células tras canonizar), se cae a
    // la categoría completa antes que mostrar una lista vacía.
    const enZona = zone ? category.cells.filter(c => zonaCanonica(c.zone) === zone) : [];
    const matches = enZona.length > 0 ? enZona : category.cells;
    const unica = matches.length === 1;
    return (
      <div className="text-center">
        {/* "Por tu edad y zona" en vez de "Tu célula ideal es": el
            resultado sale de las dos respuestas y nombrarlas es más
            honesto -- y evita que este modal y el de Voluntariado
            rematen con la misma frase ("Tu ___ ideal es"), que es lo que
            los hacía leer como el mismo widget parametrizado. */}
        <p className="text-13 font-semibold text-bg/50 mb-2">Por tu edad y zona</p>
        <h3 className="text-24 font-bold text-bg tracking-tight mb-1">
          {unica ? matches[0].name : category.name}
        </h3>
        <p className="text-14 text-bg/55 mb-4">
          {unica
            ? `${category.name}${matches[0].zone ? ` · ${matches[0].zone}` : ''}`
            : `${matches.length} células${zone && enZona.length > 0 ? ` en ${zone}` : ''}`}
        </p>
        {category.image && (
          <div className="w-full h-36 rounded-[16px] overflow-hidden mb-4">
            <img src={category.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Todas las coincidencias como lista divide-y, el mismo patrón
            que la ventana de la categoría -- en tono claro porque el modal
            del quiz es la superficie clara del sitio. Cada fila es link a
            WhatsApp solo si el líder tiene teléfono real (ver CellRow). */}
        <div className="flex flex-col divide-y divide-bg/10 text-left mb-5">
          {matches.map((c, i) => (
            <CellRow
              key={`${c.name}-${i}`}
              cell={c}
              groupName={category.name}
              leaderByName={leaderByName}
              index={i}
              tone="light"
            />
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {/* CTA primario a /conectate y no a un WhatsApp sin número: hoy
              ningún líder tiene teléfono cargado, así que "Escribir por
              WhatsApp" abría un selector de contactos VACÍO y el visitante
              se quedaba sin salida. Este formulario existe y sí llega a la
              iglesia (/admin/connect-cards). <Link> y no <a>: un <a>
              recargaría toda la SPA. Cuando el líder sí tiene teléfono, el
              contacto directo ya está en su fila de la lista de arriba. */}
          <Link to="/conectate" className={btnPrimary}>
            Déjanos tus datos
          </Link>
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
  // vienen de la API. Sin categorías activas no hay copia local que pintar
  // (ver la nota de GROUPS_FALLBACK arriba): las células sueltas caen en
  // "Otros" y, si tampoco hay células, la página muestra su estado vacío.
  const groups = useMemo(() => {
    const cats = Array.isArray(apiCategories) ? apiCategories.filter(c => c.is_active !== false) : [];
    const cellsByType = {};
    (Array.isArray(apiCells) ? apiCells : []).forEach(c => {
      const t = (c.type || '').toLowerCase();
      (cellsByType[t] ||= []).push({ name: c.name, leader: c.leader, zone: c.zone, code: c.code, description: c.description });
    });

    const base = cats.map(cat => ({
      key: `cat-${cat.ID}`,
      name: cat.name,
      age: cat.age_group,
      // La descripción la escribe el dueño en el panel y es el único texto
      // que explica de qué va la categoría -- antes se descartaba aquí.
      description: cat.description,
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
      ? [...base, { key: 'otros', name: 'Otros', age: '', description: '', image: DEFAULT_CATEGORY_IMAGE, cells: leftover }]
      : base;
  }, [apiCells, apiCategories]);

  // ?tipo=Adolescentes (desde el Home) abre directo esa ventana
  useEffect(() => {
    const tipo = params.get('tipo');
    if (!tipo) return;
    const hit = groups.find(g => g.name.toLowerCase().startsWith(tipo.toLowerCase().slice(0, 5)));
    if (hit) setOpenKey(hit.key);
  }, [params, groups]);

  // Ítems para la pila de ventanas (WindowStack). Sin `badge`: WindowStack
  // lo pinta como pill JUSTO ENCIMA del <h2> del título, que es la forma
  // exacta del eyebrow purgado del sitio -- y con datos reales el pill
  // repetía la palabra del titular ("Mujeres" sobre "Mujeres"). La edad
  // sigue visible en la tarjeta del collage, en su línea de metadatos.
  const windowItems = useMemo(
    () => groups.map(g => ({ key: g.key, image: g.image, title: g.name })),
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
    // Zona CANÓNICA, no el string crudo: contando strings el sitio publicaba
    // "11 Zonas alcanzadas" porque "Zona 4" y "Zona 4, Arco de la Feria"
    // contaban como dos. Las zonas reales hoy son 7 (1, 2, 4, 5, 7, 8 y San
    // Lorenzo). Es una cifra pública sobre el alcance de la iglesia: inflarla
    // por un descuido de parseo es exactamente el tipo de dato inventado que
    // este sitio no publica.
    const zonesCount = zonasDe(allCells).length;
    return [
      { n: String(allCells.length), label: allCells.length === 1 ? 'Célula activa' : 'Células activas' },
      { n: String(groups.length), label: 'Grupos por edad' },
      { n: String(zonesCount), label: zonesCount === 1 ? 'Zona alcanzada' : 'Zonas alcanzadas' },
    ];
  }, [groups]);

  return (
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      {/* El slot hero_celulas todavía no existe en /site-photos, así que
          esta página abre SIEMPRE con el fallback -- y el fallback era
          /images/bg-ministerios.jpg, exactamente el mismo que usa
          VolunteeringPage: dos páginas distintas abriendo con la misma foto.
          Una foto de células reales las distingue mientras tanto. El arreglo
          de fondo es que el dueño suba la foto al slot hero_celulas desde
          /admin/site-photos; el día que lo haga, esta línea deja de usarse
          sola. */}
      <PageHero
        title="Células"
        subtitle="Grupos que se reúnen en casas durante la semana. Toca un tipo para abrir su ventana — y salta entre ellas."
        photoSlot="hero_celulas"
        photoFallback="/images/nosotros/pastores-celulas.jpg"
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
                    {/* Sin pill de edad encima del <h3>: ese era un eyebrow
                        (etiqueta sobre titular), la forma que se purgó del
                        sitio -- y con datos reales repetía la palabra del
                        titular en 2 de 5 tarjetas (age_group "Mujeres" sobre
                        el título "Mujeres", "Hombres" sobre "Varones"). La
                        edad baja a la línea de metadatos, y solo cuando
                        aporta algo que el nombre no dice ya. */}
                    <div className="relative z-10 h-full w-full flex flex-col justify-end p-4 sm:p-5">
                      <h3 className={`font-bold text-white tracking-tight leading-none ${big ? 'text-28 sm:text-34' : 'text-17 sm:text-19'}`}>
                        {g.name}
                      </h3>
                      <p className="text-13 text-white/60 font-medium mt-1.5">
                        {g.cells.length} {g.cells.length === 1 ? 'célula' : 'células'}
                        {g.age && norm(g.age) !== norm(g.name) ? ` · ${g.age}` : ''} · abrir
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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import ParallaxImg from '../../components/ui/ParallaxImg';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import { Eyebrow } from '../../components/ui/Glass';
import Tilt from '../../components/ui/Tilt';
import WindowStack from '../../components/ui/WindowStack';
import ModalWrapper from '../../components/ui/ModalWrapper';
import apiClient from '../../lib/apiClient';
import { useSitePhoto, useApi } from '../../lib/feed';
import { useVolunteerAreas } from '../../lib/volunteerAreas';
import toast from 'react-hot-toast';

const PRESS = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

// Botón/CTA claro (bg-bg text-white) -- ya no hay GlassButton oscuro
// en este flujo, todo el modal es glass-light.
const btnPrimary = 'w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-bg text-white px-6 py-4 text-15 font-bold focus-ring disabled:opacity-60 shadow-card hover:opacity-90';
const btnGhost = 'w-full inline-flex items-center justify-center gap-2 rounded-pill text-bg/55 hover:text-bg hover:bg-bg/5 px-6 py-3.5 text-14 font-semibold transition-colors';
const btnSmallPrimary = 'px-4 py-2 rounded-full bg-bg text-white text-13 font-bold disabled:opacity-40 hover:opacity-90 transition-opacity';
const btnSmallGhost = 'px-4 py-2 rounded-full text-bg/55 hover:text-bg hover:bg-bg/5 text-13 font-semibold transition-colors';

// "Elige por mí" pero con un nombre que se lee bien en un formulario --
// no es que no importe el departamento, es que el POSTULANTE no tiene
// preferencia y delega la decision en el equipo. Valor real que llega
// al backend en vez de un department vacio/ambiguo.
const NO_PREFERENCE = 'sin_preferencia';
const NO_PREFERENCE_LABEL = 'Sin preferencia — que me recomienden';
const NO_PREFERENCE_WHY = 'Nuestro equipo va a revisar tus talentos e intereses para recomendarte el área donde más puedas servir y crecer.';

const STATS = [
  { n: '~90', label: 'Voluntarios sirviendo' },
  { n: '10', label: 'Departamentos' },
  { n: '20', label: 'Líderes de célula' },
];

// Agrupa los 10 departamentos en familias temáticas -- antes era un solo
// grid plano de 10 tarjetas idénticas, sin jerarquía visual.
const CATEGORIES = [
  { name: 'Alabanza y arte', values: ['alabanza', 'danza'] },
  { name: 'Anfitrionaje y protocolo', values: ['servidores', 'protocolo', 'pancartas'] },
  { name: 'Niños y enseñanza', values: ['maestros_ninos'] },
  { name: 'Multimedia y producción', values: ['tecnicos_audiovisuales', 'multimedia'] },
  { name: 'Oración y logística', values: ['oracion', 'logistica'] },
];

// Masonry tipo Pinterest (CSS columns, no grid-auto-flow): se probó el
// collage con spans/rotate fijos de GalleryPage.jsx pero el usuario lo
// vio "torcido" e incompleto -- pidió tarjetas más grandes que llenen
// todo el espacio y SIN inclinación. Con columns cada tarjeta ocupa su
// alto natural y las columnas se acomodan solas, sin huecos que rellenar
// a mano ni ángulos fijos.
const HEIGHTS = ['h-[288px]', 'h-[240px]', 'h-[336px]', 'h-[272px]', 'h-[384px]', 'h-[256px]'];

// Tags de interés por departamento (frontend-only, no vive en la DB --
// son una capa de descubrimiento, no contenido administrable). Los
// reusan tanto los chips de filtro como el quiz de abajo: 'frente'/
// 'apoyo' son un eje aparte (visibilidad) que solo usa la pregunta 2
// del quiz, no aparecen como chip de filtro.
const DEPT_TAGS = {
  alabanza: ['musica', 'frente'],
  danza: ['musica', 'frente'],
  servidores: ['personas', 'apoyo'],
  protocolo: ['personas', 'frente'],
  pancartas: ['personas', 'apoyo'],
  maestros_ninos: ['ninos', 'frente'],
  tecnicos_audiovisuales: ['tecnologia', 'apoyo'],
  multimedia: ['tecnologia', 'apoyo'],
  oracion: ['oracion', 'apoyo'],
  logistica: ['organizacion', 'apoyo'],
};

const INTEREST_TAGS = [
  { key: 'musica', label: 'Música y arte', icon: 'mic' },
  { key: 'personas', label: 'Atender personas', icon: 'heart' },
  { key: 'ninos', label: 'Niños', icon: 'book' },
  { key: 'tecnologia', label: 'Tecnología', icon: 'headphones' },
  { key: 'oracion', label: 'Oración', icon: 'pray' },
  { key: 'organizacion', label: 'Organización', icon: 'box' },
];

const QUIZ_QUESTIONS = [
  {
    q: '¿Qué te describe mejor?',
    options: [
      { label: 'Me encanta la música y el arte', icon: 'mic', tags: ['musica'] },
      { label: 'Disfruto servir y atender personas', icon: 'heart', tags: ['personas'] },
      { label: 'Amo trabajar con niños', icon: 'book', tags: ['ninos'] },
      { label: 'Se me da la tecnología', icon: 'headphones', tags: ['tecnologia'] },
      { label: 'Prefiero orar y organizar', icon: 'pray', tags: ['oracion', 'organizacion'] },
    ],
  },
  {
    q: '¿Prefieres estar al frente o dar soporte detrás de cámara?',
    options: [
      { label: 'Al frente, visible', icon: 'spark', tags: ['frente'] },
      { label: 'Detrás, dando soporte', icon: 'box', tags: ['apoyo'] },
      { label: 'Cualquiera de los dos', icon: 'check', tags: [] },
    ],
  },
];

// Encuentra el departamento con más tags en común con lo que respondió
// el usuario -- empate se resuelve por orden (el primero que alcanza el
// score más alto), determinista, no aleatorio.
function bestMatch(areas, selectedTags) {
  let best = null, bestScore = -1;
  for (const a of areas) {
    const tags = DEPT_TAGS[a.value] || [];
    const score = tags.filter(t => selectedTags.includes(t)).length;
    if (score > bestScore) { bestScore = score; best = a; }
  }
  return best;
}

// Halo ambiental detrás del grid que cambia de color según la categoría
// bajo el cursor -- 4 acentos ya existentes en la paleta (rose/amber/
// emerald/celeste) más un violeta puntual solo para esto (no hay 5to
// tono semántico en tailwind.config.js, y usarlo aquí no exige agregar
// uno -- es un valor inline, no una clase).
const CATEGORY_GLOW = ['#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#8B5CF6'];

// Departamento ya elegido (por WindowStack, o "sin preferencia" por
// defecto) se muestra COMO DATO, no como un <select> abierto -- cambiar
// de opinion es una accion explicita ("Cambiar") en vez de un desliz
// accidental del mouse sobre un dropdown.
function DepartmentLocked({ department, areas, onRequestChange }) {
  const area = areas.find(a => a.value === department);
  return (
    <div className="rounded-[14px] border border-bg/12 bg-bg/5 px-4 py-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-11 font-bold uppercase tracking-widest text-bg/45 mb-1">Departamento</p>
        <p className="text-15 font-bold text-bg truncate">{area ? area.title : NO_PREFERENCE_LABEL}</p>
      </div>
      <button type="button" onClick={onRequestChange} className="shrink-0 text-13 font-semibold text-bg/55 hover:text-bg underline underline-offset-4 decoration-bg/20">
        Cambiar
      </button>
    </div>
  );
}

function VolunteerForm({ department: initialDepartment, areas, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: initialDepartment || NO_PREFERENCE, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // Cambiar de departamento requiere: abrir el selector (changing) ->
  // elegir uno (pendingChange, todavia NO aplicado) -> confirmar. Cerrar
  // sin confirmar deja form.department intacto -- la "doble verificacion"
  // que se pidio.
  const [changing, setChanging] = useState(false);
  const [pendingChange, setPendingChange] = useState('');
  // Enviar no dispara el POST directo -- primero confirma con el "por
  // que" de ese departamento a la vista.
  const [confirming, setConfirming] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const requestChange = () => { setPendingChange(form.department); setChanging(true); };
  const cancelChange = () => { setChanging(false); setPendingChange(''); };
  const confirmChange = () => {
    setForm(p => ({ ...p, department: pendingChange }));
    setChanging(false);
    setPendingChange('');
  };

  const reviewSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nombre y correo son requeridos');
      return;
    }
    setConfirming(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/volunteer/register', form);
      setSent(true);
      toast.success('Gracias — nos comunicaremos contigo pronto.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar. Intenta de nuevo.');
      setConfirming(false);
    } finally { setSubmitting(false); }
  };

  const area = areas.find(a => a.value === form.department);

  if (sent) {
    return (
      <div className="text-center py-6">
        <h3 className="text-22 text-bg font-bold mb-2">Inscripción recibida</h3>
        <p className="text-14 text-bg/60">Nuestro equipo se pondrá en contacto contigo.</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-full bg-bg text-white text-14 font-semibold shadow-card hover:opacity-90">
          Listo
        </button>
      </div>
    );
  }

  // ── Pantalla: confirmar antes de enviar, con el "por qué" a la vista
  if (confirming) {
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setConfirming(false)} className="text-12 font-bold text-bg/60 hover:text-bg transition-colors shrink-0">
            Atrás
          </button>
          <p className="text-12 text-bg font-bold uppercase tracking-wide">Confirmar aplicación</p>
        </div>
        <h3 className="text-21 font-bold text-bg tracking-tight mb-4">{area ? area.title : NO_PREFERENCE_LABEL}</h3>
        <div className="glass-light-nested rounded-[16px] p-5 mb-6">
          <p className="text-11 font-bold uppercase tracking-widest text-bg/50 mb-2">¿Por qué aquí?</p>
          <p className="text-15 text-bg/75 leading-relaxed">{area ? area.why : NO_PREFERENCE_WHY}</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <motion.button {...PRESS} onClick={confirmSubmit} disabled={submitting} className={btnPrimary}>
            {submitting ? 'Enviando…' : 'Confirmar aplicación'}
          </motion.button>
          <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className={btnGhost}>
            Volver a editar
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 pr-10">
        <p className="text-12 text-bg font-bold uppercase tracking-wide">Aplicación</p>
        <p className="text-14 text-bg/60 mt-0.5">{area ? area.title : NO_PREFERENCE_LABEL}</p>
      </div>

      <form onSubmit={reviewSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-13 font-semibold text-bg/60 mb-2">Nombre completo</span>
            <input className="input-light" value={form.name} onChange={set('name')} required />
          </label>
          <label className="block">
            <span className="block text-13 font-semibold text-bg/60 mb-2">Correo electrónico</span>
            <input type="email" className="input-light" value={form.email} onChange={set('email')} required />
          </label>
        </div>
        <label className="block">
          <span className="block text-13 font-semibold text-bg/60 mb-2">Teléfono (opcional)</span>
          <input type="tel" className="input-light" value={form.phone} onChange={set('phone')} />
        </label>

        {!changing ? (
          <DepartmentLocked department={form.department} areas={areas} onRequestChange={requestChange} />
        ) : (
          <div className="rounded-[14px] border border-bg/12 bg-bg/5 p-4 space-y-3">
            <p className="text-13 font-semibold text-bg/60">
              ¿Seguro que quieres cambiar tu elección actual ({area ? area.title : NO_PREFERENCE_LABEL})?
            </p>
            <select
              className="input-light w-full appearance-none cursor-pointer"
              value={pendingChange}
              onChange={e => setPendingChange(e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              <option value={NO_PREFERENCE}>{NO_PREFERENCE_LABEL}</option>
              {areas.map(a => <option key={a.value} value={a.value}>{a.title}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="button" disabled={!pendingChange} onClick={confirmChange} className={btnSmallPrimary}>
                Confirmar cambio
              </button>
              <button type="button" onClick={cancelChange} className={btnSmallGhost}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <label className="block">
          <span className="block text-13 font-semibold text-bg/60 mb-2">Mensaje (opcional)</span>
          <textarea
            rows={3}
            className="input-light w-full resize-none"
            value={form.message}
            onChange={set('message')}
            placeholder="Cuéntanos por qué quieres servir..."
          />
        </label>

        <motion.button
          type="submit"
          {...PRESS}
          className={btnPrimary}
        >
          Continuar
        </motion.button>
      </form>
    </>
  );
}

// Foto a toda vista (sin degradado ni ícono encima) + un chip flotante
// "glass-light" (blanco escarchado, texto navy -- lo pidió el usuario en
// vez del degradado navy que traía) con el título/descripción, igual
// tratamiento que usan los modales claros del sitio. big: solo la tarjeta
// "hero" de una categoría de un solo departamento -- título más grande.
// Tilt (NO rotación estática): se probó el collage con spans/rotate FIJOS
// (ver comentario de HEIGHTS más arriba) y el usuario lo rechazó por verse
// "torcido". Tilt es distinto -- la card queda perfectamente recta en
// reposo, solo se inclina en 3D siguiendo al cursor/scroll (vuelve a
// plano al soltar). Es la misma reactividad de cristal que Home/Células/
// Galería, sin reintroducir el ángulo fijo que se pidió quitar.
function DepartmentCard({ title, desc, photo, big, height, onClick }) {
  return (
    <Tilt
      as="button"
      type="button"
      onClick={onClick}
      max={6}
      glass
      hoverScale={1.02}
      className={`group relative block w-full overflow-hidden rounded-[20px] text-left focus-ring ${height}`}
    >
      <img
        src={photo}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-x-3 bottom-3 glass-light rounded-[16px] px-4 py-3">
        <h3 className={`font-bold text-bg tracking-tight leading-tight ${big ? 'text-19' : 'text-15'}`}>{title}</h3>
        {desc && <p className="text-13 text-bg/60 mt-1 leading-snug line-clamp-2">{desc}</p>}
      </div>
    </Tilt>
  );
}

// Quiz de 2 preguntas -- matchmaker rápido para quien no sabe cuál
// departamento elegir (alternativa a hojear las 10 tarjetas). Vive en
// su propio ModalWrapper-like porque necesita pasos internos (pregunta
// 1 -> 2 -> resultado) que VolunteerForm no maneja.
function QuizModal({ areas, onViewDetail, onApply }) {
  const [step, setStep] = useState(0); // 0,1 = preguntas; 'result' = resultado
  const [tags, setTags] = useState([]);
  const [result, setResult] = useState(null);

  const answer = (optionTags) => {
    const nextTags = [...tags, ...optionTags];
    if (step < QUIZ_QUESTIONS.length - 1) {
      setTags(nextTags);
      setStep(step + 1);
    } else {
      setTags(nextTags);
      setResult(bestMatch(areas, nextTags));
      setStep('result');
    }
  };

  const restart = () => { setStep(0); setTags([]); setResult(null); };

  if (step === 'result') {
    return (
      <div className="text-center">
        <p className="text-11 font-bold uppercase tracking-widest text-bg/45 mb-2">Tu lugar ideal es</p>
        <h3 className="text-24 font-bold text-bg tracking-tight mb-4">{result ? result.title : 'Cualquier departamento'}</h3>
        {result?.photo && (
          <div className="w-full h-36 rounded-[16px] overflow-hidden mb-4">
            <img src={result.photo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-14 text-bg/65 leading-relaxed mb-6">{result ? result.why : NO_PREFERENCE_WHY}</p>
        <div className="flex flex-col gap-2.5">
          <motion.button {...PRESS} onClick={() => onApply(result?.value || '')} className={btnPrimary}>
            Aplicar a {result ? result.title : 'este departamento'}
          </motion.button>
          {result && (
            <button type="button" onClick={() => onViewDetail(result.value)} className={btnGhost}>
              Ver detalle primero
            </button>
          )}
          <button type="button" onClick={restart} className="text-13 font-semibold text-bg/45 hover:text-bg/70 transition-colors mt-1">
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[step];
  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        {QUIZ_QUESTIONS.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-bg' : 'bg-bg/12'}`} />
        ))}
      </div>
      <p className="text-11 font-bold uppercase tracking-widest text-bg/45 mb-2">Pregunta {step + 1} de {QUIZ_QUESTIONS.length}</p>
      <h3 className="text-19 font-bold text-bg tracking-tight mb-5">{question.q}</h3>
      <div className="flex flex-col gap-2.5">
        {question.options.map(opt => (
          <button
            key={opt.label}
            type="button"
            onClick={() => answer(opt.tags)}
            className="rounded-[14px] border border-bg/12 bg-bg/4 px-4 py-3.5 text-left hover:bg-bg/8 hover:border-bg/20 transition-colors"
          >
            <span className="text-14 font-semibold text-bg">{opt.label}</span>
          </button>
        ))}
      </div>
      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className="mt-4 text-13 font-semibold text-bg/45 hover:text-bg/70 transition-colors">
          ← Pregunta anterior
        </button>
      )}
    </>
  );
}

export default function VolunteeringPage() {
  const [openKey, setOpenKey] = useState(null);   // departamento abierto en el WindowStack
  const [formDept, setFormDept] = useState(null);  // null = modal cerrado, '' = abierto sin preseleccion
  const [quizOpen, setQuizOpen] = useState(false);
  const [activeTag, setActiveTag] = useState(null);   // chip de interés activo (filtra el grid) o null
  const [hoverCategory, setHoverCategory] = useState(null); // categoría bajo el cursor -- colorea el halo ambiental
  // Administrable desde /admin/site-photos (antes ruta hardcodeada — el
  // admin no podía cambiarla sin deploy). El local queda de fallback.
  const sectionImg = useSitePhoto('voluntariado_seccion', '/images/nosotros/servidores.jpg');
  // Departamentos reales desde /volunteer-areas (admin-editable), con
  // fallback local si la API aun no responde. Una sola llamada a
  // /site-photos, la resolucion de foto por departamento es JS plano (no
  // un hook por item) -- 10 useSitePhoto en un .map violaria las reglas
  // de hooks.
  const liveAreas = useVolunteerAreas();
  const sitePhotos = useApi('/site-photos') || {};
  const areas = liveAreas.map(a => ({ ...a, photo: sitePhotos[`voluntariado_${a.value}`] || a.photoFallback }));

  // Departamentos que el admin agregue y no encajen en ninguna de las 5
  // categorias curadas (values fijos abajo) igual deben aparecer en
  // algun lado -- "Otros" los recoge en vez de desaparecer en silencio.
  const categorized = new Set(CATEGORIES.flatMap(c => c.values));
  const leftover = areas.filter(a => !categorized.has(a.value));
  const categoriesWithLeftover = leftover.length > 0
    ? [...CATEGORIES, { name: 'Otros', values: leftover.map(a => a.value) }]
    : CATEGORIES;

  // images: segunda foto opcional (voluntariado_<value>_2, admin-editable
  // en /admin/site-photos) para el carrusel del banner -- si no existe,
  // el array queda con 1 sola foto y WindowStack cae a modo estático.
  const windowItems = areas.map(a => ({
    key: a.value,
    image: a.photo,
    images: [a.photo, sitePhotos[`voluntariado_${a.value}_2`]].filter(Boolean),
    title: a.title,
  }));

  // Color del halo ambiental por categoría -- mismo orden que se pinta,
  // así el índice coincide con CATEGORY_GLOW.
  const categoryGlow = Object.fromEntries(categoriesWithLeftover.map((c, i) => [c.name, CATEGORY_GLOW[i % CATEGORY_GLOW.length]]));

  // Índice global (no por categoría) para que el patrón de tamaños/
  // inclinaciones del collage varíe de verdad a lo largo de las 10
  // tarjetas, en vez de reiniciarse en cada categoría (donde 1-3 items
  // casi nunca alcanzan a mostrar la variedad).
  const globalIndex = Object.fromEntries(areas.map((a, i) => [a.value, i]));
  // A qué categoría pertenece cada departamento -- se usa también en el
  // chip de la ventana de detalle.
  const categoryOf = value => categoriesWithLeftover.find(c => c.values.includes(value))?.name;

  const openForm = (value = '') => {
    setOpenKey(null);
    setFormDept(value);
  };

  return (
    <main className="min-h-screen bg-bg text-white">
      <PageHero
        eyebrow="Sirve con tus talentos"
        title="Voluntariado"
        subtitle="Cada persona tiene un lugar. Únete a los más de 90 voluntarios que ya sirven en 10 departamentos."
        photoSlot="hero_voluntariado"
        photoFallback="/images/bg-ministerios.jpg"
      />

      <section className="relative py-4 pb-24 overflow-hidden">
        <ParallaxImg src={sectionImg} alt="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/55 to-bg" />
        {/* Halo ambiental -- cambia de color según la categoría bajo el
            cursor, le da sensación de "vivo" al fondo sin tocar el grid.
            CSS transition plano en vez de motion.div: el animate={{opacity}}
            de framer-motion no se comprometía al inline style en pruebas
            (se quedaba en el opacity por defecto del navegador) -- una
            transición CSS normal es más simple y funciona igual de bien
            para un fade tan directo. */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: hoverCategory ? 0.5 : 0,
            background: `radial-gradient(680px circle at 50% 20%, ${hoverCategory ? categoryGlow[hoverCategory] : '#3B82F6'}33, transparent 70%)`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <Reveal className="mb-10 text-center max-w-2xl mx-auto">
            <Eyebrow>Departamentos</Eyebrow>
            <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}>
              ¿Dónde quieres servir?
            </h2>
            <p className="mt-4 text-16 text-white/70">Toca un departamento para conocerlo mejor.</p>
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                {...PRESS}
                type="button"
                onClick={() => setQuizOpen(true)}
                className="inline-flex items-center gap-2 rounded-pill bg-white text-bg px-5 py-3 text-14 font-bold shadow-card hover:opacity-90"
              >
                Descubre tu lugar ideal
              </motion.button>
              <button
                type="button"
                onClick={() => openForm('')}
                className="text-14 font-semibold text-white/50 hover:text-white/80 transition-colors underline underline-offset-4 decoration-white/20"
              >
                O aplica sin preferencia
              </button>
            </div>
          </Reveal>

          <RevealList className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-14">
            {STATS.map(s => (
              <RevealItem key={s.label}>
                <div className="glass-light rounded-[18px] px-3 py-5 text-center h-full">
                  <div className="text-26 sm:text-30 font-extrabold text-bg tracking-tighter leading-none">{s.n}</div>
                  <div className="mt-1.5 text-11 sm:text-12 font-semibold text-bg/55 leading-tight">{s.label}</div>
                </div>
              </RevealItem>
            ))}
          </RevealList>

          {/* Chips de interés -- filtran el grid de abajo. Reusan los
              mismos tags que puntúan el quiz, así los dos caminos
              (explorar vs. que te recomienden) llevan a lo mismo. */}
          <Reveal className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-13 font-semibold transition-colors ${!activeTag ? 'bg-white text-bg' : 'bg-white/8 text-white/60 hover:bg-white/14 hover:text-white/85'}`}
            >
              Todos
            </button>
            {INTEREST_TAGS.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTag(cur => cur === t.key ? null : t.key)}
                className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-13 font-semibold transition-colors ${activeTag === t.key ? 'bg-white text-bg' : 'bg-white/8 text-white/60 hover:bg-white/14 hover:text-white/85'}`}
              >
                {t.label}
              </button>
            ))}
          </Reveal>

          <div className="space-y-10">
            {categoriesWithLeftover.map(cat => {
              const catAreas = areas.filter(a => cat.values.includes(a.value) && (!activeTag || DEPT_TAGS[a.value]?.includes(activeTag)));
              if (catAreas.length === 0) return null;
              return (
                <div key={cat.name} onMouseEnter={() => setHoverCategory(cat.name)} onMouseLeave={() => setHoverCategory(null)}>
                  <p className="text-13 font-bold text-white/50 uppercase tracking-tightish mb-4">{cat.name}</p>
                  <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
                    {catAreas.map(area => {
                      const i = globalIndex[area.value];
                      // Categorías de un solo departamento (ej. "Niños y
                      // enseñanza") ocupan las columnas completas -- una
                      // tarjeta angosta y sola se vería como un error de layout.
                      const solo = catAreas.length === 1;
                      return (
                        <motion.div
                          key={area.value}
                          className="break-inside-avoid mb-3 sm:mb-4"
                          style={solo ? { columnSpan: 'all' } : undefined}
                          initial={{ opacity: 0, y: 18, scale: 0.96 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true, margin: '-60px' }}
                          transition={{ type: 'spring', stiffness: 120, damping: 16, delay: (i % 6) * 0.05 }}
                        >
                          <DepartmentCard {...area} big={solo} height={solo ? 'h-[300px]' : HEIGHTS[i % HEIGHTS.length]} onClick={() => setOpenKey(area.value)} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {activeTag && !areas.some(a => DEPT_TAGS[a.value]?.includes(activeTag)) && (
              <div className="text-center py-10">
                <p className="text-15 text-white/50 mb-3">Ningún departamento coincide con ese interés todavía.</p>
                <button type="button" onClick={() => setActiveTag(null)} className="text-14 font-semibold text-white/70 hover:text-white underline underline-offset-4 decoration-white/20">
                  Ver todos los departamentos
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ventana de cristal por departamento -- foto, por que servir ahi,
          y el boton que lleva al formulario. Con 10 items, las flechas/
          dots de WindowStack ya se comportan como un carrusel entre
          departamentos sin codigo extra. */}
      <WindowStack
        items={windowItems}
        openKey={openKey}
        onChange={setOpenKey}
        height="min(70vh, 560px)"
        light
        renderContent={(it) => {
          const a = areas.find(x => x.value === it.key);
          if (!a) return null;
          const category = categoryOf(a.value);
          return (
            <div className="grid sm:grid-cols-5 gap-5">
              {/* Columna principal -- antes todo iba en una sola columna
                  apilada y la ventana (780px de ancho) se sentía vacía;
                  el "¿por qué aquí?" pasa a panel lateral en desktop. */}
              <div className="sm:col-span-3 flex flex-col gap-4">
                {category && (
                  <span className="self-start inline-flex items-center gap-1.5 bg-bg/6 border border-bg/12 text-bg/60 px-3 py-1 rounded-full text-11 font-bold uppercase tracking-wide">
                    {category}
                  </span>
                )}
                <p className="text-bg/70 text-15 leading-relaxed">{a.desc}</p>
                <motion.button
                  {...PRESS}
                  onClick={() => openForm(a.value)}
                  className="mt-auto w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-bg text-white px-6 py-4 text-15 font-bold shadow-card hover:opacity-90"
                >
                  Aplicar a {a.title}
                </motion.button>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-4">
                <div className="glass-light-nested rounded-[16px] p-5 h-fit">
                  <p className="text-11 font-bold uppercase tracking-widest text-bg/50 mb-2">¿Por qué aquí?</p>
                  <p className="text-bg/75 text-15 leading-relaxed">{a.why}</p>
                </div>
                {/* Testimonio real -- solo si el admin cargó uno de verdad
                    (nunca se inventa una cita atribuida a alguien). */}
                {a.testimonial && (
                  <div className="glass-light-nested rounded-[16px] p-5 h-fit">
                    <p className="text-bg/70 text-14 italic leading-relaxed">"{a.testimonial}"</p>
                    {a.testimonialAuthor && <p className="text-bg/45 text-12 font-semibold mt-2">— {a.testimonialAuthor}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />

      {/* Quiz/matchmaker -- alternativa a hojear las 10 tarjetas para
          quien no sabe cuál departamento elegir. */}
      <AnimatePresence>
        {quizOpen && (
          <ModalWrapper onClose={() => setQuizOpen(false)}>
            <QuizModal
              areas={areas}
              onViewDetail={(value) => { setQuizOpen(false); setOpenKey(value); }}
              onApply={(value) => { setQuizOpen(false); openForm(value); }}
            />
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Formulario -- ya no vive siempre visible al fondo de la pagina,
          aparece como modal glass-light al presionar "Aplicar" (desde el
          WindowStack o el link "aplica de todas formas"). */}
      <AnimatePresence>
        {formDept !== null && (
          <ModalWrapper onClose={() => setFormDept(null)}>
            <VolunteerForm department={formDept} areas={areas} onClose={() => setFormDept(null)} />
          </ModalWrapper>
        )}
      </AnimatePresence>
    </main>
  );
}

import { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import GlassCard from '../../components/ui/GlassCard';
import WindowStack from '../../components/ui/WindowStack';
import ModalWrapper from '../../components/ui/ModalWrapper';
import apiClient from '../../lib/apiClient';
import { useApi } from '../../lib/feed';
import { useVolunteerAreas } from '../../lib/volunteerAreas';
import { PRESS_PRIMARY } from '../../lib/motion';
import toast from 'react-hot-toast';
import SectionBg from '../../components/ui/SectionBg';

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
// Toma amplia real; el administrador puede reemplazarla en Fotos del sitio.
const VOLUNTEER_BACKGROUND_FALLBACK = '/images/backgrounds/congregacion.webp';

const NO_PREFERENCE = 'sin_preferencia';
const NO_PREFERENCE_LABEL = 'Sin preferencia — que me recomienden';
const NO_PREFERENCE_WHY = 'Nuestro equipo va a revisar tus talentos e intereses para recomendarte el área donde más puedas servir y crecer.';

// Las cifras ya NO se escriben a mano aquí. Vivían como un STATS fijo
// ('~90 voluntarios', '10 departamentos', '20 líderes de célula') y las
// tres estaban mal por motivos distintos: la de líderes era de OTRA
// página (Células) y además falsa contra la API (16, no 20); la de
// departamentos era un número correcto por casualidad, congelado a mano
// mientras /volunteer-areas es admin-editable; y el "~90" es un
// placeholder disfrazado de dato -- no hay endpoint público que lo
// respalde. Ahora la única ficha se CUENTA sobre las áreas ya
// resueltas, igual que hace CelulasPage. Si el dueño quiere volver a
// mostrar el total de voluntarios, tiene que existir como dato (campo
// en el admin o endpoint), no como texto en este archivo.

// Agrupa los departamentos en familias temáticas -- antes era un solo
// grid plano de 10 tarjetas idénticas, sin jerarquía visual.
const CATEGORIES = [
  { name: 'Alabanza y arte', values: ['alabanza', 'danza'] },
  { name: 'Anfitrionaje y protocolo', values: ['servidores', 'protocolo', 'pancartas'] },
  { name: 'Niños y enseñanza', values: ['maestros_ninos'] },
  { name: 'Multimedia y producción', values: ['tecnicos_audiovisuales', 'multimedia'] },
  { name: 'Oración y logística', values: ['oracion', 'logistica'] },
];

// Aquí vivía HEIGHTS, seis alturas fijas para un masonry de CSS columns
// (columns-2/3/4). El masonry existe para rellenar huecos cuando hay
// MUCHOS elementos, pero se aplicaba DENTRO de cada familia y las
// familias tienen 2, 3, 1, 2 y 2 departamentos: con dos o tres tarjetas
// lo único que producía eran filas mochas y alturas desparejas. Ahora
// cada familia es una grilla regular con proporción fija (ver más
// abajo), así que ni las alturas sueltas ni el columnSpan inline de la
// tarjeta sola tienen razón de existir.

// Match por departamento (frontend-only, no vive en la DB -- es una capa
// de descubrimiento, no contenido administrable). Dos ejes distintos,
// separados a propósito:
//   interes     -- de qué se trata el departamento. Es lo que filtran
//                  los chips de arriba y lo que pregunta la pregunta 1.
//   visibilidad -- 'frente' o 'apoyo'. Solo lo usa la pregunta 2.
// Antes era UN array plano por departamento con los dos ejes mezclados y
// el quiz los puntuaba igual, que es de donde salía el resultado que
// contradecía la respuesta ("amo trabajar con niños" + "detrás" caía en
// Servidores, porque 'apoyo' pesaba lo mismo que 'ninos').
//
// 'pancartas' pasó de 'apoyo' a 'frente' -- no es un ajuste cosmético
// para desempatar: la propia área dice "servir con entusiasmo VISIBLE y
// ser parte activa del ambiente de cada culto" (campo `why` en la API).
// Estaba mal clasificada, y de paso era indistinguible de 'servidores'.
const DEPT_MATCH = {
  alabanza: { interes: ['musica'], visibilidad: ['frente'] },
  danza: { interes: ['musica'], visibilidad: ['frente'] },
  servidores: { interes: ['personas'], visibilidad: ['apoyo'] },
  protocolo: { interes: ['personas'], visibilidad: ['frente'] },
  pancartas: { interes: ['personas'], visibilidad: ['frente'] },
  maestros_ninos: { interes: ['ninos'], visibilidad: ['frente'] },
  tecnicos_audiovisuales: { interes: ['tecnologia'], visibilidad: ['apoyo'] },
  multimedia: { interes: ['tecnologia'], visibilidad: ['apoyo'] },
  oracion: { interes: ['oracion'], visibilidad: ['apoyo'] },
  logistica: { interes: ['organizacion'], visibilidad: ['apoyo'] },
};

// Un departamento que el dueño cree en /admin/volunteer-areas NO tiene
// entrada aquí (este mapa es de código, la lista es de la DB). No es un
// caso de error: es lo normal el día que agregue uno. Sin tags queda
// fuera de los chips de interés y el quiz nunca lo recomienda, pero
// aparece en el grid bajo "Otros" y se puede aplicar desde ahí. Este
// helper es el que garantiza que "sin tags" no reviente nada.
const EMPTY_MATCH = { interes: [], visibilidad: [] };
const matchOf = (value) => DEPT_MATCH[value] || EMPTY_MATCH;

// Cada entrada tenía además un campo `icon` ('mic', 'heart', 'book'…)
// que NADIE leía: el sitio público no dibuja pictogramas por decisión
// del dueño, así que eran nombres de glifos guardados por si acaso. Se
// borran para que nadie los "reconecte" pensando que faltaba renderizar
// algo.
const PANEL_TABS = [
  { value: 'gallery', label: 'Galería' },
  { value: 'photos', label: 'Fotos' },
  { value: 'info', label: 'Información' },
];
const subscribeCardLayout = callback => {
  const query = window.matchMedia('(min-width: 768px)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
};
const desktopCards = () => window.matchMedia('(min-width: 768px)').matches;
const mobileCards = () => false;

const QUIZ_QUESTIONS = [
  {
    q: '¿Qué te describe mejor?',
    options: [
      { label: 'Me encanta la música y el arte', tags: ['musica'] },
      { label: 'Disfruto servir y atender personas', tags: ['personas'] },
      { label: 'Amo trabajar con niños', tags: ['ninos'] },
      { label: 'Se me da la tecnología', tags: ['tecnologia'] },
      { label: 'Prefiero orar y organizar', tags: ['oracion', 'organizacion'] },
    ],
  },
  {
    q: '¿Prefieres estar al frente o dar soporte detrás de cámara?',
    options: [
      { label: 'Al frente, visible', tags: ['frente'] },
      { label: 'Detrás, dando soporte', tags: ['apoyo'] },
      { label: 'Cualquiera de los dos', tags: [] },
    ],
  },
];

// Puntúa cada departamento contra lo que respondió el visitante y
// devuelve TODOS los que empatan en el puntaje más alto (un array, no
// uno solo).
//
// Por qué así, tras encontrar tres defectos en la versión anterior:
//
// 1. El interés pesa el doble que la visibilidad. La pregunta 1 es de
//    vocación ("me encanta la música", "amo trabajar con niños") y la 2
//    es una preferencia de estilo. Cuando pesaban igual, "amo trabajar
//    con niños" + "detrás, dando soporte" empataba a Maestros de Niños
//    con Servidores y ganaba Servidores por ir antes en el array: la
//    página le respondía al visitante lo contrario de lo que dijo.
// 2. Devuelve el empate completo en vez del primero del array. Un quiz
//    de dos preguntas NO puede distinguir Alabanza de Danza (misma
//    música, ambos al frente); fingir que sí volvía inalcanzables a
//    Danza, Pancartas, Multimedia y Logística -- 4 de 10 departamentos
//    que ningún camino podía recomendar. Mostrar los dos es más honesto
//    que inventar una precisión que las preguntas no dan.
// 3. Puntaje 0 devuelve lista vacía. Antes `score > bestScore` con
//    bestScore = -1 hacía que el PRIMER departamento ganara aunque no
//    coincidiera en nada (p.ej. si todas las áreas son nuevas y no
//    tienen tags). Vacío deja que el resultado caiga en la salida "sin
//    preferencia" que la página ya tenía escrita.
const PESO_INTERES = 2;
const PESO_VISIBILIDAD = 1;

function bestMatches(areas, selectedTags) {
  let bestScore = 0;
  let best = [];
  for (const a of areas) {
    const { interes, visibilidad } = matchOf(a.value);
    const score =
      interes.filter(t => selectedTags.includes(t)).length * PESO_INTERES +
      visibilidad.filter(t => selectedTags.includes(t)).length * PESO_VISIBILIDAD;
    if (score === 0) continue;
    if (score > bestScore) { bestScore = score; best = [a]; }
    else if (score === bestScore) best.push(a);
  }
  return best;
}

// Halo ambiental que se enciende bajo la categoría con el cursor.
// SIEMPRE el mismo tono (el acento único del sitio): lo que cambia al
// pasar de una card a otra es la posición del halo, no su color. Ver la
// nota gemela en CelulasPage.jsx -- antes ambos archivos duplicaban el
// mismo arcoíris, que resultó ser la rampa 500 de Tailwind de fábrica.

// Departamento ya elegido (por WindowStack, o "sin preferencia" por
// defecto) se muestra COMO DATO, no como un <select> abierto -- cambiar
// de opinion es una accion explicita ("Cambiar") en vez de un desliz
// accidental del mouse sobre un dropdown.
function DepartmentLocked({ department, areas, onRequestChange }) {
  const area = areas.find(a => a.value === department);
  return (
    <div className="rounded-[14px] border border-bg/15 bg-white px-4 py-3.5 flex items-center justify-between gap-3 shadow-sm mt-5">
      <div className="min-w-0">
        <p className="text-12 font-bold uppercase tracking-widest text-bg/50 mb-1">Departamento</p>
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
  const area = areas.find(a => a.value === form.department);
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

  const campo = `w-full rounded-[14px] px-4 py-3.5 text-15 outline-none transition-all bg-white border border-bg/15 text-bg placeholder:text-bg/40 focus:border-bg/40 focus:ring-4 focus:ring-bg/5 shadow-sm`;

  if (sent) {
    return (
      <div className="text-center py-8">
        <h3 className="text-24 text-bg font-bold mb-3">¡Inscripción recibida!</h3>
        <p className="text-16 text-bg/75 leading-relaxed">Nuestro equipo se pondrá en contacto contigo.</p>
        <button onClick={onClose} className="mt-8 w-full inline-flex items-center justify-center rounded-pill px-6 py-3.5 text-14 font-semibold transition-colors text-bg/60 hover:text-bg hover:bg-bg/8">
          Terminar
        </button>
      </div>
    );
  }

  // ── Pantalla: confirmar antes de enviar, con el "por qué" a la vista
  if (confirming) {
    return (
      <div className="text-left flex flex-col min-h-full">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="self-start inline-flex items-center gap-1.5 text-13 font-bold mb-5 transition-colors focus-ring rounded-full px-2 py-1 -ml-2 text-bg/60 hover:text-bg"
        >
          Atrás
        </button>
        <p className="text-13 font-bold uppercase tracking-widest mb-2 text-bg/60">Confirmar aplicación</p>
        <h3 className="text-28 font-bold text-bg tracking-tight mb-6">{area ? area.title : NO_PREFERENCE_LABEL}</h3>

        <div className="glass-light-nested rounded-[20px] p-6 mb-8 border border-bg/10 shadow-sm bg-white">
          <p className="text-12 font-bold uppercase tracking-widest mb-3 text-bg/60">¿Por qué aquí?</p>
          <p className="text-16 text-bg/75 leading-relaxed font-medium">{area ? area.why : NO_PREFERENCE_WHY}</p>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button {...PRESS_PRIMARY} onClick={confirmSubmit} disabled={submitting} className={btnPrimary}>
            {submitting ? 'Enviando…' : 'Confirmar y Enviar'}
          </motion.button>
          <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className="w-full inline-flex items-center justify-center rounded-pill px-6 py-3.5 text-14 font-semibold transition-colors text-bg/60 hover:text-bg hover:bg-bg/8">
            Volver a editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-left flex flex-col min-h-full">
      <div className="mb-8">
        <p className="text-13 font-bold uppercase tracking-widest mb-1.5 text-bg/60">Aplicación</p>
        <h3 className="text-28 font-bold leading-tight text-bg">{area ? area.title : NO_PREFERENCE_LABEL}</h3>
      </div>

      <form onSubmit={reviewSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <span className="block text-13 font-bold text-bg mb-2">Nombre completo <span className="text-rose-500">*</span></span>
            <input className={campo} value={form.name} onChange={set('name')} placeholder="Ej. Ana Pérez" required />
          </label>
          <label className="block">
            <span className="block text-13 font-bold text-bg mb-2">Correo electrónico <span className="text-rose-500">*</span></span>
            <input type="email" className={campo} value={form.email} onChange={set('email')} placeholder="ana@ejemplo.com" required />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <span className="block text-13 font-bold text-bg mb-2">Teléfono / WhatsApp</span>
            <input type="tel" className={campo} value={form.phone} onChange={set('phone')} placeholder="Ej. 5555 1234" />
          </label>
        </div>

        {!changing ? (
          <DepartmentLocked department={form.department} areas={areas} onRequestChange={requestChange} />
        ) : (
          <div className="rounded-[14px] border border-bg/15 bg-white p-5 shadow-sm space-y-3">
            <p className="text-13 font-bold text-bg/60">
              ¿Seguro que quieres cambiar tu elección actual ({area ? area.title : NO_PREFERENCE_LABEL})?
            </p>
            <select
              className={`${campo} appearance-none cursor-pointer pr-10`}
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

        <label className="block mt-4">
          <span className="block text-13 font-bold text-bg mb-2">Mensaje <span className="font-normal text-bg/60">(opcional)</span></span>
          <textarea
            rows={3}
            className={`${campo} resize-none`}
            value={form.message}
            onChange={set('message')}
            placeholder="Cuéntanos por qué quieres servir..."
          />
        </label>

        <motion.button
          type="submit"
          {...PRESS_PRIMARY}
          className={btnPrimary}
        >
          Continuar
        </motion.button>
      </form>
    </div>
  );
}

// Una clasificación abre sus colecciones; ninguna fotografía vive en la card.
function ClassificationCard({ title, count, onClick }) {
  return (
    <GlassCard
      as="button"
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      glass
      className="liquid-glass relative flex flex-col w-full h-full min-h-[180px] rounded-[16px] p-7 text-left focus-ring"
    >
      <h3 className="text-24 font-bold text-white tracking-tight leading-tight">{title}</h3>
      <p className="text-14 text-white/75 mt-3">{count} {count === 1 ? 'departamento' : 'departamentos'}</p>
      <span className="mt-auto pt-6 text-13 font-semibold text-white/80">Explorar</span>
    </GlassCard>
  );
}

// Quiz de 2 preguntas -- matchmaker rápido para quien no sabe cuál
// departamento elegir (alternativa a hojear las 10 tarjetas). Vive en
// su propio ModalWrapper-like porque necesita pasos internos (pregunta
// 1 -> 2 -> resultado) que VolunteerForm no maneja.
function QuizModal({ areas, onViewDetail, onApply }) {
  const [step, setStep] = useState(0); // 0,1 = preguntas; 'result' = resultado
  // Una entrada POR PREGUNTA, no un array plano acumulado. Con el
  // acumulado, "← Pregunta anterior" dejaba pegados los tags de la
  // respuesta vieja: volver y contestar distinto puntuaba por las dos
  // cosas a la vez, incluida la que el visitante acababa de descartar.
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState([]);

  const answer = (optionTags) => {
    const next = answers.slice(0, step);
    next[step] = optionTags;
    setAnswers(next);
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setResults(bestMatches(areas, next.flat()));
      setStep('result');
    }
  };

  const restart = () => { setStep(0); setAnswers([]); setResults([]); };

  if (step === 'result') {
    // Empate real: dos preguntas no distinguen Alabanza de Danza, ni
    // Técnicos de Multimedia. Se muestran los dos (o tres) en vez de
    // elegir uno al azar disfrazado de recomendación.
    if (results.length > 1) {
      const titulos = results.map(r => r.title);
      const juntos = `${titulos.slice(0, -1).join(', ')} o ${titulos[titulos.length - 1]}`;
      return (
        <div>
          <p className="text-13 font-semibold text-bg/50 mb-2 text-center">Según tus respuestas</p>
          <h3 className="text-24 font-bold text-bg tracking-tight mb-3 text-center">{juntos}</h3>
          <p className="text-14 text-bg/60 leading-relaxed mb-5 text-center">
            Con dos preguntas no hay cómo separarlos: encajas igual de bien en cualquiera. Mira lo que hace cada uno y elige.
          </p>
          {/* Lista, no tarjetas: son opciones equivalentes en fila, y el
              sistema de diseño compone las listas con divide-y. */}
          <ul className="divide-y divide-bg/10 border-y border-bg/10 mb-5">
            {results.map(r => (
              <li key={r.value} className="py-4 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-15 font-bold text-bg">{r.title}</p>
                  <p className="text-13 text-bg/60 leading-snug mt-1">{r.why}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" onClick={() => onApply(r.value)} className={btnSmallPrimary}>
                      Aplicar
                    </button>
                    <button type="button" onClick={() => onViewDetail(r.value)} className={btnSmallGhost}>
                      Ver detalle
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={restart} className="block mx-auto text-13 font-semibold text-bg/45 hover:text-bg/70 transition-colors">
            Volver a intentar
          </button>
        </div>
      );
    }

    // results vacío = ninguna coincidencia (p.ej. departamentos nuevos
    // que todavía no tienen tags). Cae en la misma salida "sin
    // preferencia" que ya usa el enlace del hero, en vez de recomendar
    // el primero de la lista como si fuera un resultado.
    const result = results[0] || null;
    return (
      <div className="text-center">
        {/* "Según tus respuestas" en vez de "Tu lugar ideal es": el quiz
            de Células remataba con la misma fórmula ("Tu ___ ideal es") y
            los dos modales se leían como el mismo widget con la palabra
            cambiada. Además nombra de dónde sale el resultado. */}
        <p className="text-13 font-semibold text-bg/50 mb-2">Según tus respuestas</p>
        <h3 className="text-24 font-bold text-bg tracking-tight mb-4">{result ? result.title : 'Cualquier departamento'}</h3>
        <p className="text-14 text-bg/65 leading-relaxed mb-6">{result ? result.why : NO_PREFERENCE_WHY}</p>
        <div className="flex flex-col gap-2.5">
          <motion.button {...PRESS_PRIMARY} onClick={() => onApply(result?.value || '')} className={btnPrimary}>
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
      <p className="text-13 font-semibold text-bg/50 mb-2">Pregunta {step + 1} de {QUIZ_QUESTIONS.length}</p>
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
  const [cardStart, setCardStart] = useState(0);
  const [panelTab, setPanelTab] = useState('gallery');
  const [selectedArea, setSelectedArea] = useState(null);
  const pageSize = useSyncExternalStore(subscribeCardLayout, desktopCards, mobileCards) ? 2 : 1;

  // Departamentos reales desde /volunteer-areas (admin-editable), con
  // fallback local si la API aun no responde. Una sola llamada a
  // /site-photos, la resolucion de foto por departamento es JS plano (no
  // un hook por item) -- 10 useSitePhoto en un .map violaria las reglas
  // de hooks.
  const liveAreas = useVolunteerAreas();
  const sitePhotos = useApi('/site-photos') || {};
  const sectionPhoto = sitePhotos.voluntariado_seccion || VOLUNTEER_BACKGROUND_FALLBACK;
  const areas = liveAreas.map(a => ({ ...a, photo: sitePhotos[`voluntariado_${a.value}`] || sectionPhoto }));

  // Departamentos que el admin agregue y no encajen en ninguna de las 5
  // categorias curadas (values fijos abajo) igual deben aparecer en
  // algun lado -- "Otros" los recoge en vez de desaparecer en silencio.
  const categorized = new Set(CATEGORIES.flatMap(c => c.values));
  const leftover = areas.filter(a => !categorized.has(a.value));
  const categoriesWithLeftover = leftover.length > 0
    ? [...CATEGORIES, { name: 'Otros', values: leftover.map(a => a.value) }]
    : CATEGORIES;

  const groups = categoriesWithLeftover.map(category => ({
    key: category.name,
    title: category.name,
    areas: areas.filter(area => category.values.includes(area.value)),
  })).filter(group => group.areas.length > 0);
  const start = Math.min(cardStart, Math.max(0, groups.length - 1));
  const visibleGroups = groups.slice(start, start + pageSize);
  const end = Math.min(start + pageSize, groups.length);
  const areaOf = group => group.areas.find(area => area.value === selectedArea) || group.areas[0];
  const photosOf = area => [...new Set([area.photo, sitePhotos[`voluntariado_${area.value}_2`]].filter(Boolean))];
  const windowItems = groups.map(group => {
    const area = areaOf(group);
    const photo = panelTab === 'gallery' ? sectionPhoto : area.photo;
    return { ...group, image: photo, images: panelTab === 'photos' ? photosOf(area) : [photo] };
  });
  const openGroup = key => {
    setPanelTab('gallery');
    setSelectedArea(null);
    setOpenKey(key);
  };
  const openAreaDetail = value => {
    const group = groups.find(item => item.areas.some(area => area.value === value));
    if (!group) return;
    setSelectedArea(value);
    setPanelTab('info');
    setOpenKey(group.key);
  };

  const openForm = (value = '') => {
    setOpenKey(null);
    setFormDept(value);
  };

  return (
    <main className="min-h-screen text-white">
      {/* Una sola apertura. Antes el hero decía "Únete a los más de 90
          voluntarios que ya sirven en 10 departamentos" y treinta líneas
          después un h2 "¿Dónde quieres servir?" volvía a abrir la página
          con su propia bajada y sus propios botones: dos titulares
          diciendo lo mismo antes de que se viera un solo departamento, y
          las mismas dos cifras repetidas 200px más abajo en el trío de
          fichas. La bajada ya no cuenta a nadie -- dice para qué sirve
          esto -- y el CTA vive donde vive el de Células, como children
          del hero. */}
      <PageHero
        title="Voluntariado"
        subtitle="Cada persona tiene algo que aportar. Aquí encuentras el departamento donde lo que sabes hacer sirve a los demás."
        photoSlot="hero_voluntariado"
        photoFallback="/images/backgrounds/comunidad-templo.webp"
      >
        {/* "Dos preguntas y te decimos dónde": son exactamente dos (ver
            QUIZ_QUESTIONS). Antes decía "Descubre tu lugar ideal" y
            Células decía "Descubre tu célula ideal" -- dos botones
            blancos con la misma frase y una palabra cambiada, que es la
            firma de un widget parametrizado. */}
        <motion.button
          {...PRESS_PRIMARY}
          type="button"
          onClick={() => setQuizOpen(true)}
          className="inline-flex items-center gap-2 rounded-pill bg-white text-bg px-5 py-3 text-14 font-bold shadow-card hover:opacity-90"
        >
          Dos preguntas y te decimos dónde
        </motion.button>
        <button
          type="button"
          onClick={() => openForm('')}
          className="text-14 font-semibold text-white/60 hover:text-white transition-colors underline underline-offset-4 decoration-white/25"
        >
          O aplica sin preferencia
        </button>
      </PageHero>

      <section className="relative min-h-[88svh] py-16 md:py-20 overflow-clip" aria-labelledby="volunteer-classifications">
        <SectionBg src={sectionPhoto} opacity="opacity-70" viewport />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="mb-9 max-w-2xl">
            <h2 id="volunteer-classifications" className="text-d2 text-white">¿Dónde quieres servir?</h2>
            <p className="mt-4 text-16 text-white/80">Elige un área para explorar sus departamentos.</p>
          </div>
          <motion.ul
            id="volunteer-classification-cards"
            key={`${start}-${pageSize}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}
            className="grid md:grid-cols-2 gap-5"
            aria-label="Clasificaciones de voluntariado"
          >
            {visibleGroups.map(group => <li key={group.key}>
              <ClassificationCard title={group.title} count={group.areas.length} onClick={() => openGroup(group.key)} />
            </li>)}
          </motion.ul>
          {groups.length > pageSize && <nav className="mt-7 flex items-center justify-between gap-3" aria-label="Navegar clasificaciones">
            <button type="button" disabled={start === 0} aria-controls="volunteer-classification-cards" onClick={() => setCardStart(Math.max(0, start - pageSize))} className="min-h-11 px-2 rounded-[8px] text-14 font-semibold text-white disabled:opacity-35 focus-ring">Anterior</button>
            <p role="status" className="text-12 text-white/75">{start + 1}{end > start + 1 ? `–${end}` : ''} de {groups.length}</p>
            <button type="button" disabled={end >= groups.length} aria-controls="volunteer-classification-cards" onClick={() => setCardStart(start + pageSize)} className="min-h-11 px-2 rounded-[8px] text-14 font-semibold text-white disabled:opacity-35 focus-ring">Siguiente</button>
          </nav>}
        </div>
      </section>

      <WindowStack
        items={windowItems}
        openKey={openKey}
        onChange={key => key ? openGroup(key) : setOpenKey(null)}
        height="auto"
        light
        photoBackdrop
        renderContent={group => {
          const area = areaOf(group);
          return (
            <div className="text-bg">
              <div role="tablist" aria-label="Apartados de la clasificación" className="flex gap-1 border-b border-bg/15 mb-6">
                {PANEL_TABS.map((tab, index) => <button
                  key={tab.value}
                  id={`volunteer-tab-${tab.value}`}
                  type="button" role="tab" aria-selected={panelTab === tab.value}
                  aria-controls="volunteer-category-panel" tabIndex={panelTab === tab.value ? 0 : -1}
                  onClick={() => setPanelTab(tab.value)}
                  onKeyDown={event => {
                    let target;
                    if (event.key === 'ArrowRight') target = (index + 1) % PANEL_TABS.length;
                    if (event.key === 'ArrowLeft') target = (index - 1 + PANEL_TABS.length) % PANEL_TABS.length;
                    if (event.key === 'Home') target = 0;
                    if (event.key === 'End') target = PANEL_TABS.length - 1;
                    if (target !== undefined) {
                      event.preventDefault(); event.stopPropagation();
                      setPanelTab(PANEL_TABS[target].value);
                      document.getElementById(`volunteer-tab-${PANEL_TABS[target].value}`)?.focus();
                    }
                  }}
                  className={`min-h-11 px-3 rounded-t-[8px] text-13 font-semibold focus-ring border-b-2 ${panelTab === tab.value ? 'border-bg text-bg' : 'border-transparent text-bg/60 hover:text-bg'}`}
                >{tab.label}</button>)}
              </div>
              <div id="volunteer-category-panel" role="tabpanel" aria-labelledby={`volunteer-tab-${panelTab}`} tabIndex={0} className="focus-ring rounded-[8px]">
                {panelTab === 'gallery' && <ul className="divide-y divide-bg/15">
                  {group.areas.map(collection => <li key={collection.value}>
                    <button type="button" onClick={() => { setSelectedArea(collection.value); setPanelTab('photos'); document.getElementById('volunteer-tab-photos')?.focus(); }} className="w-full flex items-center justify-between gap-4 py-4 px-1 text-left focus-ring rounded-[8px]">
                      <span className="text-16 font-bold">{collection.title}</span>
                      <span className="text-12 text-bg/65 shrink-0">Ver fotos</span>
                    </button>
                  </li>)}
                </ul>}
                {panelTab === 'photos' && <div className="space-y-5">
                  <h3 className="text-20 font-bold">{area.title}</h3>
                  <p className="text-14 text-bg/75">{photosOf(area).length} {photosOf(area).length === 1 ? 'fotografía' : 'fotografías'}</p>
                  <button type="button" onClick={() => { setPanelTab('info'); document.getElementById('volunteer-tab-info')?.focus(); }} className="min-h-11 text-14 font-semibold underline underline-offset-4 focus-ring rounded-[8px]">Conocer {area.title}</button>
                </div>}
                {panelTab === 'info' && <div className="space-y-5">
                  <h3 className="text-20 font-bold">{area.title}</h3>
                  <p className="text-16 leading-relaxed text-bg/85">{area.desc}</p>
                  {area.why && <div className="border-t border-bg/10 pt-5">
                    <h4 className="text-14 font-bold mb-2">¿Por qué aquí?</h4>
                    <p className="text-15 leading-relaxed text-bg/80">{area.why}</p>
                  </div>}
                  {area.testimonial && <blockquote className="border-l border-bg/20 pl-4">
                    <p className="text-14 italic leading-relaxed text-bg/75">“{area.testimonial}”</p>
                    {area.testimonialAuthor && <footer className="text-12 text-bg/60 mt-2">{area.testimonialAuthor}</footer>}
                  </blockquote>}
                  <motion.button {...PRESS_PRIMARY} type="button" onClick={() => openForm(area.value)} className={btnPrimary}>Aplicar a {area.title}</motion.button>
                </div>}
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
              onViewDetail={(value) => { setQuizOpen(false); openAreaDetail(value); }}
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

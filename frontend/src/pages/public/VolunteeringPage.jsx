import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import Reveal from '../../components/ui/Reveal';
import StatTrio from '../../components/ui/StatTrio';
import Tilt from '../../components/ui/Tilt';
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
const INTEREST_TAGS = [
  { key: 'musica', label: 'Música y arte' },
  { key: 'personas', label: 'Atender personas' },
  { key: 'ninos', label: 'Niños' },
  { key: 'tecnologia', label: 'Tecnología' },
  { key: 'oracion', label: 'Oración' },
  { key: 'organizacion', label: 'Organización' },
];

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
const GLOW = '#E8823C';

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
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
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
    </>
  );
}

// Foto a toda vista (sin degradado ni ícono encima) + un chip flotante
// "glass-light" (blanco escarchado, texto navy -- lo pidió el usuario en
// vez del degradado navy que traía) con el título/descripción, igual
// tratamiento que usan los modales claros del sitio. Proporción fija
// (aspect-[4/5]) en vez del alto suelto que pedía el masonry: todas las
// tarjetas de una familia miden lo mismo, que es lo que hace que 2 o 3
// tarjetas se lean como una fila y no como un rompecabezas a medio
// armar.
// Tilt (NO rotación estática): se probó el collage con spans/rotate FIJOS
// y el usuario lo rechazó por verse "torcido". Tilt es distinto -- la
// card queda perfectamente recta en reposo, solo se inclina en 3D
// siguiendo al cursor/scroll (vuelve a plano al soltar). Es la misma
// reactividad de cristal que Home/Células/Galería, sin reintroducir el
// ángulo fijo que se pidió quitar.
function DepartmentCard({ title, desc, photo, onClick }) {
  return (
    <Tilt
      as="button"
      type="button"
      onClick={onClick}
      max={6}
      glass
      hoverScale={1.02}
      className="group relative block w-full aspect-[4/5] overflow-hidden rounded-[22px] text-left focus-ring"
    >
      <img
        src={photo}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-x-3 bottom-3 glass-light rounded-[16px] px-4 py-3">
        <h3 className="text-15 font-bold text-bg tracking-tight leading-tight">{title}</h3>
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
                {r.photo && (
                  <img src={r.photo} alt="" className="w-14 h-14 rounded-[12px] object-cover shrink-0" />
                )}
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
        {result?.photo && (
          <div className="w-full h-36 rounded-[16px] overflow-hidden mb-4">
            <img src={result.photo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
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
  const [activeTag, setActiveTag] = useState(null);   // chip de interés activo (filtra el grid) o null
  const [hoverCategory, setHoverCategory] = useState(null); // categoría bajo el cursor -- colorea el halo ambiental
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

  // Índice global (no por categoría) para escalonar la entrada de las
  // tarjetas a lo largo de toda la página, en vez de reiniciar el
  // retardo en cada familia (donde 1-3 items casi nunca alcanzan a
  // mostrar la variedad). Ya no decide tamaños -- todas las tarjetas
  // miden lo mismo desde que el masonry se fue.
  const globalIndex = Object.fromEntries(areas.map((a, i) => [a.value, i]));

  // Única cifra que esta página puede sostener con un dato real: se
  // CUENTA sobre las áreas ya resueltas desde /volunteer-areas, así que
  // sigue al admin en vez de quedarse congelada. Mismo criterio que
  // CelulasPage.
  const stats = [
    { n: String(areas.length), label: areas.length === 1 ? 'Departamento' : 'Departamentos' },
  ];
  // A qué categoría pertenece cada departamento -- se usa también en el
  // chip de la ventana de detalle.
  const categoryOf = value => categoriesWithLeftover.find(c => c.values.includes(value))?.name;

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
        photoFallback="/images/components/voluntariado_general.jpg"
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

      {/* Sin foto de fondo: aquí vivía un ParallaxImg al 40% con un
          degradado navy encima, o sea una foto de la iglesia entregada al
          ~18% de su color, puesta DETRÁS de un collage que ya es puras
          fotos a color pleno. Dos capas de foto compitiendo, y la de
          abajo perdiendo. El canvas navy deja que el collage sea la
          imagen de la sección. */}
      <section className="relative py-4 pb-24 overflow-hidden">
        <SectionBg src="/images/components/voluntariado_general.jpg" />
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
            background: `radial-gradient(680px circle at 50% 20%, ${GLOW}33, transparent 70%)`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Sin Reveal: el titular de sección es el punto FIJO contra el
              que llega el contenido de abajo. Si él también se desliza al
              entrar, no hay nada quieto en la pantalla y el scroll se
              siente gelatinoso. Las cards del collage siguen entrando --
              ahora llegan bajo un título que ya estaba ahí. */}
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-d2 text-white">
              ¿Dónde quieres servir?
            </h2>
            {/* Sin botones aquí: los dos CTA (el quiz y "aplica sin
                preferencia") ya viven en el hero, que es lo que decidió el
                cambio de arriba. Repetirlos 300px más abajo, con el mismo
                texto y el mismo estilo, era justo la duplicación que se
                estaba quitando. */}
            <p className="mt-4 text-16 text-white/70">Toca un departamento para conocerlo mejor.</p>
          </div>

          <StatTrio stats={stats} className="mx-auto mb-14" />

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

          <motion.div layout className="space-y-10">
            <AnimatePresence mode="popLayout">
            {categoriesWithLeftover.map(cat => {
              // Filtra por el eje `interes` únicamente: 'frente'/'apoyo'
              // son visibilidad y no existen como chip, así que mirar el
              // mapa completo aquí nunca podría acertar y sí podría
              // colar un falso positivo el día que un chip se llame
              // igual que una visibilidad.
              const catAreas = areas.filter(a => cat.values.includes(a.value) && (!activeTag || matchOf(a.value).interes.includes(activeTag)));
              if (catAreas.length === 0) return null;
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                  key={cat.name} 
                  onMouseEnter={() => setHoverCategory(cat.name)} 
                  onMouseLeave={() => setHoverCategory(null)}
                >
                  <p className="text-13 font-semibold text-white/60 mb-4">{cat.name}</p>
                  <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    <AnimatePresence mode="popLayout">
                    {catAreas.map(area => {
                      return (
                        <motion.div
                          layout
                          key={area.value}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                        >
                          <DepartmentCard {...area} onClick={() => setOpenKey(area.value)} />
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
            </AnimatePresence>
            {activeTag && !areas.some(a => matchOf(a.value).interes.includes(activeTag)) && (
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
          const itemVariants = {
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }
          };

          return (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: { staggerChildren: 0.08 }
                }
              }}
              className="grid sm:grid-cols-5 gap-6"
            >
              <div className="sm:col-span-3 flex flex-col gap-5">
                {category && (
                  <motion.span variants={itemVariants} className="self-start inline-flex items-center bg-bg/5 border border-bg/10 text-bg/65 px-3.5 py-1.5 rounded-full text-12 font-bold tracking-wide uppercase">
                    {category}
                  </motion.span>
                )}
                {/* Texto más vivo, tamaño base mayor, primera frase sutilmente destacada */}
                <motion.p variants={itemVariants} className="text-bg/80 text-16 sm:text-17 leading-relaxed font-medium">
                  {a.desc}
                </motion.p>
                
                <motion.div variants={itemVariants} className="mt-auto pt-6">
                  <motion.button
                    {...PRESS_PRIMARY}
                    onClick={() => openForm(a.value)}
                    className="w-full inline-flex items-center justify-center rounded-pill bg-bg text-white px-6 py-4.5 text-15 font-bold shadow-card hover:opacity-90"
                  >
                    Aplicar a {a.title}
                  </motion.button>
                </motion.div>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-4">
                {/* Bento box typography sin íconos, solo jerarquía pura */}
                <motion.div variants={itemVariants} className="glass-light-nested rounded-[20px] p-6 h-fit border-t border-white/40 shadow-sm">
                  <p className="text-12 font-bold text-bg/50 uppercase tracking-widest mb-3">¿Por qué aquí?</p>
                  <p className="text-bg/85 text-15 leading-relaxed font-medium">{a.why}</p>
                </motion.div>
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

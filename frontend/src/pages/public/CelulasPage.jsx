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
import { Dock, DockItem } from '../../components/ui/Dock';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

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

// NOTA (ago-2026): aquí vivía waHrefFor, que armaba el enlace de WhatsApp
// al líder de cada célula. Se fue entero junto con el fetch de /leaders y
// el mapa leaderByName: ninguno de los 16 líderes está en ese directorio,
// así que los 16 enlaces abrían WhatsApp con un selector de contactos
// VACÍO. Y aun con los teléfonos cargados el modelo era malo -- el
// intento moría en el chat de una persona y la iglesia nunca se enteraba
// de que alguien quiso entrar. Ahora la fila abre CellJoinForm, que
// registra la solicitud y la deja en el panel del líder y del admin.

// Una fila de célula, compartida por la ventana (tono oscuro sobre
// .liquid-glass) y el resultado del quiz (tono claro sobre ModalWrapper).
//
// Es un BOTÓN que abre la FICHA de la célula en la capa sobrepuesta
// (ago-2026) -- antes abría el formulario directo. Antes de eso era un
// enlace a WhatsApp construido con el teléfono del líder, y eso tenía dos
// problemas: el directorio de líderes está vacío, así que los 16 enlaces
// abrían WhatsApp sin destinatario; y aunque hubiera teléfonos, la
// iglesia nunca se enteraba de que alguien había querido entrar -- el
// intento se perdía en el chat de una persona. Ahora la solicitud queda
// registrada y aterriza en el panel del líder de ESA célula.
function CellRow({ cell, onSolicitar, index = 0, tone = 'dark' }) {
  const dark = tone === 'dark';
  const cuando = [cell.day, cell.time].filter(Boolean).join(' · ');

  return (
    <motion.button
      type="button"
      onClick={() => onSolicitar(cell)}
      aria-label={`Ver la célula ${cell.name}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.03 }}
      // .glass-light-nested y no un tinte plano: es la segunda capa del
      // sistema (ver index.css), con su propio bisel y su hairline. Una
      // lista de filas del MISMO material que la ventana no se lee como
      // filas, se lee como una sola lámina con texto encima -- que es
      // justo lo que hacía que la ventana se sintiera plana.
      className={`group w-full text-left rounded-[16px] p-4 flex items-center gap-4 transition-colors focus-ring ${
        dark ? 'bg-white/5 hover:bg-white/10' : 'glass-light-nested'
      }`}
    >
      {/* La inicial de la célula en su propio cuadro. No es un ícono ni un
          avatar de relleno: es la primera letra de su nombre, que es dato
          real y distinto en cada fila. Da un ancla a la izquierda y rompe
          la lista de puro texto que se leía como hoja de cálculo. */}
      <span
        className={`shrink-0 w-11 h-11 rounded-[12px] grid place-items-center text-17 font-bold ${
          dark ? 'bg-white/10 text-white/80' : 'bg-bg/8 text-bg/70'
        }`}
        aria-hidden="true"
      >
        {(cell.name || '?').trim()[0].toUpperCase()}
      </span>

      {/* Dos líneas, cada una con un ancla a la izquierda y otra a la
          derecha. Antes todo se apelotonaba a la izquierda y "Unirme"
          quedaba solo contra el borde derecho, a 400px del nombre: la fila
          medía 730px y usaba 300. Con `justify-between` el nombre se
          empareja con su líder y los chips con la afordancia, y la fila
          ocupa el ancho que tiene. En pantalla angosta el `flex-wrap` deja
          caer el líder a su propio renglón. */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <p className={`text-17 font-bold leading-tight truncate ${dark ? 'text-white' : 'text-bg'}`}>
            {cell.name}
          </p>
          {cell.leader && (
            <p className={`text-13 font-medium truncate ${dark ? 'text-white/55' : 'text-bg/55'}`}>
              {cell.leader}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 mt-2">
          {/* Los metadatos como chips y no como texto corrido: la zona
              decide si alguien puede llegar, y en una línea gris pegada al
              nombre del líder se perdía. */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {cell.zone && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-11 font-semibold ${
                dark ? 'bg-white/10 text-white/75' : 'bg-bg/8 text-bg/65'
              }`}>
                {cell.zone}
              </span>
            )}
            {/* CUÁNDO es la pregunta que decide si alguien puede ir, y
                hasta ago-2026 el sitio no la contestaba en ningún lado.
                Va en el acento del sitio -- es lo único de la fila que se
                gana el color. Si el líder no lo cargó, no se finge nada:
                el chip sencillamente no existe. */}
            {cuando && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-11 font-bold bg-acento/15 text-acento-hov">
                {cuando}
              </span>
            )}
          </div>

          <span className={`shrink-0 text-13 font-bold transition-colors ${
            dark ? 'text-white/45 group-hover:text-white' : 'text-bg/45 group-hover:text-bg'
          }`}>
            Ver
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// Solicitud de ingreso a UNA célula concreta. Vive DENTRO de la ventana
// que ya está abierta (o del modal del quiz), como un paso más: abrir un
// segundo modal encima del primero sería una trampa de foco y de scroll.
//
// Manda al MISMO endpoint público que /conectate (POST /connect-cards),
// con category 'busco_celula' y el cell_id. El backend valida la célula y
// auto-asigna la tarjeta al líder de esa célula, así que entra directo en
// su panel y en el del admin, sin que nadie la reparta a mano.
function CellJoinForm({ cell: cellInicial, cells = [], onBack, tone = 'dark' }) {
  const dark = tone === 'dark';
  const [cell, setCell] = useState(cellInicial);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  // Cambiar de célula es una acción EXPLÍCITA, igual que en Voluntariado:
  // se abre el selector, se elige, y recién ahí se confirma. Cerrarlo sin
  // confirmar deja la célula original intacta. La persona ya eligió una al
  // tocar su fila; que un desliz del mouse sobre un dropdown se la cambie
  // sin avisar sería peor que no dejarla cambiar.
  const [cambiando, setCambiando] = useState(false);
  const [pendiente, setPendiente] = useState('');
  // Enviar tampoco dispara el POST directo: primero muestra a QUIÉN le va
  // a llegar. Ese es el dato que importa aquí -- cada célula tiene su
  // propio líder y es él quien va a recibir la solicitud.
  const [confirmando, setConfirmando] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const otras = cells.filter(c => c.id !== cell.id);

  const revisar = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Necesitamos tu nombre y un teléfono para contactarte.');
      return;
    }
    setConfirmando(true);
  };

  const enviar = async () => {
    setEnviando(true);
    try {
      await apiClient.post('/connect-cards', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        category: 'busco_celula',
        cell_id: cell.id,
      });
      setListo(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar. Inténtalo de nuevo.');
      setConfirmando(false);
    } finally {
      setEnviando(false);
    }
  };

  const titulo = dark ? 'text-white' : 'text-bg';
  const suave = dark ? 'text-white/55' : 'text-bg/55';
  const tenue = dark ? 'text-white/70' : 'text-bg/70';
  const campo = `w-full rounded-[12px] px-4 py-3 text-15 outline-none transition-colors ${
    dark
      ? 'bg-white/8 border border-white/15 text-white placeholder:text-white/30 focus:border-white/35'
      : 'bg-bg/5 border border-bg/12 text-bg placeholder:text-bg/30 focus:border-bg/30'
  }`;
  const btnPpal = `w-full inline-flex items-center justify-center rounded-pill px-6 py-3.5 text-15 font-bold focus-ring disabled:opacity-50 ${
    dark ? 'bg-white text-bg' : 'bg-bg text-white'
  }`;
  const btnSec = `w-full inline-flex items-center justify-center rounded-pill px-6 py-3 text-14 font-semibold transition-colors ${
    dark ? 'text-white/55 hover:text-white hover:bg-white/5' : 'text-bg/55 hover:text-bg hover:bg-bg/5'
  }`;

  if (listo) {
    return (
      <div className="text-center py-6">
        <h3 className={`text-22 font-bold mb-2 ${titulo}`}>Solicitud enviada</h3>
        <p className={`text-15 leading-relaxed ${tenue}`}>
          {cell.leader
            ? `Le avisamos a ${cell.leader.split(' ')[0]}, que lidera ${cell.name}. Te contactan pronto.`
            : `Le avisamos al equipo de ${cell.name}. Te contactan pronto.`}
        </p>
        <button type="button" onClick={onBack} className={`${btnSec} mt-5`}>Listo</button>
      </div>
    );
  }

  // ── Confirmar: con el líder que la va a recibir a la vista ──────────
  if (confirmando) {
    return (
      <div className="text-left">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className={`text-13 font-semibold mb-4 underline underline-offset-4 ${suave} ${dark ? 'decoration-white/25 hover:text-white' : 'decoration-bg/25 hover:text-bg'}`}
        >
          Atrás
        </button>
        <p className={`text-13 font-semibold mb-1 ${suave}`}>Confirmar solicitud</p>
        <h3 className={`text-21 font-bold tracking-tight mb-4 ${titulo}`}>{cell.name}</h3>

        <div className={`rounded-[16px] p-5 mb-6 ${dark ? 'bg-white/6 border border-white/10' : 'glass-light-nested'}`}>
          <p className={`text-13 font-semibold mb-2 ${suave}`}>¿Quién te va a contactar?</p>
          <p className={`text-15 leading-relaxed ${tenue}`}>
            {cell.leader
              ? `${cell.leader}, que lidera esta célula.`
              : 'El equipo de la iglesia, que te pondrá en contacto con el líder.'}
            {cell.zone ? ` Se reúnen en ${cell.zone}.` : ''}
          </p>
          {(cell.day || cell.time) && (
            <p className={`text-15 font-semibold mt-2 ${tenue}`}>
              Se reúnen {[cell.day, cell.time].filter(Boolean).join(' a las ')}.
            </p>
          )}
          {cell.what_to_expect && (
            <p className={`text-14 leading-relaxed mt-3 ${dark ? 'text-white/55' : 'text-bg/60'}`}>
              {cell.what_to_expect}
            </p>
          )}
          {cell.description && (
            <p className={`text-14 leading-relaxed mt-2 ${dark ? 'text-white/50' : 'text-bg/55'}`}>{cell.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <motion.button {...PRESS_PRIMARY} type="button" onClick={enviar} disabled={enviando} className={btnPpal}>
            {enviando ? 'Enviando…' : 'Confirmar solicitud'}
          </motion.button>
          <button type="button" onClick={() => setConfirmando(false)} disabled={enviando} className={btnSec}>
            Volver a editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={revisar} className="text-left">
      <button
        type="button"
        onClick={onBack}
        // Mismo pill que la salida de la ficha: es la misma acción (bajar
        // un nivel de capa) y tiene que verse igual en las dos. Subrayado
        // y al 55% de tinta se perdía contra el cristal.
        className={`inline-flex items-center rounded-pill px-3.5 py-1.5 text-12 font-bold transition-colors focus-ring mb-5 ${
          dark ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white' : 'bg-bg/8 hover:bg-bg/14 text-bg/70 hover:text-bg'
        }`}
      >
        Volver a la lista
      </button>

      <p className={`text-13 font-semibold ${suave}`}>Quiero unirme a</p>
      <h3 className={`text-20 font-bold leading-tight mb-5 ${titulo}`}>{cell.name}</h3>

      <div className="space-y-4">
        <label className="block">
          <span className={`block text-13 font-semibold mb-2 ${suave}`}>Tu nombre <span className="text-rose">*</span></span>
          <input className={campo} value={form.name} onChange={set('name')} required />
        </label>
        <label className="block">
          <span className={`block text-13 font-semibold mb-2 ${suave}`}>Teléfono o WhatsApp <span className="text-rose">*</span></span>
          <input className={campo} type="tel" value={form.phone} onChange={set('phone')} required />
        </label>
        <label className="block">
          <span className={`block text-13 font-semibold mb-2 ${suave}`}>Correo (opcional)</span>
          <input className={campo} type="email" value={form.email} onChange={set('email')} />
        </label>
        <label className="block">
          <span className={`block text-13 font-semibold mb-2 ${suave}`}>Cuéntanos algo de ti (opcional)</span>
          <textarea
            className={`${campo} resize-none`}
            rows={3}
            value={form.message}
            onChange={set('message')}
            placeholder="Tu edad, en qué horarios puedes, lo que quieras que sepan…"
          />
        </label>

        {/* La célula elegida se muestra como DATO con un "Cambiar"
            explícito, no como un select abierto -- mismo patrón que el
            departamento en Voluntariado. */}
        {!cambiando ? (
          otras.length > 0 && (
            <div className={`rounded-[14px] px-4 py-3.5 flex items-center justify-between gap-3 ${dark ? 'border border-white/12 bg-white/5' : 'border border-bg/12 bg-bg/5'}`}>
              <div className="min-w-0">
                <p className={`text-13 font-semibold mb-1 ${suave}`}>Célula</p>
                <p className={`text-15 font-bold truncate ${titulo}`}>{cell.name}</p>
              </div>
              <button
                type="button"
                onClick={() => { setPendiente(String(cell.id)); setCambiando(true); }}
                className={`shrink-0 text-13 font-semibold underline underline-offset-4 ${suave} ${dark ? 'decoration-white/25 hover:text-white' : 'decoration-bg/25 hover:text-bg'}`}
              >
                Cambiar
              </button>
            </div>
          )
        ) : (
          <div className={`rounded-[14px] p-4 space-y-3 ${dark ? 'border border-white/12 bg-white/5' : 'border border-bg/12 bg-bg/5'}`}>
            <p className={`text-13 font-semibold ${suave}`}>¿Cambiar tu elección ({cell.name})?</p>
            <select
              className={`${campo} appearance-none cursor-pointer`}
              value={pendiente}
              onChange={e => setPendiente(e.target.value)}
            >
              {cells.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.zone ? ` — ${c.zone}` : ''}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const elegida = cells.find(c => String(c.id) === pendiente);
                  if (elegida) setCell(elegida);
                  setCambiando(false);
                }}
                className={`flex-1 rounded-pill px-4 py-2.5 text-13 font-bold ${dark ? 'bg-white text-bg' : 'bg-bg text-white'}`}
              >
                Confirmar cambio
              </button>
              <button type="button" onClick={() => setCambiando(false)} className={`flex-1 rounded-pill px-4 py-2.5 text-13 font-semibold ${suave}`}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <motion.button {...PRESS_PRIMARY} type="submit" className={`${btnPpal} mt-5`}>
        Continuar
      </motion.button>

      <p className={`text-12 mt-3 leading-relaxed ${dark ? 'text-white/40' : 'text-bg/45'}`}>
        Tus datos llegan al líder de la célula y al equipo de la iglesia. No se publican en ningún lado.
      </p>
    </form>
  );
}


// Ficha de UNA célula, en la capa que se pone encima de la ventana de su
// categoría. Reúne todo lo que el líder y el admin pueden editar desde
// sus paneles: día, hora, zona, descripción y qué esperar en una reunión.
//
// Cada dato se pinta SOLO si existe. Con "nada estático" como regla del
// proyecto, un renglón que dijera "Horario: por confirmar" sería una
// promesa que nadie hizo -- mejor que la ficha sea corta y cierta.
function CellDetailCard({ cell, onUnirme, onCerrar }) {
  const datos = [
    (cell.day || cell.time) && { k: 'Se reúnen', v: [cell.day, cell.time].filter(Boolean).join(' · ') },
    cell.zone && { k: 'Dónde', v: cell.zone },
    cell.leader && { k: 'Líder', v: cell.leader },
  ].filter(Boolean);

  return (
    <div className="text-left">
      {/* Botón con superficie propia, no un enlace subrayado suelto: es
          la salida de una CAPA, así que tiene que leerse tan sólido como
          la capa. Subrayado y al 55% de tinta se perdía contra el cristal
          y parecía una nota al pie. */}
      <button
        type="button"
        onClick={onCerrar}
        className="inline-flex items-center rounded-pill bg-bg/8 hover:bg-bg/14 text-bg/70 hover:text-bg px-3.5 py-1.5 text-12 font-bold transition-colors focus-ring mb-5"
      >
        Volver a la lista
      </button>

      {/* Mismo ancla visual que la fila de la lista: la inicial en su
          cuadro. Al abrirse la ficha, ese cuadro es lo que dice "sigues en
          la misma célula que tocaste" -- sin él la capa nueva empezaba en
          un título flotando sobre cristal vacío. */}
      <div className="flex items-center gap-4">
        <span
          className="shrink-0 w-14 h-14 rounded-[16px] grid place-items-center text-24 font-bold bg-bg/10 text-bg/75"
          aria-hidden="true"
        >
          {(cell.name || '?').trim()[0].toUpperCase()}
        </span>
        <h3 className="text-d3 text-bg min-w-0 break-words">{cell.name}</h3>
      </div>

      {datos.length > 0 && (
        <dl className="mt-5 divide-y divide-bg/10">
          {datos.map(d => (
            <div key={d.k} className="flex items-baseline justify-between gap-6 py-3">
              <dt className="text-13 font-semibold text-bg/55 shrink-0">{d.k}</dt>
              <dd className="text-15 font-bold text-bg text-right">{d.v}</dd>
            </div>
          ))}
        </dl>
      )}

      {cell.description && (
        <p className="text-15 text-bg/70 leading-relaxed mt-5">{cell.description}</p>
      )}

      {cell.what_to_expect && (
        <div className="glass-light-nested rounded-[16px] p-5 mt-5">
          <p className="text-13 font-semibold text-bg/55 mb-2">Qué esperar</p>
          <p className="text-15 text-bg/75 leading-relaxed">{cell.what_to_expect}</p>
        </div>
      )}

      {/* Si el líder todavía no llenó nada, la ficha quedaría en el
          nombre solo. Se dice qué falta en vez de fingir contenido, y el
          botón de abajo sigue siendo una salida real. */}
      {datos.length === 0 && !cell.description && !cell.what_to_expect && (
        <p className="text-15 text-bg/55 leading-relaxed mt-5">
          Esta célula todavía no publicó sus horarios. Déjanos tus datos y su
          líder te cuenta cuándo y dónde se reúnen.
        </p>
      )}

      {/* El CTA es lo más grande de la ficha, no un enlace más: es la
          única acción de toda la pantalla. */}
      <DockItem className="mt-7 block">
        <motion.button
          {...PRESS_PRIMARY}
          type="button"
          onClick={onUnirme}
          className="w-full inline-flex items-center justify-center rounded-pill bg-bg text-white px-6 py-4 text-16 font-bold focus-ring shadow-card hover:opacity-95"
        >
          Quiero unirme a {cell.name}
        </motion.button>
      </DockItem>
    </div>
  );
}

// Cuerpo de la ventana de una categoría -- componente propio (no una
// función inline en renderContent) para que el filtro de zona tenga su
// propio estado LOCAL: WindowStack solo monta este cuerpo mientras esa
// categoría está al frente, así que el filtro se resetea solo cada vez
// que se abre/reabre una ventana, sin lógica extra de reset.
function CellCategoryDetail({ group, onAbrirCelula }) {
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
        <p className="text-15 text-bg/70 leading-relaxed mb-5">{group.description}</p>
      )}

      <p className="text-13 font-semibold text-bg/55 mb-4">
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
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-12 font-semibold transition-colors ${!zoneFilter ? 'bg-bg text-white' : 'bg-bg/6 text-bg/60 hover:bg-bg/12 hover:text-bg'}`}
          >
            Todas las zonas
          </button>
          {zones.map(z => (
            <button
              key={z}
              type="button"
              onClick={() => setZoneFilter(cur => cur === z ? null : z)}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-12 font-semibold transition-colors ${zoneFilter === z ? 'bg-bg text-white' : 'bg-bg/6 text-bg/60 hover:bg-bg/12 hover:text-bg'}`}
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
          grande para el nombre, un separador fino entre filas. Cada fila
          abre la solicitud de ingreso a ESA célula. */}
      <Dock className="flex flex-col gap-2">
        {filtered.map((c, i) => (
          <DockItem key={`${c.name}-${i}`}>
            <CellRow cell={c} onSolicitar={onAbrirCelula} index={i} tone="light" />
          </DockItem>
        ))}
      </Dock>

      {/* Salida para quien no se decide por una célula concreta: el
          formulario general del sitio, que cae en la misma bandeja
          (/admin/connect-cards) pero sin célula asignada. */}
      <div className="mt-6 pt-5 border-t border-bg/10">
        <p className="text-13 text-bg/55 leading-relaxed mb-3">
          ¿No sabes cuál elegir? Déjanos tus datos y te ubicamos en la más cercana a ti.
        </p>
        <Link
          to="/conectate"
          className="inline-flex items-center justify-center rounded-pill bg-bg text-white px-5 py-3 text-14 font-bold focus-ring hover:opacity-90 transition-opacity"
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
function CellQuizModal({ groups, onViewDetail }) {
  // Mismo paso de solicitud que la ventana, en tono claro: el modal del
  // quiz es la superficie clara del sitio.
  const [solicitando, setSolicitando] = useState(null);
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

  // La solicitud gana a cualquier paso del quiz: es la acción final, y
  // volver la devuelve al resultado donde estaba.
  if (solicitando) {
    return <CellJoinForm cell={solicitando} cells={category?.cells || []} onBack={() => setSolicitando(null)} tone="light" />;
  }

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
              onSolicitar={setSolicitando}
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
  const [openKey, setOpenKey] = useState(null); // ventana abierta (o null)
  // Capa sobrepuesta: la ficha de UNA célula, encima de la ventana de su
  // categoría. `solicitando` la convierte en el formulario sin cerrarla,
  // así que el recorrido entero (categoría -> célula -> solicitud) ocurre
  // en capas que se van poniendo una sobre otra, sin perder de vista de
  // dónde vino cada una.
  const [celulaAbierta, setCelulaAbierta] = useState(null);
  const [solicitando, setSolicitando] = useState(false);
  const abrirCelula = (cell) => { setCelulaAbierta(cell); setSolicitando(false); };
  const cerrarCelula = () => { setCelulaAbierta(null); setSolicitando(false); };
  // Al cambiar de categoría la ficha deja de tener sentido: habla de una
  // célula que ya no está en la lista de abajo.
  useEffect(() => { cerrarCelula(); }, [openKey]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [hoverCategory, setHoverCategory] = useState(null); // key bajo el cursor -- colorea el halo ambiental


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
          {/* Dock: el collage es una fila de hermanos, que es exactamente
              para lo que existe la magnificación por proximidad -- la
              tarjeta bajo el cursor crece y sus vecinas la acompañan un
              poco, así que el grupo entero responde como una superficie. */}
          <Dock className="relative z-10 grid grid-cols-2 sm:grid-cols-3 auto-rows-[150px] sm:auto-rows-[165px] gap-x-5 gap-y-9">
            {groups.map((g, i) => {
              const c = COLLAGE[i % COLLAGE.length];
              const big = c.span.includes('row-span-2');
              return (
                // Wrapper solo para la ENTRADA en 3D (rotateX): Tilt ya es
                // dueño de rotateX/rotateY para el tilt de cursor/scroll, así
                // que la profundidad de aparición vive en un nodo aparte —
                // si compartieran la misma propiedad, una de las dos se
                // pisaría en silencio.
                <DockItem
                  key={g.key}
                  className={c.span}
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
                </DockItem>
              );
            })}
          </Dock>

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
      {/* light: cristal BLANCO. La ventana de una célula es una FICHA que
          se lee (día, hora, qué esperar, el directorio) y luego un
          formulario -- texto navy sobre blanco aguanta esa densidad mucho
          mejor que blanco sobre cristal oscuro, que es material de
          vitrina. Es la misma decisión que ya tomaba Voluntariado. */}
      <WindowStack
        light
        items={windowItems}
        openKey={openKey}
        onChange={setOpenKey}
        onCerrarSobrepuesto={cerrarCelula}
        sobrepuesto={celulaAbierta && (
          solicitando ? (
            <CellJoinForm
              cell={celulaAbierta}
              cells={groups.find(g => g.key === openKey)?.cells || []}
              onBack={() => setSolicitando(false)}
              tone="light"
            />
          ) : (
            <CellDetailCard
              cell={celulaAbierta}
              onUnirme={() => setSolicitando(true)}
              onCerrar={cerrarCelula}
            />
          )
        )}
        renderContent={(it) => {
          const g = groups.find(gr => gr.key === it.key);
          if (!g) return null;
          return <CellCategoryDetail group={g} onAbrirCelula={abrirCelula} />;
        }}
      />

      {/* Quiz/matchmaker -- alternativa a hojear las 5 categorías para
          quien no sabe cuál célula es la suya. */}
      <AnimatePresence>
        {quizOpen && (
          <ModalWrapper onClose={() => setQuizOpen(false)}>
            <CellQuizModal
              groups={groups}
              onViewDetail={(key) => { setQuizOpen(false); setOpenKey(key); }}
            />
          </ModalWrapper>
        )}
      </AnimatePresence>
    </main>
  );
}

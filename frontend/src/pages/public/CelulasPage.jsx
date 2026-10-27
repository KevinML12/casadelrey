// Directorio administrable; una escena por categoría, sin fotografías dentro del cristal.
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useSeo from '../../hooks/useSeo';
import PageHero from '../../components/layout/PageHero';
import SceneCarousel from '../../components/ui/SceneCarousel';
import CollectionStatus from '../../components/ui/CollectionStatus';
import PhotoTabs from '../../components/ui/PhotoTabs';
import WindowStack from '../../components/ui/WindowStack';
import ModalWrapper from '../../components/ui/ModalWrapper';
import { useApiResource } from '../../lib/feed';
import { PRESS_PRIMARY } from '../../lib/motion';
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
const DEFAULT_CATEGORY_IMAGE = '/images/backgrounds/congregacion.webp';

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
function CellJoinForm({ cell: cellInicial, cells = [], onBack, onChangeCategory, tone = 'dark' }) {
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
  const [, setPendiente] = useState('');
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
  const suave = dark ? 'text-white/60' : 'text-bg/60';
  const tenue = dark ? 'text-white/75' : 'text-bg/75';
  const campo = `w-full rounded-[14px] px-4 py-3.5 text-15 outline-none transition-all ${
    dark
      ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:bg-white/15 focus:ring-4 focus:ring-white/5'
      : 'bg-white border border-bg/15 text-bg placeholder:text-bg/40 focus:border-bg/40 focus:ring-4 focus:ring-bg/5 shadow-sm'
  }`;
  const btnPpal = `w-full inline-flex items-center justify-center rounded-pill px-6 py-4 text-15 font-bold focus-ring shadow-card disabled:opacity-50 transition-opacity ${
    dark ? 'bg-white text-bg' : 'bg-bg text-white hover:opacity-90'
  }`;
  const btnSec = `w-full inline-flex items-center justify-center rounded-pill px-6 py-3.5 text-14 font-semibold transition-colors ${
    dark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-bg/60 hover:text-bg hover:bg-bg/8'
  }`;

  if (listo) {
    return (
      <div className="text-center py-8">
        <h3 className={`text-24 font-bold mb-3 ${titulo}`}>¡Solicitud enviada!</h3>
        <p className={`text-16 leading-relaxed ${tenue}`}>
          {cell.leader
            ? `Le avisamos a ${cell.leader.split(' ')[0]}, que lidera ${cell.name}. Te contactará muy pronto.`
            : `Le avisamos al equipo de ${cell.name}. Te contactaremos muy pronto.`}
        </p>
        <button type="button" onClick={onBack} className={`${btnSec} mt-8`}>Terminar</button>
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
          className={`inline-flex items-center gap-1.5 text-13 font-bold mb-5 transition-colors focus-ring rounded-full px-2 py-1 -ml-2 ${
            dark ? 'text-white/60 hover:text-white' : 'text-bg/60 hover:text-bg'
          }`}
        >
          Atrás
        </button>
        <p className={`text-13 font-bold uppercase tracking-widest mb-2 ${suave}`}>Confirmar solicitud</p>
        <h3 className={`text-28 font-bold tracking-tight mb-6 ${titulo}`}>{cell.name}</h3>

        <div className={`rounded-[20px] p-6 mb-8 border shadow-sm ${dark ? 'bg-white/5 border-white/15' : 'bg-white border-bg/10'}`}>
          <p className={`text-12 font-bold uppercase tracking-widest mb-3 ${suave}`}>¿Quién te va a contactar?</p>
          <p className={`text-16 leading-relaxed font-medium ${tenue}`}>
            {cell.leader
              ? `${cell.leader}, que lidera esta célula.`
              : 'El equipo de la iglesia, que te pondrá en contacto con el líder.'}
          </p>

          {cell.address ? (
            <div className="mt-4">
              <p className={`text-15 leading-relaxed font-medium ${titulo}`}>
                Se reúnen en: {cell.address}
              </p>
              {cell.map_url && (
                <a href={cell.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-13 font-bold mt-2 text-primary hover:underline underline-offset-4">
                  Ver ubicación en el mapa
                </a>
              )}
            </div>
          ) : (
            <p className={`text-16 leading-relaxed font-medium mt-1 ${tenue}`}>
              {cell.zone ? `Se reúnen en ${cell.zone}.` : ''}
            </p>
          )}

          {(cell.day || cell.time) && (
            <p className={`text-15 font-bold mt-4 ${titulo}`}>
              Día de reunión: {[cell.day, cell.time].filter(Boolean).join(' a las ')}
            </p>
          )}
          {cell.what_to_expect && (
            <p className={`text-15 leading-relaxed mt-4 font-medium ${suave}`}>
              {cell.what_to_expect}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <motion.button {...PRESS_PRIMARY} type="button" onClick={enviar} disabled={enviando} className={btnPpal}>
            {enviando ? 'Enviando…' : 'Confirmar y Enviar'}
          </motion.button>
          <button type="button" onClick={() => setConfirmando(false)} disabled={enviando} className={btnSec}>
            Volver a editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={revisar} className="text-left flex flex-col min-h-full">
      <div className="mb-8">
        <p className={`text-13 font-bold uppercase tracking-widest mb-1.5 ${suave}`}>Aplicación</p>
        <h3 className={`text-28 font-bold leading-tight ${titulo}`}>{cell.name}</h3>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className={`block text-13 font-bold mb-2 ${titulo}`}>Tu nombre <span className="text-rose-500">*</span></span>
          <input className={campo} value={form.name} onChange={set('name')} placeholder="Ej. Ana Pérez" required />
        </label>
        <label className="block">
          <span className={`block text-13 font-bold mb-2 ${titulo}`}>Teléfono o WhatsApp <span className="text-rose-500">*</span></span>
          <input className={campo} type="tel" value={form.phone} onChange={set('phone')} placeholder="Ej. 5555 1234" required />
        </label>
        <label className="block">
          <span className={`block text-13 font-bold mb-2 ${titulo}`}>Correo <span className={`font-normal ${suave}`}>(opcional)</span></span>
          <input className={campo} type="email" value={form.email} onChange={set('email')} placeholder="ana@ejemplo.com" />
        </label>
        <label className="block">
          <span className={`block text-13 font-bold mb-2 ${titulo}`}>Cuéntanos algo de ti <span className={`font-normal ${suave}`}>(opcional)</span></span>
          <textarea
            className={`${campo} resize-none`}
            rows={3}
            value={form.message}
            onChange={set('message')}
            placeholder="Tu edad, horarios libres, por qué quieres unirte..."
          />
        </label>

        {/* La célula elegida se muestra como DATO con un "Cambiar"
            explícito, no como un select abierto -- mismo patrón que el
            departamento en Voluntariado. */}
        {!cambiando ? (
          otras.length > 0 && (
            <div className={`rounded-[14px] px-4 py-3.5 flex items-center justify-between gap-3 ${dark ? 'border border-white/12 bg-white/5' : 'border border-bg/12 bg-bg/5'}`}>
              <div className="min-w-0">
                <p className={`text-13 font-semibold mb-1 ${suave}`}>Célula seleccionada</p>
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
          <div className={`rounded-[16px] p-4 space-y-4 ${dark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-bg/10'}`}>
            <p className={`text-12 font-bold uppercase tracking-widest ${suave}`}>Opciones de cambio</p>

            {otras.length > 0 && (
              <div className="space-y-2">
                <p className={`text-13 font-semibold ${titulo}`}>Elegir otra célula en esta categoría:</p>
                <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {cells.map(c => (
                     <button
                       key={c.id}
                       type="button"
                       onClick={() => { setCell(c); setCambiando(false); }}
                       className={`flex flex-col text-left px-4 py-3 rounded-[12px] border transition-all ${cell.id === c.id ? 'border-primary bg-primary/10' : dark ? 'border-white/10 hover:border-white/30' : 'border-bg/10 hover:border-bg/30'}`}
                     >
                        <span className={`text-14 font-bold ${titulo}`}>{c.name}</span>
                        {c.zone && <span className={`text-12 ${suave}`}>{c.zone}</span>}
                     </button>
                  ))}
                </div>
              </div>
            )}

            {onChangeCategory && (
              <div className="pt-2">
                <button
                   type="button"
                   onClick={onChangeCategory}
                   className={`w-full py-3 px-4 rounded-[12px] text-13 font-bold flex items-center justify-between transition-colors ${dark ? 'bg-white/10 hover:bg-white/15' : 'bg-black/10 hover:bg-black/15'}`}
                >
                   <span className={titulo}>Explorar otras categorías</span>

                </button>
              </div>
            )}

            <div className="pt-1">
              <button type="button" onClick={() => setCambiando(false)} className={`w-full text-center text-13 font-semibold py-2 ${suave} hover:opacity-100`}>
                Cancelar cambio
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
    (cell.address || cell.zone) && {
       k: 'Dónde',
       v: cell.address || cell.zone,
       link: cell.map_url
    },
    cell.leader && { k: 'Líder', v: cell.leader },
  ].filter(Boolean);

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.18 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="text-left"
    >
      <motion.button
        variants={itemVariants}
        type="button"
        onClick={onCerrar}
        className="inline-flex items-center gap-1.5 rounded-pill bg-bg/8 hover:bg-bg/14 text-bg/75 hover:text-bg pr-4 pl-3 py-1.5 text-13 font-bold transition-colors focus-ring mb-6"
      >
        Atrás
      </motion.button>

      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <h3 className="text-d3 text-bg min-w-0 break-words">{cell.name}</h3>
      </motion.div>

      {datos.length > 0 && (
        <motion.dl variants={itemVariants} className="mt-5 divide-y divide-bg/10">
          {datos.map(d => (
            <div key={d.k} className="flex items-baseline justify-between gap-6 py-3">
              <dt className="text-13 font-semibold text-bg/55 shrink-0 uppercase tracking-widest">{d.k}</dt>
              <dd className="text-15 font-bold text-bg text-right">
                {d.v}
                {d.link && (
                  <a href={d.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-end gap-1 text-13 text-primary hover:underline underline-offset-4 mt-1.5">
                    Ver mapa
                  </a>
                )}
              </dd>
            </div>
          ))}
        </motion.dl>
      )}

      {cell.description && (
        <motion.p variants={itemVariants} className="text-16 sm:text-17 text-bg/80 leading-relaxed font-medium mt-5">
          {cell.description}
        </motion.p>
      )}

      {cell.what_to_expect && (
        <motion.div variants={itemVariants} className="glass-light-nested rounded-[20px] p-6 mt-6 border-t border-white/40 shadow-sm">
          <p className="text-12 font-bold text-bg/50 uppercase tracking-widest mb-3">Qué esperar</p>
          <p className="text-15 text-bg/85 leading-relaxed font-medium">{cell.what_to_expect}</p>
        </motion.div>
      )}

      {datos.length === 0 && !cell.description && !cell.what_to_expect && (
        <motion.p variants={itemVariants} className="text-15 text-bg/55 leading-relaxed mt-5">
          Esta célula todavía no publicó sus horarios. Déjanos tus datos y su
          líder te cuenta cuándo y dónde se reúnen.
        </motion.p>
      )}

      <motion.div variants={itemVariants} className="mt-7 block">
        <div>
          <motion.button
            {...PRESS_PRIMARY}
            type="button"
            onClick={onUnirme}
            className="w-full inline-flex items-center justify-center rounded-pill bg-bg text-white px-6 py-4 text-16 font-bold focus-ring shadow-card hover:opacity-95"
          >
            Quiero unirme a {cell.name}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CellCategoryDetail({ group, onAbrirCelula }) {
  const [zoneFilter, setZoneFilter] = useState(null);
  const zones = zonasDe(group.cells);
  const filtered = zoneFilter
    ? group.cells.filter(c => zonaCanonica(c.zone) === zoneFilter)
    : group.cells;

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.18 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {group.description && (
        <motion.p variants={itemVariants} className="text-16 sm:text-17 text-bg/80 leading-relaxed font-medium mb-6">
          {group.description}
        </motion.p>
      )}

      <motion.p variants={itemVariants} className="text-12 font-bold text-bg/50 uppercase tracking-widest mb-4">
        {group.cells.length} {group.cells.length === 1 ? 'célula activa' : 'células activas'}
      </motion.p>

      {zones.length > 1 && zones.length < group.cells.length && (
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2 mb-6">
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
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-2">
          {filtered.map((c, i) => (
            <div key={`${c.name}-${i}`}>
              <CellRow cell={c} onSolicitar={onAbrirCelula} index={i} tone="light" />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-bg/10">
        <p className="text-14 font-medium text-bg/60 leading-relaxed mb-4">
          ¿No sabes cuál elegir? Déjanos tus datos y te ubicamos en la más cercana a ti.
        </p>
        <Link
          to="/conectate"
          className="inline-flex items-center justify-center rounded-pill bg-bg text-white px-5 py-3 text-14 font-bold focus-ring hover:opacity-90 transition-opacity"
        >
          Conéctate
        </Link>
      </motion.div>
    </motion.div>
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
    return <CellJoinForm cell={solicitando} cells={category?.cells || []} onBack={() => setSolicitando(null)} onChangeCategory={() => { setSolicitando(null); restart(); }} tone="light" />;
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
            className="rounded-[12px] border border-bg/15 min-h-20 text-left text-bg focus-ring hover:bg-bg/5"
          >
            <div className="relative z-10 h-full flex flex-col justify-end p-3.5">
              <p className="text-15 font-bold text-bg leading-tight">{g.name}</p>
              {g.age && <p className="text-12 text-bg/65 mt-0.5">{g.age}</p>}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

export default function CelulasPage() {
  useSeo('Células', 'Encuentra tu grupo de crecimiento. Células en casas durante la semana para conectar, orar y aprender juntos.');
  const [params] = useSearchParams();
  const cellsResource = useApiResource('/cells');
  const categoriesResource = useApiResource('/cell-categories');
  const apiCells = cellsResource.data;
  const apiCategories = categoriesResource.data;
  const [panelTab, setPanelTab] = useState('gallery');
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
      (cellsByType[t] ||= []).push({ ...c, id: c.id || c.ID });
    });

    const base = cats.map(cat => ({
      key: `cat-${cat.ID || cat.id}`,
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
    () => groups.map(g => ({ key: g.key, image: g.image, fallbackImage: DEFAULT_CATEGORY_IMAGE, title: g.name, description: g.description, meta: `${g.cells.length} ${g.cells.length === 1 ? 'célula' : 'células'}` })),
    [groups]
  );

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
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
        subtitle="Grupos que se reúnen en casas durante la semana. Conoce un tipo a la vez y encuentra tu comunidad."
        photoSlot="hero_celulas"
        photoFallback="/images/backgrounds/comunidad-templo.webp"
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

      {cellsResource.loading || categoriesResource.loading || cellsResource.error || categoriesResource.error
        ? <div className="max-w-4xl mx-auto px-6"><CollectionStatus loading={cellsResource.loading || categoriesResource.loading} label="las células" onRetry={() => { cellsResource.retry(); categoriesResource.retry(); }} /></div>
        : <SceneCarousel items={windowItems} label="Tipos de células" empty="Sin células publicadas aún." onOpen={key => { setPanelTab('gallery'); setOpenKey(key); }} />}

      {/* ═══════ VENTANAS SOBREPUESTAS ═══════ */}
      {/* light: cristal BLANCO. La ventana de una célula es una FICHA que
          se lee (día, hora, qué esperar, el directorio) y luego un
          formulario -- texto navy sobre blanco aguanta esa densidad mucho
          mejor que blanco sobre cristal oscuro, que es material de
          vitrina. Es la misma decisión que ya tomaba Voluntariado. */}
      <WindowStack
        light photoBackdrop animated neighborTitles
        items={windowItems}
        openKey={openKey}
        onChange={setOpenKey}
        onCerrarSobrepuesto={cerrarCelula}
        sobrepuesto={celulaAbierta && (
          <CellDetailCard
            cell={celulaAbierta}
            onUnirme={() => setSolicitando(true)}
            onCerrar={cerrarCelula}
          />
        )}
        renderContent={(it) => {
          const g = groups.find(gr => gr.key === it.key);
          if (!g) return null;
          return <div>
            <PhotoTabs value={panelTab} onChange={setPanelTab} id="cells" />
            <div role="tabpanel" id="cells-panel" aria-labelledby={`cells-tab-${panelTab}`} tabIndex={0} className="focus-ring rounded-[8px]">
              {panelTab === 'gallery' && <button type="button" onClick={() => { setPanelTab('photos'); document.getElementById('cells-tab-photos')?.focus(); }} className="w-full py-5 text-left text-bg focus-ring rounded-[8px]"><span className="block text-20 font-bold">{g.name}</span><span className="block mt-2 text-14 text-bg/70">Ver fotografía</span></button>}
              {panelTab === 'photos' && <button type="button" onClick={() => { setPanelTab('info'); document.getElementById('cells-tab-info')?.focus(); }} className="min-h-11 text-15 font-semibold text-bg underline focus-ring">Conocer las células</button>}
              {panelTab === 'info' && <CellCategoryDetail key={g.key} group={g} onAbrirCelula={abrirCelula} />}
            </div>
          </div>;
        }}
      />

      {/* Quiz/matchmaker -- alternativa a hojear las 5 categorías para
          quien no sabe cuál célula es la suya. */}
      <AnimatePresence>
        {quizOpen && (
          <ModalWrapper onClose={() => setQuizOpen(false)}>
            <CellQuizModal
              groups={groups}
              onViewDetail={(key) => { setQuizOpen(false); setPanelTab('info'); setOpenKey(key); }}
            />
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Modal Formulario de Célula */}
      <AnimatePresence>
        {solicitando && celulaAbierta && (
          <ModalWrapper onClose={() => setSolicitando(false)}>
            <CellJoinForm
              cell={celulaAbierta}
              cells={groups.find(g => g.key === openKey)?.cells || []}
              onBack={() => setSolicitando(false)}
              onChangeCategory={() => { setSolicitando(false); setOpenKey(null); }}
              tone="light"
            />
          </ModalWrapper>
        )}
      </AnimatePresence>
    </main>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { RevealList, RevealItem } from '../../components/ui/Reveal';
import ParallaxImg from '../../components/ui/ParallaxImg';
import ModalWrapper from '../../components/ui/ModalWrapper';
import { useBankInfo } from '../../components/sections/BankDetails';
import { useSitePhoto } from '../../lib/feed';
import { PRESS_PRIMARY } from '../../lib/motion';
import ReceiptUploadForm from '../../components/sections/ReceiptUploadForm';

// El modal de RSVP es glass-light (blanco/translucido) -- .input-light es
// el mismo campo claro del panel admin/VolunteeringPage, funciona igual
// de bien aca. btnPrimary/btnGhost reemplazan a GlassButton (esa es
// oscura/liquid-glass, pensada para el fondo navy del sitio publico).
const btnPrimary = 'flex-1 justify-center inline-flex items-center gap-2 rounded-full bg-bg text-white text-14 font-bold px-5 py-3 shadow-card hover:opacity-90 disabled:opacity-50 transition-opacity';
const btnGhost = 'inline-flex items-center justify-center gap-2 rounded-full text-bg/55 hover:text-bg hover:bg-bg/5 text-14 font-semibold px-5 py-3 transition-colors';

// Collage estilo Galería para la vista de cuadrícula: variedad de tamaños
// para TODOS los eventos (no solo el primero), con [grid-auto-flow:dense]
// en el contenedor para que no queden huecos. Ver GalleryPage.jsx (SPANS/ROT).
const GRID_SPANS = [
  'col-span-2 row-span-2',
  'col-span-2 sm:col-span-1 row-span-1',
  'col-span-2 sm:col-span-1 row-span-1',
  'col-span-2 row-span-1',
];

// Las fechas se imprimen en caja normal, no en versales: `uppercase` con
// tracking apretado en 9-10px era la fórmula del eyebrow disfrazada de
// dato, y a ese tamaño además no se leía. es-ES devuelve "ago." / "lunes"
// en minúscula, así que solo se levanta la inicial.
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

// BankDetails.jsx es texto blanco a proposito -- lo comparten Donar y
// Comprobante, paginas oscuras. Aca el modal es claro, asi que se
// reusa solo el hook (useBankInfo) y se renderiza con tinta navy en
// vez de tocar el componente compartido.
// Sin cuenta bancaria configurada, el fallback compartido (BankDetails.jsx)
// manda a /conectate con un <a> normal -- eso recarga TODA la página y
// destruye el modal de inscripción a mitad de flujo (reportado por el
// usuario: "no redirigirme, acá se arregla todo"). Aquí, dentro del RSVP,
// nunca navega a ningún lado: si hay WhatsApp abre una pestaña nueva
// (no pierde el modal detrás), y si tampoco hay eso, es solo texto.
function LightBankDetails() {
  const { hasAccount, rows, whatsapp } = useBankInfo();

  if (!hasAccount) {
    if (whatsapp) {
      return (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-[14px] bg-bg/5 border border-bg/10 px-4 py-4 hover:bg-bg/10 transition-colors focus-ring"
        >
          <div className="text-left min-w-0">
            <p className="text-14 font-bold text-bg">Escríbenos para coordinar tu depósito</p>
            <p className="text-13 text-bg/55 mt-1">Te compartimos los datos bancarios por WhatsApp</p>
          </div>
        </a>
      );
    }
    return (
      <div className="rounded-[14px] bg-bg/5 border border-bg/10 px-4 py-4">
        <p className="text-14 font-bold text-bg">Coordinando los datos de depósito</p>
        <p className="text-13 text-bg/55 mt-1">El equipo te los compartirá pronto. Puedes subir tu comprobante aquí en cuanto tengas el depósito hecho.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between rounded-[12px] bg-bg/5 px-4 py-3 border border-bg/10">
          <span className="text-13 font-semibold text-bg/60">{label}</span>
          <span className="text-15 font-bold text-bg">{value}</span>
        </div>
      ))}
    </div>
  );
}

// glass-light-nested (segunda capa, mas transparente que el glass-light
// del modal que la envuelve) -- antes era una caja plana bg-bg/5, se
// leia como una superficie mas sin jerarquia real. Ver index.css para
// la regla: solo se sostiene con algo semi-opaco detras, que aca es el
// propio ModalWrapper.
// attendeeCount viene del formulario que la envuelve (form.attendee_count) --
// antes este banner solo recibia `event` y mostraba price_gtq fijo, sin
// importar cuantos asistentes se registraran (reportado por el usuario: Q250
// no cambiaba al poner 2 asistentes). El precio por persona lo define el
// admin; el total a pagar es ese precio x la cantidad de asistentes.
function PaymentBanner({ event, attendeeCount = 1 }) {
  const perPerson = Number(event.price_gtq) || 0;
  const total = perPerson * (attendeeCount || 1);
  return (
    <div className="glass-light-nested rounded-[22px] p-5 space-y-4 mb-4">
      <div>
        {/* Caja normal: en versales a 11px con tracking-widest esto era un
            eyebrow, no una línea de datos -- y el dato (precio por persona)
            es justo lo que hay que poder leer de un vistazo. */}
        <p className="text-13 font-semibold text-bg/50 mb-1.5">
          Evento con costo · Q{perPerson.toFixed(2)} por persona
        </p>
        {/* font-bold, no font-black: Arimo topa en 700 y los dos pintan el
            mismo trazo -- declarar 900 promete una jerarquía que la pantalla
            no cumple. */}
        <p className="text-30 text-bg font-bold leading-none tracking-tight flex items-baseline gap-2">
          Q{total.toFixed(2)}
          {attendeeCount > 1 && (
            <span className="text-14 text-bg/50 font-semibold">({attendeeCount} asistentes)</span>
          )}
        </p>
      </div>
      <p className="text-14 text-bg/60 leading-relaxed">
        Este evento requiere pago previo. Realiza el depósito y sube tu comprobante.
      </p>
      {/* Datos bancarios administrables (nunca un número inventado) */}
      <div className="pt-1 border-t border-bg/10">
        <LightBankDetails />
      </div>
      {event.payment_deadline && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-rose/10 border border-rose/20 text-rose text-12 font-bold w-fit">
          Fecha límite: {new Date(event.payment_deadline + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
        </span>
      )}
    </div>
  );
}

function RSVPModal({ event, onClose }) {
  const [form, setForm]         = useState({ name: '', email: '', phone: '', attendee_count: 1, notes: '' });
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState('form'); // form | success | need_payment | retry_failed | pending_payment
  const [successMsg, setSuccessMsg] = useState('');

  // Si el evento cobra pero el admin todavía no cargó una cuenta bancaria
  // real (Settings), NO se debe ofrecer "sube tu comprobante" -- no hay a
  // dónde depositar. La opción de subir comprobante queda condicionada a
  // que exista un número de cuenta real, no solo a que el evento cobre.
  const { hasAccount, whatsapp } = useBankInfo();
  const paymentNotReady = event.requires_payment && !hasAccount;

  const set = k => e => setForm(p => ({
    ...p,
    [k]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value,
  }));

  // Intenta registrar el RSVP. Se llama desde el submit del formulario Y
  // otra vez, sola, apenas se sube el comprobante (sin que el usuario
  // vuelva a tocar nada) -- antes esto vivia solo en handleSubmit y el
  // paso "need_payment" mandaba a /comprobante, una pagina aparte que no
  // volvia a intentar el registro: el usuario subia su boleta y quedaba
  // con un comprobante huerfano, sin RSVP real hasta que regresara a
  // reintentar a mano.
  const attemptRSVP = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post(`/events/${event.ID}/rsvp`, form);
      const msg = res.data?.message || '¡Registro confirmado!';
      const payStatus = res.data?.registration?.payment_status;

      setSuccessMsg(msg);
      setStep(payStatus === 'pendiente' ? 'pending_payment' : 'success');
      return true;
    } catch (err) {
      const status = err.response?.status;
      if (status === 402) {
        // No tiene boleta → mostrar el formulario de comprobante aquí mismo
        setStep('need_payment');
      } else {
        // 409 puede ser correo duplicado O cupo lleno/insuficiente — el
        // backend ya manda el mensaje exacto en cada caso.
        toast.error(err.response?.data?.error || 'Error al registrar');
      }
      return false;
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Nombre y correo son obligatorios'); return; }
    await attemptRSVP();
  };

  // El comprobante ya quedó creado (status "pendiente") -- reintentar el
  // registro de inmediato, sin que el usuario tenga que hacer nada más.
  const handleReceiptUploaded = async () => {
    const ok = await attemptRSVP();
    if (!ok) setStep('retry_failed');
  };

  // ── Pantalla: el evento cobra pero no hay cuenta bancaria configurada --
  // se bloquea ANTES de mostrar el formulario, no se llega ni a "sube tu
  // comprobante" (no hay a dónde depositar).
  if (paymentNotReady) return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center py-6">
        <h3 className="text-19 text-bg font-bold mb-2">Registro no disponible aún</h3>
        <p className="text-14 text-bg/60 mb-1">Este evento requiere pago, pero el equipo todavía no carga los datos de depósito.</p>
        <p className="text-14 text-bg/60 mb-5">
          {whatsapp ? 'Escríbenos por WhatsApp para coordinar tu registro mientras tanto.' : 'Vuelve a intentarlo más tarde o contáctanos por redes sociales.'}
        </p>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-full bg-bg text-white text-14 font-semibold shadow-card hover:opacity-90">
            Escríbenos por WhatsApp
          </a>
        )}
        <button onClick={onClose} className="mt-3 w-full h-10 rounded-full border border-bg/15 text-14 text-bg/60 hover:text-bg hover:bg-bg/5 transition-colors">
          Cerrar
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: éxito sin pago
  if (step === 'success') return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center py-6">
        <h3 className="text-19 text-bg font-bold mb-2">¡Registro confirmado!</h3>
        <p className="text-14 text-bg/60">{successMsg}</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-full bg-bg text-white text-14 font-semibold shadow-card hover:opacity-90">
          Listo
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: registrado pero pago pendiente de verificación
  if (step === 'pending_payment') return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center py-6">
        <h3 className="text-19 text-bg font-bold mb-2">Registro recibido</h3>
        <p className="text-14 text-bg/60 mb-1">Tu comprobante está pendiente de verificación.</p>
        <p className="text-14 text-bg/60">Recibirás confirmación cuando sea aprobado.</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-full bg-bg text-white text-14 font-semibold shadow-card hover:opacity-90">
          Entendido
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: necesita subir boleta -- el formulario de comprobante vive
  // AQUÍ MISMO (ReceiptUploadForm embebido, no una página aparte); al
  // terminar de subir, handleReceiptUploaded reintenta el registro solo.
  if (step === 'need_payment') return (
    <ModalWrapper onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="text-16 text-bg font-bold">Comprobante requerido</h3>
          <p className="text-14 text-bg/60">Debes pagar antes de registrarte.</p>
        </div>

        <PaymentBanner event={event} attendeeCount={form.attendee_count} />

        <ReceiptUploadForm
          eventId={event.ID}
          purpose="evento"
          defaultAmount={((Number(event.price_gtq) || 0) * (form.attendee_count || 1)).toFixed(2)}
          defaultName={form.name}
          defaultEmail={form.email}
          defaultPhone={form.phone}
          onSuccess={handleReceiptUploaded}
        />

        <button onClick={() => setStep('form')}
          className="w-full h-10 rounded-full border border-bg/15 text-14 text-bg/60 hover:text-bg hover:bg-bg/5 transition-colors">
          Volver
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: el comprobante se subió pero el reintento de registro
  // falló (ej. se cayó la red justo en ese momento) -- el comprobante YA
  // quedó guardado, solo falta completar el registro con un toque.
  if (step === 'retry_failed') return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center py-6">
        <h3 className="text-19 text-bg font-bold mb-2">Comprobante guardado</h3>
        <p className="text-14 text-bg/60 mb-5">No se pudo completar el registro automáticamente. Intenta de nuevo.</p>
        <button onClick={attemptRSVP} disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-bg text-white text-14 font-semibold shadow-card hover:opacity-90 disabled:opacity-50">
          {loading ? 'Completando…' : 'Completar registro'}
        </button>
      </div>
    </ModalWrapper>
  );

  return (
    <ModalWrapper onClose={onClose}>
      <div className="mb-4 pr-10">
        {/* Es el título real del modal, no una etiqueta encima del título:
            en versales a 12px se leía como eyebrow y dejaba al nombre del
            evento (14px) pesando más que la acción. Sigue siendo <p> a
            propósito -- el e2e de eventos localiza `p` con este texto. */}
        <p className="text-16 text-bg font-bold">Confirmar asistencia</p>
        <p className="text-14 text-bg/60 mt-0.5 truncate max-w-64">{event.title}</p>
      </div>
      {event.requires_payment && <PaymentBanner event={event} attendeeCount={form.attendee_count} />}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-12 font-bold text-bg/60 mb-1">Nombre <span className="text-rose">*</span></label>
          <input value={form.name} onChange={set('name')} className="input-light" placeholder="Tu nombre completo" required />
        </div>
        <div>
          <label className="block text-12 font-bold text-bg/60 mb-1">Correo <span className="text-rose">*</span></label>
          <input type="email" value={form.email} onChange={set('email')} className="input-light" placeholder="El mismo correo del comprobante" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-12 font-bold text-bg/60 mb-1">Teléfono</label>
            <input value={form.phone} onChange={set('phone')} className="input-light" placeholder="+502 …" />
          </div>
          <div>
            <label className="block text-12 font-bold text-bg/60 mb-1">Asistentes</label>
            <input type="number" min={1} max={event.spots_remaining ?? 20} value={form.attendee_count} onChange={set('attendee_count')} className="input-light" />
            {event.spots_remaining != null && (
              <p className="text-11 text-bg/40 mt-1">
                {event.spots_remaining} cupo{event.spots_remaining === 1 ? '' : 's'} disponible{event.spots_remaining === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-12 font-bold text-bg/60 mb-1">Notas</label>
          <textarea rows={2} value={form.notes} onChange={set('notes')} className="input-light resize-none" placeholder="¿Algo que debamos saber?" />
        </div>
        <div className="flex gap-3 pt-2 border-t border-bg/10">
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Verificando…' : event.requires_payment ? 'Verificar y registrar' : 'Confirmar asistencia'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>Cancelar</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// El invitado no tiene sesion, asi que el correo con el que se registro es
// la unica prueba de identidad disponible (misma logica que RegisterRSVP
// usa para evitar duplicados).
function CancelRSVPModal({ event, onClose, onCancelled }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await apiClient.delete(`/events/${event.ID}/rsvp?email=${encodeURIComponent(email)}`);
      toast.success('Tu registro fue cancelado.');
      onCancelled?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos cancelar tu registro.');
    } finally { setLoading(false); }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="mb-4 pr-10">
        <p className="text-16 text-bg font-bold">Cancelar registro</p>
        <p className="text-14 text-bg/60 mt-0.5 truncate max-w-64">{event.title}</p>
      </div>
      <form onSubmit={handleCancel} className="space-y-3">
        <div>
          <label className="block text-12 font-bold text-bg/60 mb-1">Correo con el que te registraste</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-light" placeholder="tu@correo.com" required autoFocus />
        </div>
        <div className="flex gap-3 pt-2 border-t border-bg/10">
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Cancelando…' : 'Cancelar mi registro'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>Volver</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function EventCard({ ev, i, onRsvp, onCancelRsvp, highlighted }) {
  const nodeRef = useRef(null);
  // Card destacada por deep-link (viene de "Próximos eventos" en el
  // Home, ?id=<ID>): anillo temporal que se desvanece solo -- confirma
  // al usuario CUAL evento cargó sin dejar el resaltado pegado para siempre.
  const [showHighlight, setShowHighlight] = useState(highlighted);
  useEffect(() => {
    if (!highlighted) return;
    nodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShowHighlight(true);
    const t = setTimeout(() => setShowHighlight(false), 2600);
    return () => clearTimeout(t);
  }, [highlighted]);
  // Regla del sitio: cristal blanco (glass-light) para contenido sin foto
  // propia; cristal oscuro (liquid-glass) para cards que SI muestran una
  // foto propia (el degradado claro deslavaba el flyer -- feedback real
  // del usuario). La clasificacion real ya no es "con/sin foto" a ciegas:
  // es foto->oscuro, sin foto->claro, aplicado consistente en todo el sitio.
  const hasPhoto = Boolean(ev.cover_image);

  const d        = ev.date ? new Date(ev.date + 'T12:00:00') : null;
  const dayNum   = d ? d.getDate() : null;
  const monthStr = d ? cap(d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')) : null;
  const weekday  = d ? cap(d.toLocaleDateString('es-ES', { weekday: 'long' })) : 'Evento';
  const details  = [ev.time, ev.location]
    .filter(Boolean)
    .map(s => s[0].toUpperCase() + s.slice(1))
    .join(' · ');
  const bentoSpan = GRID_SPANS[i % GRID_SPANS.length];
  // La card destacada (2x2) es mucho mas alta que las demas -- si el
  // contenido queda anclado abajo (como en las cards chicas), deja un
  // tramo enorme de vidrio vacio arriba antes del texto, y a primera
  // vista (o con scroll a mitad de card) se lee como una card rota/sin
  // contenido. Centrado vertical solo para esta, sin tocar las demas.
  const isFeaturedTall = bentoSpan.includes('row-span-2');

  // Tinta segun material: blanca sobre liquid-glass (con foto), navy
  // sobre glass-light (sin foto).
  const ink        = hasPhoto ? 'text-white'    : 'text-bg';
  const ink80      = hasPhoto ? 'text-white/80' : 'text-bg/80';
  const ink60      = hasPhoto ? 'text-white/60' : 'text-bg/60';
  const ink50      = hasPhoto ? 'text-white/50' : 'text-bg/50';
  const ink40      = hasPhoto ? 'text-white/40' : 'text-bg/40';
  const ink35      = hasPhoto ? 'text-white/35' : 'text-bg/35';
  const inkHover    = hasPhoto ? 'hover:text-white/60' : 'hover:text-bg/60';
  const wellBg     = hasPhoto ? 'bg-white/5'  : 'bg-bg/5';
  const wellBorder = hasPhoto ? 'border-white/10' : 'border-bg/10';

  // La card NO es navegable: no lleva href ni onClick, el que actúa es el
  // botón de RSVP que vive adentro. El Tilt que la envolvía inclinaba en 3D
  // una superficie que no responde al click, y eso promete una afordancia
  // falsa -- se queda solo el motion.div con la entrada/salida (la necesita
  // el AnimatePresence del grid) y `liquid-shine` a mano, que antes lo
  // agregaba la prop `glass` de Tilt. El bisel de .liquid-glass/.glass-light
  // vive en la clase, así que el material no cambia.
  // Sigue envuelta en un <div> simple (con el ref/id/bentoSpan): scrollIntoView
  // necesita ese ref para el deep-link desde Home, y el span del grid bento
  // debe vivir en el elemento que Grid realmente mide.
  return (
    <div ref={nodeRef} id={`event-${ev.ID}`} className={`${bentoSpan} w-full h-full`}>
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
      className={`w-full h-full ${hasPhoto ? 'liquid-glass' : 'glass-light'} liquid-shine relative overflow-hidden rounded-[22px] group transition-shadow ${showHighlight ? 'event-highlight' : ''}`}
    >

      {hasPhoto && (
        <>
          {/* Flyer a color pleno: el `opacity-80` que llevaba encima lo
              entregaba deslavado antes de que el degradado siquiera actuara.
              El contraste lo pone el scrim, no la opacidad de la foto. */}
          <img src={ev.cover_image} alt={ev.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          {/* .scrim-card: el texto de esta card vive anclado al tercio
              inferior, así que oscurece ahí y deja el flyer visible arriba. */}
          <div className="scrim-card" />
        </>
      )}

      {/* Etiqueta de próximo evento si es el primero -- sin el punto que
          pulsaba delante: es el mismo pill+punto que se quitó de todo el
          sitio, un pictograma decorativo pegado a un dato que ya se dice
          con palabras. */}
      {i === 0 && (
        <div className="absolute top-6 left-6 z-20">
          <span className="bg-bg/90 px-4 py-1.5 rounded-full text-white text-12 font-bold backdrop-blur-md">
            Próximo evento
          </span>
        </div>
      )}

      {/* Contenido -- antes las cards con foto metian el texto en un
          panel flotante CON su propio borde/blur (liquid-glass anidado),
          lo que se leia como dos cajas separadas (foto arriba, panel
          abajo) en vez de una sola card. Ahora el texto va directo
          sobre el degradado, sin caja propia -- una sola superficie. */}
      <div className={hasPhoto
        ? 'absolute bottom-0 left-0 right-0 z-20 p-5'
        : `relative z-20 h-full flex flex-col ${isFeaturedTall ? 'justify-center' : 'justify-end'} p-5`
      }>
        {/* Contenedor de layout puro (sin fondo ni recorte): el radio que
            llevaba no dibujaba nada, el que manda es el de la card. */}
        <div className="flex flex-col gap-4">

          <div className="flex items-center gap-4 w-full min-w-0">
            {/* Fecha */}
            {dayNum && (
              <div className={`text-center shrink-0 flex flex-col items-center justify-center rounded-2xl ${wellBg} border ${wellBorder} shadow-inner w-[60px] h-[60px]`}>
                <div className={`font-bold leading-none ${ink} tracking-tighter text-24`}>
                  {dayNum}
                </div>
                {/* El mes iba en versales a 9px con 2px de tracking: no era
                    legible y era la fórmula del eyebrow aplicada a un dato. */}
                <div className={`font-semibold mt-0.5 ${ink50} text-13`}>
                  {monthStr}
                </div>
              </div>
            )}

            {/* Detalles */}
            <div className="min-w-0 flex-1">
              {/* Sin font-mono: era una tercera familia tipográfica usada
                  solo para hacer micro-versales, y a 10px no se leía. */}
              <p className={`text-13 font-semibold ${ink40} mb-1`}>
                {weekday}
              </p>
              <h3 className={`font-bold tracking-tight ${ink} line-clamp-1 text-20 leading-tight`}>
                {ev.title}
              </h3>
            </div>
          </div>

          {details && (
            <p className={`truncate ${ink60} text-13`}>
              {details}
            </p>
          )}

          {/* Descripción real del evento -- solo en la card destacada
              (2x2), que tiene espacio de sobra; el dato ya existe en
              /admin/events, antes nunca se mostraba en la vista pública. */}
          {isFeaturedTall && ev.description && (
            <p className={`${ink60} text-14 leading-relaxed line-clamp-2`}>
              {ev.description}
            </p>
          )}

          <div className={`shrink-0 flex flex-col gap-3 w-full pt-3 border-t ${wellBorder}`}>
            {/* Gratis vs. pagado: la clasificación real de la card, siempre visible */}
            <div className="flex flex-wrap gap-2">
              {ev.requires_payment ? (
                <span className={`font-bold text-12 ${ink80} flex items-center gap-1.5 px-3 py-1 ${wellBg} rounded-full border ${wellBorder} w-fit`}>
                  Q{Number(ev.price_gtq).toFixed(0)}
                </span>
              ) : (
                <span className={`font-bold text-12 ${ink80} flex items-center gap-1.5 px-3 py-1 ${wellBg} rounded-full border ${wellBorder} w-fit`}>
                  Gratis
                </span>
              )}
              {ev.spots_remaining != null && (
                <span className={`font-bold text-12 flex items-center gap-1.5 px-3 py-1 rounded-full border w-fit ${
                  ev.is_full ? 'text-rose bg-rose/10 border-rose/25' : `${ink80} ${wellBg} ${wellBorder}`
                }`}>
                  {ev.is_full ? 'Cupo lleno' : `${ev.spots_remaining} cupo${ev.spots_remaining === 1 ? '' : 's'} disponible${ev.spots_remaining === 1 ? '' : 's'}`}
                </span>
              )}
            </div>
            {/* PRESS_PRIMARY: es la acción principal de la card, y ahora se
                levanta con la misma física que el resto de CTAs del sitio en
                vez de con una escala inventada acá (1.03/0.95). Con cupo
                lleno no reacciona: no hay acción que confirmar. */}
            <motion.button
              {...(ev.is_full ? {} : PRESS_PRIMARY)}
              onClick={() => !ev.is_full && onRsvp(ev)}
              disabled={ev.is_full}
              className={`rounded-full text-14 font-bold inline-flex items-center justify-center gap-3 group/btn w-full py-3 ${
                ev.is_full
                  ? `${wellBg} border ${wellBorder} ${ink40} cursor-not-allowed`
                  : hasPhoto ? 'bg-white text-bg hover:opacity-90' : 'bg-bg text-white hover:opacity-90'
              }`}
            >
              {ev.is_full ? 'Cupo lleno' : ev.requires_payment ? 'Registrarme' : 'Confirmar'}
            </motion.button>
            <button
              type="button"
              onClick={() => onCancelRsvp(ev)}
              className={`${ink35} ${inkHover} text-12 font-medium transition-colors self-center`}
            >
              ¿Ya te registraste? Cancelar mi registro
            </button>
          </div>

        </div>
      </div>

    </motion.div>
    </div>
  );
}

// Card compacta para eventos que ya pasaron -- sin RSVP (no tiene sentido
// registrarse a un evento que ya ocurrio), sin badge de precio/cupo, mas
// pequeña y con menos peso visual que las cards de proximos eventos.
function PastEventCard({ ev }) {
  const d        = ev.date ? new Date(ev.date + 'T12:00:00') : null;
  const dayNum   = d ? d.getDate() : null;
  const monthStr = d ? cap(d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')) : null;
  const details  = [ev.time, ev.location]
    .filter(Boolean)
    .map(cap)
    .join(' · ');

  return (
    <div className="glass-light rounded-[22px] p-4 flex items-center gap-4 opacity-80">
      {dayNum && (
        <div className="text-center shrink-0 flex flex-col items-center justify-center rounded-xl bg-bg/5 border border-bg/10 w-12 h-12">
          <div className="font-bold leading-none text-bg/70 text-16">{dayNum}</div>
          {/* Igual que en la card de próximos: caja normal y un tamaño que
              se pueda leer (venía en versales a 7px). */}
          <div className="font-semibold text-bg/40 text-12">{monthStr}</div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-bg/70 text-15 tracking-tight line-clamp-1">{ev.title}</h4>
        {details && <p className="text-bg/40 text-12 truncate mt-0.5">{details}</p>}
      </div>
    </div>
  );
}

// El ModalWrapper local que vivía acá se migró al compartido
// (components/ui/ModalWrapper.jsx) en ago-2026 -- tenía el mismo fix del
// botón cerrar (fuera del área con scroll, reportado en este archivo
// primero), pero le faltaba animación de entrada/salida y usaba un
// z-50 más bajo que el z-[200] que ya usan WindowStack/los demás modales
// del sitio. El componente compartido ya trae ambas cosas resueltas.

export default function EventsPage() {
  const heroImg = useSitePhoto('hero_eventos', '/images/bg-eventos.jpg');
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id');
  const [events, setEvents] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // States para modales/interacción
  const [rsvpEvent, setRsvpEvent] = useState(null);
  const [cancelEvent, setCancelEvent] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  // Fecha local (no UTC -- toISOString() se adelanta un dia cerca de
  // medianoche en Guatemala, UTC-6) para separar proximos de pasados.
  // El backend ya ordena ASC por fecha; ya no hay que reordenar los
  // proximos, solo invertir los pasados (mas reciente primero).
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const upcomingEvents = events.filter(ev => !ev.date || ev.date >= todayStr);
  const pastEvents = events.filter(ev => ev.date && ev.date < todayStr).slice().reverse();

  // Cache-bust: /events/ tiene 20s de Cache-Control (ver AdminEvents.jsx),
  // por eso tras cancelar un RSVP pedimos con _t para ver el cupo real de
  // inmediato en vez del spots_remaining cacheado de hace segundos.
  const reloadEvents = () =>
    apiClient.get(`/events/?_t=${Date.now()}`)
      .then(r => setEvents(r.data || []))
      .catch(() => {});

  useEffect(() => {
    Promise.all([
      apiClient.get('/events/').catch(() => ({ data: [] })),
      apiClient.get('/faqs/').catch(() => ({ data: [] }))
    ])
      .then(([eventsRes, faqsRes]) => {
        setEvents(eventsRes.data || []);
        setFaqs(faqsRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[100svh] bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  return (
    <main className="min-h-[100svh] relative overflow-hidden flex flex-col">
      {/* Hero -- esta página reimplementa a mano el bloque de PageHero, así
          que al menos sigue su misma gramática:
          · La foto queda ACOTADA al hero. Antes el ParallaxImg colgaba de
            <main> y estiraba una sola imagen sobre la página entera, por eso
            hacía falta un degradado plano que la apagara de arriba abajo.
          · Foto a color pleno (sin `opacity-45`) y .scrim-hero poniendo el
            contraste solo bajo el titular centrado.
          · Sin Reveal: es lo primero que se ve al cargar. Un titular que
            todavía se está deslizando cuando llegás no es el ancla de la
            pantalla, es algo acomodándose. */}
      <section className="relative pt-40 pb-12 overflow-hidden">
        <ParallaxImg src={heroImg} alt="" />
        <div className="scrim-hero" />
        <div className="relative z-10 px-6 max-w-6xl mx-auto w-full text-center">
          <h1 className="text-d1 text-white">Eventos</h1>
          <p className="mt-6 text-18 leading-relaxed text-white/70 max-w-2xl mx-auto">
            Conéctate con nuestra comunidad en persona. Encuentra tu lugar, adora y crece con nosotros.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto pb-20 w-full flex-1 max-w-7xl px-6">
        {events.length === 0 ? (
          /* ── Empty state ──
             Antes cerraba con "publicamos nuevos eventos cada semana": una
             promesa de frecuencia que nadie firmó y que esta misma pantalla
             está desmintiendo mientras se lee (si hubiera uno por semana,
             aquí habría eventos). Se queda solo con lo verificable -- cuando
             se publique uno, aparece aquí -- y con la salida real que el
             sitio ya tiene: el mismo Instagram del footer y de Células.
             El label "Próximos eventos" que iba encima se elimina: era un
             eyebrow puesto sobre el único titular del bloque. */
          <div className="py-32 flex flex-col items-center gap-5 text-center">
            <p className="text-d3 text-white/50">Sin eventos publicados aún.</p>
            <p className="text-white/40 text-16 max-w-md">
              Cuando se publique el próximo, aparece en esta página.
            </p>
            <a
              href="https://www.instagram.com/ig.casadelrey/"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-pill bg-white text-bg text-14 font-bold hover:opacity-90 transition-opacity focus-ring"
            >
              Síguenos en Instagram
            </a>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/50 font-bold text-20">No hay próximos eventos por ahora.</p>
            <p className="text-white/40 text-15 mt-2">Revisa los eventos pasados más abajo.</p>
          </div>
        ) : (
          /* ── Cuadrícula de próximos eventos ── */
          <AnimatePresence>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[230px] sm:auto-rows-[250px] gap-6 [grid-auto-flow:dense]">
              {upcomingEvents.map((ev, i) => (
                <EventCard key={ev.ID} ev={ev} i={i} onRsvp={setRsvpEvent} onCancelRsvp={setCancelEvent} highlighted={highlightId != null && String(ev.ID) === highlightId} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* ── Eventos pasados: compactos, sin RSVP, mas recientes primero ── */}
        {pastEvents.length > 0 && (
          <div className="mt-16 pt-12 border-t border-white/5">
            {/* Sin Reveal y en caja normal: el titular de sección es el punto
                fijo contra el que llegan las cards de abajo, no una pieza más
                que entra. Y `uppercase tracking-tightish` era la fórmula del
                eyebrow -- las versales piden MÁS aire, no menos. */}
            <p className="text-13 font-semibold text-white/40 mb-6">Eventos pasados</p>
            <RevealList className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pastEvents.map(ev => (
                <RevealItem key={ev.ID}>
                  <PastEventCard ev={ev} />
                </RevealItem>
              ))}
            </RevealList>
          </div>
        )}
      </div>

      {/* Secciones dinámicas: FAQs -- el wrapper con la hairline y los ~248px
          de aire vertical vive DENTRO del condicional. Antes se renderizaba
          siempre con el `faqs.length > 0` adentro, así que una página sin FAQs
          (o con la API caída, que devuelve []) cerraba con un borde que no
          separaba nada y un vacío enorme colgando debajo. */}
      {faqs.length > 0 && (
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-32 border-t border-white/5 pt-20 mt-10">
          <div className="max-w-3xl mx-auto">
            {/* Sin Reveal: el titular de sección ya está cuando llegas, y las
                FAQs entran por debajo contra él. */}
            <div className="text-center mb-10">
              <h2 className="text-d2 text-white">Preguntas frecuentes</h2>
              <p className="text-white/60 mt-4 max-w-2xl mx-auto">Todo lo que necesitas saber antes de asistir a nuestros eventos.</p>
            </div>

            <RevealList className="space-y-3">
              {faqs.map(faq => (
                <RevealItem key={faq.ID} depth>
                {/* Sin Tilt: la fila no es navegable (el que actúa es el
                    botón de adentro) y mide ~70px de alto -- inclinar en 3D
                    algo así es ruido, no material. `liquid-shine` se agrega a
                    mano porque lo aportaba la prop `glass`. */}
                <div className="glass-light liquid-shine rounded-[22px] overflow-hidden block">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.ID ? null : faq.ID)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between group cursor-pointer"
                  >
                    <span className="text-bg font-semibold pr-4">{faq.question}</span>
                    <motion.span
                      animate={{ rotate: openFaq === faq.ID ? 45 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className="w-9 h-9 rounded-full bg-bg/6 border border-bg/12 flex items-center justify-center text-bg shrink-0 text-18 font-bold leading-none select-none"
                    >
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {openFaq === faq.ID && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-5 pt-0 text-bg/60 text-15 leading-relaxed border-t border-bg/10 mt-2">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </RevealItem>
              ))}
            </RevealList>
          </div>
        </div>
      )}

      {/* RSVP Modal */}
      <AnimatePresence>
        {rsvpEvent && <RSVPModal event={rsvpEvent} onClose={() => setRsvpEvent(null)} />}
        {cancelEvent && (
          <CancelRSVPModal
            event={cancelEvent}
            onClose={() => setCancelEvent(null)}
            onCancelled={reloadEvents}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

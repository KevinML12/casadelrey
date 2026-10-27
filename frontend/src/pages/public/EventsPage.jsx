import CollectionStatus from '../../components/ui/CollectionStatus';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { RevealList, RevealItem } from '../../components/ui/Reveal';
import SceneCarousel from '../../components/ui/SceneCarousel';
import ModalWrapper from '../../components/ui/ModalWrapper';
import { useBankInfo } from '../../components/sections/BankDetails';
import { useSitePhoto } from '../../lib/feed';
import { PRESS_PRIMARY } from '../../lib/motion';
import ReceiptUploadForm from '../../components/sections/ReceiptUploadForm';
import PageHero from '../../components/layout/PageHero';

// El modal de RSVP es glass-light (blanco/translucido) -- .input-light es
// el mismo campo claro del panel admin/VolunteeringPage, funciona igual
// de bien aca. btnPrimary/btnGhost reemplazan a GlassButton (esa es
// oscura/liquid-glass, pensada para el fondo navy del sitio publico).
const btnPrimary = 'flex-1 justify-center inline-flex items-center gap-2 rounded-full bg-bg text-white text-14 font-bold px-5 py-3 shadow-card hover:opacity-90 disabled:opacity-50 transition-opacity';
const btnGhost = 'inline-flex items-center justify-center gap-2 rounded-full text-bg/55 hover:text-bg hover:bg-bg/5 text-14 font-semibold px-5 py-3 transition-colors';

// Las fechas se imprimen en caja normal, no en versales: `uppercase` con
// tracking apretado en 9-10px era la fórmula del eyebrow disfrazada de
// dato, y a ese tamaño además no se leía. es-ES devuelve "ago." / "lunes"
// en minúscula, así que solo se levanta la inicial.

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

// La cancelación exige un código de un solo uso enviado al correo registrado.
function CancelRSVPModal({ event, onClose, onCancelled }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      if (!codeRequested) {
        const res = await apiClient.post(`/events/${event.ID}/rsvp/cancellation`, { email });
        toast.success(res.data.message);
        setCodeRequested(true);
        return;
      }
      await apiClient.delete(`/events/${event.ID}/rsvp`, { data: { email, token: code } });
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
          <label htmlFor="cancel-rsvp-email" className="block text-12 font-bold text-bg/60 mb-1">Correo con el que te registraste</label>
          <input id="cancel-rsvp-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setCodeRequested(false); setCode(''); }} className="input-light" placeholder="tu@correo.com" required autoFocus />
        </div>
        {codeRequested && <div>
          <label htmlFor="cancel-rsvp-code" className="block text-12 font-bold text-bg/60 mb-1">Código enviado a tu correo</label>
          <input id="cancel-rsvp-code" value={code} onChange={e => setCode(e.target.value)} className="input-light" required autoComplete="one-time-code" />
          <p className="text-12 text-bg/60 mt-1">Caduca en 15 minutos. Revisa también tu carpeta de spam.</p>
        </div>}
        <div className="flex gap-3 pt-2 border-t border-bg/10">
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Procesando…' : codeRequested ? 'Cancelar mi registro' : 'Enviar código'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>Volver</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function EventCard({ ev, onRsvp, onCancelRsvp, past = false }) {
  const date = ev.date ? new Date(`${ev.date}T12:00:00`).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return <div className="text-white" id={`event-${ev.ID}`}>
    <h2 className="text-28 sm:text-32 font-bold tracking-tight">{ev.title}</h2>
    <p className="mt-4 text-14 text-white/80">{[date, ev.time, ev.location].filter(Boolean).join(' · ')}</p>
    {ev.description && <p className="mt-5 text-16 leading-relaxed text-white/85">{ev.description}</p>}
    {!past && <div className="mt-6 space-y-4">
      <p className="text-14 font-semibold">{ev.requires_payment ? `Q${Number(ev.price_gtq).toFixed(2)} por persona` : 'Gratis'}{ev.spots_remaining != null ? ` · ${ev.is_full ? 'Cupo lleno' : `${ev.spots_remaining} cupos disponibles`}` : ''}</p>
      <button type="button" disabled={ev.is_full} onClick={() => onRsvp(ev)} className="min-h-11 rounded-pill bg-white px-6 py-3 text-14 font-bold text-bg disabled:opacity-50 focus-ring">{ev.is_full ? 'Cupo lleno' : ev.requires_payment ? 'Registrarme' : 'Confirmar'}</button>
      <button type="button" onClick={() => onCancelRsvp(ev)} className="block min-h-11 text-13 text-white/80 underline underline-offset-4 focus-ring rounded-[8px]">¿Ya te registraste? Cancelar mi registro</button>
    </div>}
  </div>;
}

// El ModalWrapper local que vivía acá se migró al compartido
// (components/ui/ModalWrapper.jsx) en ago-2026 -- tenía el mismo fix del
// botón cerrar (fuera del área con scroll, reportado en este archivo
// primero), pero le faltaba animación de entrada/salida y usaba un
// z-50 más bajo que el z-[200] que ya usan WindowStack/los demás modales
// del sitio. El componente compartido ya trae ambas cosas resueltas.

export default function EventsPage() {
  const heroImg = useSitePhoto('hero_eventos', '/images/backgrounds/congregacion.webp');
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id');
  const [events, setEvents] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
    let active = true;
    setLoading(true);
    setFeedError(false);
    Promise.all([
      apiClient.get('/events/'),
      apiClient.get('/faqs/').catch(() => ({ data: [] }))
    ])
      .then(([eventsRes, faqsRes]) => {
        if (!active) return;
        setEvents(eventsRes.data || []);
        setFaqs(faqsRes.data || []);
      })
      .catch(() => { if (active) setFeedError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  return (
    <main className="min-h-[100svh] relative overflow-hidden flex flex-col">
      <PageHero title="Eventos" photoSrc={heroImg}
        subtitle="Conéctate con nuestra comunidad en persona. Encuentra tu lugar, adora y crece con nosotros." />

      <div className="relative z-10 mx-auto pb-20 w-full flex-1">
        {loading || feedError ? (
          <CollectionStatus loading={loading} label="los eventos" onRetry={() => setAttempt(v => v + 1)} />
        ) : events.length === 0 ? (
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
          <SceneCarousel key={highlightId || 'upcoming'} initialKey={upcomingEvents.find(event => String(event.ID) === highlightId)?.ID} items={upcomingEvents.map(event => ({ ...event, key: event.ID, image: event.cover_image || heroImg }))} label="Próximos eventos" panelClassName="h-[440px]" renderContent={event => <EventCard ev={event} onRsvp={setRsvpEvent} onCancelRsvp={setCancelEvent} />} />
        )}

        {/* ── Eventos pasados: compactos, sin RSVP, mas recientes primero ── */}
        {pastEvents.length > 0 && (
          <div className="mt-16 pt-12 border-t border-white/5">
            {/* Sin Reveal y en caja normal: el titular de sección es el punto
                fijo contra el que llegan las cards de abajo, no una pieza más
                que entra. Y `uppercase tracking-tightish` era la fórmula del
                eyebrow -- las versales piden MÁS aire, no menos. */}
            <p className="text-13 font-semibold text-white/40 mb-6">Eventos pasados</p>
            <SceneCarousel items={pastEvents.map(event => ({ ...event, key: event.ID, image: event.cover_image || heroImg }))} label="Eventos pasados" renderContent={event => <EventCard ev={event} past />} />
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

                <div className="glass-light liquid-shine rounded-[22px] overflow-hidden block">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.ID ? null : faq.ID)}
                    aria-expanded={openFaq === faq.ID}
                    className="w-full px-6 py-5 text-left flex items-center justify-between group cursor-pointer"
                  >
                    <span className="text-bg font-semibold pr-4">{faq.question}</span>
                    <span className="text-13 font-bold text-bg/70 shrink-0">{openFaq === faq.ID ? 'Ocultar' : 'Ver'}</span>
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

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { Icon, Eyebrow, GlassButton } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';
import BankDetails from '../../components/sections/BankDetails';
import { useSitePhoto } from '../../lib/feed';

const fieldCls = 'w-full px-4 py-2.5 rounded-[14px] border border-white/15 bg-white/5 text-[14px] text-white placeholder:text-white/35 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all';

// Collage estilo Galería para la vista de cuadrícula: variedad de tamaños
// para TODOS los eventos (no solo el primero), con [grid-auto-flow:dense]
// en el contenedor para que no queden huecos. Ver GalleryPage.jsx (SPANS/ROT).
const GRID_SPANS = [
  'col-span-2 row-span-2',
  'col-span-2 sm:col-span-1 row-span-1',
  'col-span-2 sm:col-span-1 row-span-1',
  'col-span-2 row-span-1',
];

function PaymentBanner({ event }) {
  return (
    <div className="rounded-[18px] border border-white/12 bg-white/5 p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-white/70 font-bold uppercase tracking-wide">Evento con costo</p>
        <span className="text-[22px] text-white font-black">Q{Number(event.price_gtq).toFixed(2)}</span>
      </div>
      <p className="text-[13.5px] text-white/60">
        Este evento requiere pago previo. Realiza el depósito y sube tu comprobante.
      </p>
      {/* Datos bancarios administrables (nunca un número inventado) */}
      <div className="pt-1 border-t border-white/10">
        <BankDetails />
      </div>
      {event.payment_deadline && (
        <p className="text-[12.5px] text-rose flex items-center gap-1.5">
          <Icon name="clock" className="w-3.5 h-3.5" />
          Fecha límite de pago: {new Date(event.payment_deadline + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
        </p>
      )}
    </div>
  );
}

function RSVPModal({ event, onClose }) {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ name: '', email: '', phone: '', attendee_count: 1, notes: '' });
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState('form'); // form | success | need_payment | pending_payment
  const [successMsg, setSuccessMsg] = useState('');

  const set = k => e => setForm(p => ({
    ...p,
    [k]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Nombre y correo son obligatorios'); return; }
    setLoading(true);
    try {
      const res = await apiClient.post(`/events/${event.ID}/rsvp`, form);
      const msg = res.data?.message || '¡Registro confirmado!';
      const payStatus = res.data?.registration?.payment_status;

      setSuccessMsg(msg);
      setStep(payStatus === 'pendiente' ? 'pending_payment' : 'success');
    } catch (err) {
      const status = err.response?.status;
      if (status === 402) {
        // No tiene boleta → mandar a subir comprobante
        setStep('need_payment');
      } else {
        // 409 puede ser correo duplicado O cupo lleno/insuficiente — el
        // backend ya manda el mensaje exacto en cada caso.
        toast.error(err.response?.data?.error || 'Error al registrar');
      }
    } finally { setLoading(false); }
  };

  const goToReceipt = () => {
    onClose();
    navigate(`/comprobante?event_id=${event.ID}&event=${encodeURIComponent(event.title)}`);
  };

  // ── Pantalla: éxito sin pago
  if (step === 'success') return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-4">
          <Icon name="check" className="w-7 h-7 text-white" stroke={2} />
        </div>
        <h3 className="text-[19px] text-white font-bold mb-2">¡Registro confirmado!</h3>
        <p className="text-[14px] text-white/60">{successMsg}</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-full liquid-glass text-white text-[14px] font-semibold">
          Listo
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: registrado pero pago pendiente de verificación
  if (step === 'pending_payment') return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-4">
          <Icon name="clock" className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-[19px] text-white font-bold mb-2">Registro recibido</h3>
        <p className="text-[14px] text-white/60 mb-1">Tu comprobante está pendiente de verificación.</p>
        <p className="text-[14px] text-white/60">Recibirás confirmación cuando sea aprobado.</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-full liquid-glass text-white text-[14px] font-semibold">
          Entendido
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: necesita subir boleta primero
  if (step === 'need_payment') return (
    <ModalWrapper onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-rose/15 border border-rose/25 flex items-center justify-center shrink-0">
            <Icon name="book" className="w-5 h-5 text-rose" />
          </div>
          <div>
            <h3 className="text-[16px] text-white font-bold">Comprobante requerido</h3>
            <p className="text-[13.5px] text-white/60">Debes pagar antes de registrarte.</p>
          </div>
        </div>

        <PaymentBanner event={event} />
        <p className="text-[13.5px] text-white/60">
          Después de depositar, sube la foto de tu comprobante. Una vez verificado, vuelve aquí para completar tu registro.
        </p>
        <button onClick={goToReceipt}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-full liquid-glass text-white text-[14px] font-semibold">
          <Icon name="arrow" className="w-4 h-4 -rotate-90" />
          Subir mi comprobante
        </button>
        <button onClick={() => setStep('form')}
          className="w-full h-10 rounded-full border border-white/15 text-[14px] text-white/60 hover:text-white hover:bg-white/5 transition-colors">
          Ya lo subí, intentar de nuevo
        </button>
      </div>
    </ModalWrapper>
  );

  return (
    <ModalWrapper onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] text-white font-bold uppercase tracking-wide">Confirmar asistencia</p>
          <p className="text-[13.5px] text-white/60 mt-0.5 truncate max-w-64">{event.title}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <Icon name="close" className="w-4 h-4 text-white/60" />
        </button>
      </div>
      {event.requires_payment && <PaymentBanner event={event} />}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[12px] font-bold text-white/60 mb-1">Nombre <span className="text-rose">*</span></label>
          <input value={form.name} onChange={set('name')} className={fieldCls} placeholder="Tu nombre completo" required />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-white/60 mb-1">Correo <span className="text-rose">*</span></label>
          <input type="email" value={form.email} onChange={set('email')} className={fieldCls} placeholder="El mismo correo del comprobante" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-bold text-white/60 mb-1">Teléfono</label>
            <input value={form.phone} onChange={set('phone')} className={fieldCls} placeholder="+502 …" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-white/60 mb-1">Asistentes</label>
            <input type="number" min={1} max={event.spots_remaining ?? 20} value={form.attendee_count} onChange={set('attendee_count')} className={fieldCls} />
            {event.spots_remaining != null && (
              <p className="text-[11px] text-white/40 mt-1">
                {event.spots_remaining} cupo{event.spots_remaining === 1 ? '' : 's'} disponible{event.spots_remaining === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-bold text-white/60 mb-1">Notas</label>
          <textarea rows={2} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} placeholder="¿Algo que debamos saber?" />
        </div>
        <div className="flex gap-3 pt-2 border-t border-white/10">
          <GlassButton type="submit" variant="glass" disabled={loading} className="flex-1 justify-center rounded-full">
            <Icon name="check" className="w-4 h-4" stroke={2} />
            {loading ? 'Verificando…' : event.requires_payment ? 'Verificar y registrar' : 'Confirmar asistencia'}
          </GlassButton>
          <GlassButton type="button" variant="ghost" onClick={onClose}>Cancelar</GlassButton>
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] text-white font-bold uppercase tracking-wide">Cancelar registro</p>
          <p className="text-[13.5px] text-white/60 mt-0.5 truncate max-w-64">{event.title}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <Icon name="close" className="w-4 h-4 text-white/60" />
        </button>
      </div>
      <form onSubmit={handleCancel} className="space-y-3">
        <div>
          <label className="block text-[12px] font-bold text-white/60 mb-1">Correo con el que te registraste</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={fieldCls} placeholder="tu@correo.com" required autoFocus />
        </div>
        <div className="flex gap-3 pt-2 border-t border-white/10">
          <GlassButton type="submit" variant="glass" disabled={loading} className="flex-1 justify-center rounded-full">
            {loading ? 'Cancelando…' : 'Cancelar mi registro'}
          </GlassButton>
          <GlassButton type="button" variant="ghost" onClick={onClose}>Volver</GlassButton>
        </div>
      </form>
    </ModalWrapper>
  );
}

function EventCard({ ev, i, isCarousel, onRsvp, onCancelRsvp }) {
  const nodeRef = useRef(null);
  // Antes, sin cover_image, caia a la MISMA foto stock generica en todos
  // los eventos sin foto -- se sentia repetido/falso. Ahora esos eventos
  // muestran la card entera en liquid-glass (sin foto), con un resplandor
  // ambiental detras en vez de una imagen prestada.
  const hasPhoto = Boolean(ev.cover_image);

  const d        = ev.date ? new Date(ev.date + 'T12:00:00') : null;
  const dayNum   = d ? d.getDate() : null;
  const monthStr = d ? d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() : null;
  const weekday  = d ? d.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase() : 'EVENTO';
  const details  = [ev.time, ev.location]
    .filter(Boolean)
    .map(s => s[0].toUpperCase() + s.slice(1))
    .join(' · ');
  const bentoSpan = GRID_SPANS[i % GRID_SPANS.length];

  // Sin foto la card es glass-light (blanco), con foto sigue siendo el
  // liquid-glass oscuro de siempre -- la tinta cambia con el material.
  const ink        = hasPhoto ? 'text-white'      : 'text-bg';
  const ink80      = hasPhoto ? 'text-white/80'    : 'text-bg/70';
  const ink60      = hasPhoto ? 'text-white/60'    : 'text-bg/55';
  const ink50      = hasPhoto ? 'text-white/50'    : 'text-bg/45';
  const ink40      = hasPhoto ? 'text-white/40'    : 'text-bg/40';
  const ink35      = hasPhoto ? 'text-white/35'    : 'text-bg/35';
  const wellBg     = hasPhoto ? 'bg-white/5'       : 'bg-bg/6';
  const wellBorder = hasPhoto ? 'border-white/10'  : 'border-bg/10';

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, y: 20, ...(isCarousel ? {} : { rotateX: 10, scale: 0.96 }) }}
      animate={{ opacity: 1, y: 0, ...(isCarousel ? {} : { rotateX: 0, scale: 1 }) }}
      whileHover={isCarousel ? { scale: 1.02 } : { scale: 1.03, zIndex: 20 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
      style={isCarousel ? undefined : { transformPerspective: 1000 }}
      className={`${isCarousel ? 'snap-start' : bentoSpan} w-full h-full liquid-shine relative overflow-hidden rounded-[32px] group ${hasPhoto ? 'border border-white/10' : 'glass-light'} ${isCarousel ? 'shadow-card-lg' : ''} transition-shadow`}
    >

      {hasPhoto && (
        <>
          {/* Flyer de fondo */}
          <img src={ev.cover_image} alt={ev.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80" />
          {/* Gradiente para leer el texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent opacity-100" />
        </>
      )}

      {/* Etiqueta de próximo evento si es el primero */}
      {i === 0 && (
        <div className="absolute top-6 left-6 z-20">
          <span className="liquid-glass px-4 py-1.5 rounded-full text-white text-[12px] font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
            Próximo evento
          </span>
        </div>
      )}

      {/* Contenido (Liquid Glass Panel) */}
      <div className={hasPhoto
        ? 'absolute bottom-0 left-0 right-0 z-20 p-5'
        : 'relative z-20 h-full flex flex-col justify-end p-5'
      }>
        <div className={`${hasPhoto ? 'liquid-glass bg-white/5 border border-white/10 backdrop-blur-2xl p-5' : ''} rounded-[24px] flex flex-col gap-4`}>

          <div className="flex items-center gap-4 w-full min-w-0">
            {/* Fecha */}
            {dayNum && (
              <div className={`text-center shrink-0 flex flex-col items-center justify-center rounded-2xl ${wellBg} border ${wellBorder} shadow-inner w-[60px] h-[60px]`}>
                <div className={`font-black leading-none ${ink} tracking-tighter text-[24px]`}>
                  {dayNum}
                </div>
                <div className={`font-bold tracking-[2px] mt-1 ${ink50} text-[9px]`}>
                  {monthStr}
                </div>
              </div>
            )}

            {/* Detalles */}
            <div className="min-w-0 flex-1">
              <p className={`font-mono text-[10px] tracking-[1.5px] ${ink40} uppercase mb-1`}>
                {weekday}
              </p>
              <h3 className={`font-bold tracking-tight ${ink} line-clamp-1 text-[20px] leading-tight`}>
                {ev.title}
              </h3>
            </div>
          </div>

          {details && (
            <p className={`truncate ${ink60} flex items-center gap-1.5 text-[13px]`}>
              <Icon name="pin" className={`w-3.5 h-3.5 ${ink40} shrink-0`} />
              {details}
            </p>
          )}

          <div className={`shrink-0 flex flex-col gap-3 w-full pt-3 border-t ${wellBorder}`}>
            {(ev.requires_payment || ev.spots_remaining != null) && (
              <div className="flex flex-wrap gap-2">
                {ev.requires_payment && (
                  <span className={`font-bold text-[12px] ${ink80} flex items-center gap-1.5 px-3 py-1 ${wellBg} rounded-full border ${wellBorder} w-fit`}>
                    Q{Number(ev.price_gtq).toFixed(0)}
                  </span>
                )}
                {ev.spots_remaining != null && (
                  <span className={`font-bold text-[12px] flex items-center gap-1.5 px-3 py-1 rounded-full border w-fit ${
                    ev.is_full ? 'text-rose bg-rose/10 border-rose/25' : `${ink80} ${wellBg} ${wellBorder}`
                  }`}>
                    {ev.is_full ? 'Cupo lleno' : `${ev.spots_remaining} cupo${ev.spots_remaining === 1 ? '' : 's'} disponible${ev.spots_remaining === 1 ? '' : 's'}`}
                  </span>
                )}
              </div>
            )}
            <motion.button
              whileHover={ev.is_full ? undefined : { scale: 1.03 }}
              whileTap={ev.is_full ? undefined : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => !ev.is_full && onRsvp(ev)}
              disabled={ev.is_full}
              className={`rounded-full text-[14px] font-bold inline-flex items-center justify-center gap-3 group/btn w-full py-3 ${
                ev.is_full
                  ? `${wellBg} border ${wellBorder} ${ink40} cursor-not-allowed`
                  : hasPhoto
                    ? 'liquid-glass text-white hover:border-white/30'
                    : 'bg-white text-bg shadow-card hover:opacity-90'
              }`}
            >
              {ev.is_full ? 'Cupo lleno' : ev.requires_payment ? 'Registrarme' : 'Confirmar'}
              {!ev.is_full && <Icon name="arrow" className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" stroke={2} />}
            </motion.button>
            <button
              type="button"
              onClick={() => onCancelRsvp(ev)}
              className={`${ink35} ${hasPhoto ? 'hover:text-white/60' : 'hover:text-bg/60'} text-[11.5px] font-medium transition-colors self-center`}
            >
              ¿Ya te registraste? Cancelar mi registro
            </button>
          </div>

        </div>
      </div>

    </motion.div>
  );
}

function ModalWrapper({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="liquid-glass border border-white/20 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto rounded-[32px] text-white"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const heroImg = useSitePhoto('hero_eventos', '/images/bg-eventos.jpg');
  const [events, setEvents] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // States para modales/interacción
  const [rsvpEvent, setRsvpEvent] = useState(null);
  const [cancelEvent, setCancelEvent] = useState(null);
  const [viewMode, setViewMode] = useState('carousel');
  const [openFaq, setOpenFaq] = useState(null);

  // Referencias para el carrusel
  const scrollRef = useRef(null);

  const scrollContainer = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
    <main className="min-h-[100svh] bg-bg relative overflow-hidden flex flex-col">
      <ParallaxImg src={heroImg} alt="Eventos" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg" />

      <div className="relative z-10 pt-40 pb-12 px-6 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        <Reveal>
          <Eyebrow>Agenda</Eyebrow>
          <h1 className="display-mega text-white mb-4 mt-4" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>EVENTOS</h1>
          <p className="text-[18px] text-white/70 max-w-2xl mx-auto font-medium mb-10">
            Conéctate con nuestra comunidad en persona. Encuentra tu lugar, adora y crece con nosotros.
          </p>

          {events.length > 0 && (
            <div className="w-full flex justify-center">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={() => setViewMode(v => v === 'carousel' ? 'grid' : 'carousel')}
                className="liquid-glass px-4 py-2 rounded-full text-white/70 hover:text-white text-[13px] font-bold transition-colors flex items-center gap-2"
              >
                <Icon name={viewMode === 'carousel' ? 'search' : 'calendar'} className="w-4 h-4" />
                {viewMode === 'carousel' ? 'Vista en cuadrícula' : 'Vista en carrusel'}
              </motion.button>
            </div>
          )}
        </Reveal>
      </div>

      <motion.div layout className={`relative z-10 mx-auto pb-32 w-full flex-1 ${viewMode === 'carousel' ? 'max-w-none pl-6 md:pl-12' : 'max-w-7xl px-6'}`}>
        {events.length === 0 ? (
          /* ── Empty state ── */
          <div className="py-32 flex flex-col items-center gap-5">
            <p className="font-mono text-[11px] tracking-[2px] text-white/40 uppercase">Próximos eventos</p>
            <p className="font-bold leading-[1.05] tracking-[-0.02em] text-center whitespace-pre-line text-white/50"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              {'Sin eventos\npublicados aún.'}
            </p>
            <p className="text-white/40 text-[16px]">Vuelve pronto — publicamos nuevos eventos cada semana.</p>
          </div>
        ) : (
          /* ── Contenedor de Eventos ── */
          <motion.div ref={scrollRef} layout className={viewMode === 'carousel'
            ? "grid grid-flow-col grid-rows-[repeat(2,350px)] sm:grid-rows-[repeat(2,380px)] auto-cols-[300px] sm:auto-cols-[340px] gap-5 overflow-x-auto snap-x snap-mandatory pb-12 pr-6 md:pr-12 hide-scrollbar"
            : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[230px] sm:auto-rows-[250px] gap-5 [grid-auto-flow:dense]"
          }
          style={viewMode === 'carousel' ? { scrollPadding: '1.5rem', scrollbarWidth: 'none' } : {}}>

            <AnimatePresence>
            {events.map((ev, i) => (
              <EventCard key={`${ev.ID}-${viewMode}`} ev={ev} i={i} isCarousel={viewMode === 'carousel'} onRsvp={setRsvpEvent} onCancelRsvp={setCancelEvent} />
            ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Botones de navegación del carrusel (solo visibles en modo carrusel) */}
      {viewMode === 'carousel' && events.length > 0 && (
        <div className="relative z-10 flex justify-center gap-4 pb-20">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => scrollContainer('left')}
            className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-white/70 hover:text-white"
          >
            <Icon name="arrow" className="w-5 h-5 rotate-180" stroke={2} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => scrollContainer('right')}
            className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-white/70 hover:text-white"
          >
            <Icon name="arrow" className="w-5 h-5" stroke={2} />
          </motion.button>
        </div>
      )}

      {/* Secciones dinámicas: FAQs */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-32 border-t border-white/5 pt-20 mt-10">

        {/* FAQs */}
        {faqs.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <Reveal className="text-center mb-10">
              <Eyebrow>Ayuda</Eyebrow>
              <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>Preguntas frecuentes</h2>
              <p className="text-white/60 mt-4 max-w-2xl mx-auto">Todo lo que necesitas saber antes de asistir a nuestros eventos.</p>
            </Reveal>

            <RevealList className="space-y-3">
              {faqs.map(faq => (
                <RevealItem key={faq.ID} depth>
                <Tilt max={3} glass="standard" className="glass-light rounded-[20px] overflow-hidden block">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.ID ? null : faq.ID)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between group cursor-pointer"
                  >
                    <span className="text-bg font-semibold pr-4">{faq.question}</span>
                    <motion.span
                      animate={{ rotate: openFaq === faq.ID ? 90 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className="w-9 h-9 rounded-full bg-bg/6 border border-bg/12 flex items-center justify-center text-bg shrink-0"
                    >
                      <Icon name="arrow" className="w-4 h-4" />
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
                        <div className="px-6 pb-5 pt-0 text-bg/60 text-[15px] leading-relaxed border-t border-bg/10 mt-2">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Tilt>
                </RevealItem>
              ))}
            </RevealList>
          </div>
        )}
      </div>

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

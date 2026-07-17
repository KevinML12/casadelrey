import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';
import { useBankInfo } from '../../components/sections/BankDetails';
import { useSitePhoto } from '../../lib/feed';

// El modal de RSVP es glass-light (blanco/translucido) -- .input-light es
// el mismo campo claro del panel admin/VolunteeringPage, funciona igual
// de bien aca. btnPrimary/btnGhost reemplazan a GlassButton (esa es
// oscura/liquid-glass, pensada para el fondo navy del sitio publico).
const btnPrimary = 'flex-1 justify-center inline-flex items-center gap-2 rounded-full bg-bg text-white text-[14px] font-bold px-5 py-3 shadow-card hover:opacity-90 disabled:opacity-50 transition-opacity';
const btnGhost = 'inline-flex items-center justify-center gap-2 rounded-full text-bg/55 hover:text-bg hover:bg-bg/5 text-[14px] font-semibold px-5 py-3 transition-colors';

// Collage estilo Galería para la vista de cuadrícula: variedad de tamaños
// para TODOS los eventos (no solo el primero), con [grid-auto-flow:dense]
// en el contenedor para que no queden huecos. Ver GalleryPage.jsx (SPANS/ROT).
const GRID_SPANS = [
  'col-span-2 row-span-2',
  'col-span-2 sm:col-span-1 row-span-1',
  'col-span-2 sm:col-span-1 row-span-1',
  'col-span-2 row-span-1',
];

// BankDetails.jsx es texto blanco a proposito -- lo comparten Donar y
// Comprobante, paginas oscuras. Aca el modal es claro, asi que se
// reusa solo el hook (useBankInfo) y se renderiza con tinta navy en
// vez de tocar el componente compartido.
function LightBankDetails() {
  const { hasAccount, rows, whatsapp } = useBankInfo();

  if (!hasAccount) {
    const href = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : '/conectate';
    return (
      <a
        href={href}
        {...(whatsapp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="flex items-center justify-between gap-3 rounded-[14px] bg-bg/5 border border-bg/10 px-4 py-4 hover:bg-bg/10 transition-colors focus-ring"
      >
        <div className="text-left min-w-0">
          <p className="text-[14px] font-bold text-bg">Escríbenos para coordinar tu depósito</p>
          <p className="text-[12.5px] text-bg/55 mt-1">Te compartimos los datos bancarios al momento</p>
        </div>
        <Icon name="arrow" className="w-4 h-4 text-bg/35 shrink-0" stroke={2} />
      </a>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between rounded-[12px] bg-bg/5 px-4 py-3 border border-bg/10">
          <span className="text-[12.5px] font-semibold text-bg/60">{label}</span>
          <span className="text-[14.5px] font-bold text-bg">{value}</span>
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
function PaymentBanner({ event }) {
  return (
    <div className="glass-light-nested rounded-[20px] p-5 space-y-4 mb-4">
      <div>
        <p className="text-[11px] font-bold text-bg/50 uppercase tracking-widest mb-1.5">Evento con costo</p>
        <p className="text-[30px] text-bg font-black leading-none tracking-tight">Q{Number(event.price_gtq).toFixed(2)}</p>
      </div>
      <p className="text-[13.5px] text-bg/60 leading-relaxed">
        Este evento requiere pago previo. Realiza el depósito y sube tu comprobante.
      </p>
      {/* Datos bancarios administrables (nunca un número inventado) */}
      <div className="pt-1 border-t border-bg/10">
        <LightBankDetails />
      </div>
      {event.payment_deadline && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose/10 border border-rose/20 text-rose text-[12px] font-bold w-fit">
          <Icon name="clock" className="w-3.5 h-3.5" />
          Fecha límite: {new Date(event.payment_deadline + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
        </span>
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
        <div className="w-16 h-16 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mx-auto mb-4">
          <Icon name="check" className="w-7 h-7 text-bg" stroke={2} />
        </div>
        <h3 className="text-[19px] text-bg font-bold mb-2">¡Registro confirmado!</h3>
        <p className="text-[14px] text-bg/60">{successMsg}</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-full bg-bg text-white text-[14px] font-semibold shadow-card hover:opacity-90">
          Listo
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: registrado pero pago pendiente de verificación
  if (step === 'pending_payment') return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mx-auto mb-4">
          <Icon name="clock" className="w-7 h-7 text-bg" />
        </div>
        <h3 className="text-[19px] text-bg font-bold mb-2">Registro recibido</h3>
        <p className="text-[14px] text-bg/60 mb-1">Tu comprobante está pendiente de verificación.</p>
        <p className="text-[14px] text-bg/60">Recibirás confirmación cuando sea aprobado.</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-full bg-bg text-white text-[14px] font-semibold shadow-card hover:opacity-90">
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
            <h3 className="text-[16px] text-bg font-bold">Comprobante requerido</h3>
            <p className="text-[13.5px] text-bg/60">Debes pagar antes de registrarte.</p>
          </div>
        </div>

        <PaymentBanner event={event} />
        <p className="text-[13.5px] text-bg/60">
          Después de depositar, sube la foto de tu comprobante. Una vez verificado, vuelve aquí para completar tu registro.
        </p>
        <button onClick={goToReceipt}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-bg text-white text-[14px] font-semibold shadow-card hover:opacity-90">
          <Icon name="arrow" className="w-4 h-4 -rotate-90" />
          Subir mi comprobante
        </button>
        <button onClick={() => setStep('form')}
          className="w-full h-10 rounded-full border border-bg/15 text-[14px] text-bg/60 hover:text-bg hover:bg-bg/5 transition-colors">
          Ya lo subí, intentar de nuevo
        </button>
      </div>
    </ModalWrapper>
  );

  return (
    <ModalWrapper onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] text-bg font-bold uppercase tracking-wide">Confirmar asistencia</p>
          <p className="text-[13.5px] text-bg/60 mt-0.5 truncate max-w-64">{event.title}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center hover:bg-bg/15 transition-colors">
          <Icon name="close" className="w-4 h-4 text-bg/60" />
        </button>
      </div>
      {event.requires_payment && <PaymentBanner event={event} />}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[12px] font-bold text-bg/60 mb-1">Nombre <span className="text-rose">*</span></label>
          <input value={form.name} onChange={set('name')} className="input-light" placeholder="Tu nombre completo" required />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-bg/60 mb-1">Correo <span className="text-rose">*</span></label>
          <input type="email" value={form.email} onChange={set('email')} className="input-light" placeholder="El mismo correo del comprobante" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-bold text-bg/60 mb-1">Teléfono</label>
            <input value={form.phone} onChange={set('phone')} className="input-light" placeholder="+502 …" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-bg/60 mb-1">Asistentes</label>
            <input type="number" min={1} max={event.spots_remaining ?? 20} value={form.attendee_count} onChange={set('attendee_count')} className="input-light" />
            {event.spots_remaining != null && (
              <p className="text-[11px] text-bg/40 mt-1">
                {event.spots_remaining} cupo{event.spots_remaining === 1 ? '' : 's'} disponible{event.spots_remaining === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-bold text-bg/60 mb-1">Notas</label>
          <textarea rows={2} value={form.notes} onChange={set('notes')} className="input-light resize-none" placeholder="¿Algo que debamos saber?" />
        </div>
        <div className="flex gap-3 pt-2 border-t border-bg/10">
          <button type="submit" disabled={loading} className={btnPrimary}>
            <Icon name="check" className="w-4 h-4" stroke={2} />
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] text-bg font-bold uppercase tracking-wide">Cancelar registro</p>
          <p className="text-[13.5px] text-bg/60 mt-0.5 truncate max-w-64">{event.title}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center hover:bg-bg/15 transition-colors">
          <Icon name="close" className="w-4 h-4 text-bg/60" />
        </button>
      </div>
      <form onSubmit={handleCancel} className="space-y-3">
        <div>
          <label className="block text-[12px] font-bold text-bg/60 mb-1">Correo con el que te registraste</label>
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

function EventCard({ ev, i, onRsvp, onCancelRsvp }) {
  const nodeRef = useRef(null);
  // Antes, sin cover_image, la card caia a glass-light (blanco/tinta navy) --
  // mezclada con las cards CON foto (liquid-glass oscuro) en el mismo grid,
  // se leian como dos estilos distintos sin motivo real (glass-light es
  // para UN acento por pagina, no un material repetido). Ahora TODA card
  // es liquid-glass -- con o sin foto -- y lo que de verdad se clasifica
  // visualmente es gratis vs. pagado (badge), no si el admin subio flyer.
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

  // Tinta blanca siempre -- todas las cards son liquid-glass oscuro ahora.
  const ink        = 'text-white';
  const ink80      = 'text-white/80';
  const ink60      = 'text-white/60';
  const ink50      = 'text-white/50';
  const ink40      = 'text-white/40';
  const ink35      = 'text-white/35';
  const wellBg     = 'bg-white/5';
  const wellBorder = 'border-white/10';

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, y: 20, rotateX: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      whileHover={{ scale: 1.03, zIndex: 20 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
      style={{ transformPerspective: 1000 }}
      className={`${bentoSpan} w-full h-full liquid-shine relative overflow-hidden rounded-[32px] group ${hasPhoto ? 'border border-white/10' : 'liquid-glass'} transition-shadow`}
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
            {/* Gratis vs. pagado: la clasificación real de la card, siempre visible */}
            <div className="flex flex-wrap gap-2">
              {ev.requires_payment ? (
                <span className={`font-bold text-[12px] ${ink80} flex items-center gap-1.5 px-3 py-1 ${wellBg} rounded-full border ${wellBorder} w-fit`}>
                  Q{Number(ev.price_gtq).toFixed(0)}
                </span>
              ) : (
                <span className={`font-bold text-[12px] ${ink80} flex items-center gap-1.5 px-3 py-1 ${wellBg} rounded-full border ${wellBorder} w-fit`}>
                  Gratis
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
            <motion.button
              whileHover={ev.is_full ? undefined : { scale: 1.03 }}
              whileTap={ev.is_full ? undefined : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => !ev.is_full && onRsvp(ev)}
              disabled={ev.is_full}
              className={`rounded-full text-[14px] font-bold inline-flex items-center justify-center gap-3 group/btn w-full py-3 ${
                ev.is_full
                  ? `${wellBg} border ${wellBorder} ${ink40} cursor-not-allowed`
                  : 'liquid-glass text-white hover:border-white/30'
              }`}
            >
              {ev.is_full ? 'Cupo lleno' : ev.requires_payment ? 'Registrarme' : 'Confirmar'}
              {!ev.is_full && <Icon name="arrow" className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" stroke={2} />}
            </motion.button>
            <button
              type="button"
              onClick={() => onCancelRsvp(ev)}
              className={`${ink35} hover:text-white/60 text-[11.5px] font-medium transition-colors self-center`}
            >
              ¿Ya te registraste? Cancelar mi registro
            </button>
          </div>

        </div>
      </div>

    </motion.div>
  );
}

// Card compacta para eventos que ya pasaron -- sin RSVP (no tiene sentido
// registrarse a un evento que ya ocurrio), sin badge de precio/cupo, mas
// pequeña y con menos peso visual que las cards de proximos eventos.
function PastEventCard({ ev }) {
  const d        = ev.date ? new Date(ev.date + 'T12:00:00') : null;
  const dayNum   = d ? d.getDate() : null;
  const monthStr = d ? d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() : null;
  const details  = [ev.time, ev.location]
    .filter(Boolean)
    .map(s => s[0].toUpperCase() + s.slice(1))
    .join(' · ');

  return (
    <div className="liquid-glass rounded-[20px] p-4 flex items-center gap-4">
      {dayNum && (
        <div className="text-center shrink-0 flex flex-col items-center justify-center rounded-xl bg-white/5 border border-white/10 w-12 h-12">
          <div className="font-black leading-none text-white/70 text-[16px]">{dayNum}</div>
          <div className="font-bold tracking-[1.5px] text-white/40 text-[7px]">{monthStr}</div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-white/70 text-[14.5px] tracking-tight line-clamp-1">{ev.title}</h4>
        {details && <p className="text-white/40 text-[12px] truncate mt-0.5">{details}</p>}
      </div>
    </div>
  );
}

function ModalWrapper({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-light w-full max-w-md p-6 max-h-[90vh] overflow-y-auto rounded-[32px] text-bg"
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
    <main className="min-h-[100svh] bg-bg relative overflow-hidden flex flex-col">
      <ParallaxImg src={heroImg} alt="Eventos" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg" />

      <div className="relative z-10 pt-40 pb-12 px-6 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        <Reveal>
          <Eyebrow>Agenda</Eyebrow>
          <h1 className="display-mega text-white mb-4 mt-4" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>EVENTOS</h1>
          <p className="text-[18px] text-white/70 max-w-2xl mx-auto font-medium mb-2">
            Conéctate con nuestra comunidad en persona. Encuentra tu lugar, adora y crece con nosotros.
          </p>
        </Reveal>
      </div>

      <div className="relative z-10 mx-auto pb-20 w-full flex-1 max-w-7xl px-6">
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
        ) : upcomingEvents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/50 font-bold text-[20px]">No hay próximos eventos por ahora.</p>
            <p className="text-white/40 text-[15px] mt-2">Revisa los eventos pasados más abajo.</p>
          </div>
        ) : (
          /* ── Cuadrícula de próximos eventos ── */
          <AnimatePresence>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[230px] sm:auto-rows-[250px] gap-5 [grid-auto-flow:dense]">
              {upcomingEvents.map((ev, i) => (
                <EventCard key={ev.ID} ev={ev} i={i} onRsvp={setRsvpEvent} onCancelRsvp={setCancelEvent} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* ── Eventos pasados: compactos, sin RSVP, mas recientes primero ── */}
        {pastEvents.length > 0 && (
          <div className="mt-16 pt-12 border-t border-white/5">
            <Reveal className="mb-6">
              <p className="text-[13px] font-bold text-white/40 uppercase tracking-tightish">Eventos pasados</p>
            </Reveal>
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

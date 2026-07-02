import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../../components/layout/PageHero';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

const MOCK_EVENTS_FALLBACK = [
  { ID: 1, title: 'Noche de Jóvenes', date: '2026-08-15', time: '19:30', location: 'Auditorio Central', requires_payment: false },
  { ID: 2, title: 'Encuentro de Líderes', date: '2026-08-18', time: '18:00', location: 'Salón 2', requires_payment: false },
  { ID: 3, title: 'Retiro "Reinicio"', date: '2026-08-23', time: '08:00', location: 'Casa de campo', requires_payment: true, price_gtq: 150, payment_deadline: '2026-08-20' },
  { ID: 4, title: 'Servicio General', date: '2026-08-24', time: '10:00', location: 'Auditorio Central', requires_payment: false }
];

// Datos bancarios de la iglesia (centralizado)
const BANK_INFO = [
  { label: 'Banco',      value: 'Banrural' },
  { label: 'Cuenta',     value: '3061234567890' },
  { label: 'A nombre de',value: 'Iglesia Casa del Rey' },
  { label: 'Tigo Money', value: '+502 4760-0636' },
];

function PaymentBanner({ event }) {
  return (
    <div className="rounded-2xl border border-outline-var bg-surf-low p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Evento con costo</p>
        <span className="text-headline-s text-on-surf font-black">Q{Number(event.price_gtq).toFixed(2)}</span>
      </div>
      <p className="text-body-s text-on-surf-var">
        Este evento requiere pago previo. Realiza el depósito y sube tu comprobante.
      </p>
      <div className="space-y-1.5 pt-1 border-t border-outline-var">
        {BANK_INFO.map(({ label, value }) => (
          <div key={label} className="flex gap-2 text-body-s">
            <span className="text-on-surf-var w-24 shrink-0">{label}</span>
            <span className="text-on-surf font-semibold">{value}</span>
          </div>
        ))}
      </div>
      {event.payment_deadline && (
        <p className="text-label-s text-err flex items-center gap-1">
          <span className="ms" style={{ fontSize: 14 }}>schedule</span>
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
      } else if (status === 409) {
        toast.error('Ya estás registrado en este evento con ese correo.');
      } else {
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
      <div className="text-center py-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ter-con flex items-center justify-center mx-auto mb-4">
          <span className="ms text-on-ter-con" style={{ fontSize: 32 }}>check_circle</span>
        </div>
        <h3 className="text-title-l text-on-surf font-bold mb-2">¡Registro confirmado!</h3>
        <p className="text-body-s text-on-surf-var">{successMsg}</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity">
          Listo
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: registrado pero pago pendiente de verificación
  if (step === 'pending_payment') return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center py-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-pri-con flex items-center justify-center mx-auto mb-4">
          <span className="ms text-on-pri-con" style={{ fontSize: 32 }}>schedule</span>
        </div>
        <h3 className="text-title-l text-on-surf font-bold mb-2">Registro recibido</h3>
        <p className="text-body-s text-on-surf-var mb-1">Tu comprobante está pendiente de verificación.</p>
        <p className="text-body-s text-on-surf-var">Recibirás confirmación cuando sea aprobado.</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity">
          Entendido
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Pantalla: necesita subir boleta primero
  if (step === 'need_payment') return (
    <ModalWrapper onClose={onClose}>
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-err-con flex items-center justify-center shrink-0">
            <span className="ms text-err" style={{ fontSize: 20 }}>receipt_long</span>
          </div>
          <div>
            <h3 className="text-title-s text-on-surf font-bold">Comprobante requerido</h3>
            <p className="text-body-s text-on-surf-var">Debes pagar antes de registrarte.</p>
          </div>
        </div>

        <PaymentBanner event={event} />

        <p className="text-body-s text-on-surf-var">
          Después de depositar, sube la foto de tu comprobante. Una vez verificado, vuelve aquí para completar tu registro.
        </p>

        <button onClick={goToReceipt}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity">
          <span className="ms" style={{ fontSize: 16 }}>upload</span>
          Subir mi comprobante
        </button>
        <button onClick={() => setStep('form')}
          className="w-full h-10 rounded-xl border border-outline-var text-label-l text-on-surf-var hover:bg-surf-dim transition-colors">
          Ya lo subí, intentar de nuevo
        </button>
      </div>
    </ModalWrapper>
  );

  // ── Formulario principal
  return (
    <ModalWrapper onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-label-l text-white font-semibold uppercase tracking-widest">Confirmar asistencia</p>
          <p className="text-body-s text-white/60 mt-0.5 truncate max-w-64">{event.title}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <span className="ms text-white/60" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>

      {/* Banner de pago si aplica */}
      {event.requires_payment && <PaymentBanner event={event} />}

      {event.requires_payment && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-white/10 border border-white/20 flex items-start gap-2">
          <span className="ms text-white shrink-0" style={{ fontSize: 16 }}>info</span>
          <p className="text-body-s text-white/90">
            Si ya realizaste el depósito y subiste tu comprobante, ingresa el mismo correo que usaste al subirlo.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-label-l text-white/60 mb-1">Nombre <span className="text-rose">*</span></label>
          <input value={form.name} onChange={set('name')} className={fieldCls} placeholder="Tu nombre completo" required />
        </div>
        <div>
          <label className="block text-label-l text-white/60 mb-1">Correo <span className="text-rose">*</span></label>
          <input type="email" value={form.email} onChange={set('email')} className={fieldCls} placeholder="El mismo correo del comprobante" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-label-l text-white/60 mb-1">Teléfono</label>
            <input value={form.phone} onChange={set('phone')} className={fieldCls} placeholder="+502 …" />
          </div>
          <div>
            <label className="block text-label-l text-white/60 mb-1">Asistentes</label>
            <input type="number" min={1} max={20} value={form.attendee_count} onChange={set('attendee_count')} className={fieldCls} />
          </div>
        </div>
        <div>
          <label className="block text-label-l text-white/60 mb-1">Notas</label>
          <textarea rows={2} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} placeholder="¿Algo que debamos saber?" />
        </div>
        <div className="flex gap-3 pt-2 border-t border-white/10">
          <Button type="submit" variant="glass" disabled={loading} className="flex-1 justify-center rounded-full">
            <span className="ms" style={{ fontSize: 16 }}>check_circle</span>
            {loading ? 'Verificando…' : event.requires_payment ? 'Verificar y registrar' : 'Confirmar asistencia'}
          </Button>
          <Button type="button" variant="text" onClick={onClose} className="text-white/60 hover:text-white">Cancelar</Button>
        </div>
      </form>
    </ModalWrapper>
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
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState(null);

  useEffect(() => {
    apiClient.get('/events/')
      .then(r => setEvents(r.data || []))
      .catch(err => { console.error(err); setEvents(MOCK_EVENTS_FALLBACK); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[100svh] bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-celeste animate-spin" />
    </div>
  );

  return (
    <main className="min-h-[100svh] bg-bg relative overflow-hidden flex flex-col">
      {/* Background & Blobs */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-celeste/20 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-rose/20 rounded-full mix-blend-screen filter blur-[150px] opacity-50 animate-blob" style={{ animationDelay: '2s' }} />
      
      <img src="/images/bg-eventos.jpg" alt="Eventos" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/10" />

      {/* Hero Section */}
      <div className="relative z-10 pt-32 pb-12 px-6 max-w-4xl mx-auto w-full text-center">
        <h1 className="display-mega text-white mb-4" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>PRÓXIMOS EVENTOS</h1>
        <p className="text-[18px] text-white/70 max-w-2xl mx-auto font-medium">
          Conéctate con nuestra comunidad en persona. Encuentra tu lugar, adora y crece con nosotros.
        </p>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-32 w-full flex-1">

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
          /* ── Lista de Eventos ── */
          <div className="flex flex-col gap-6">
            {events.map((ev, i) => {
              const d        = ev.date ? new Date(ev.date + 'T12:00:00') : null;
              const dayNum   = d ? d.getDate() : null;
              const monthStr = d ? d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() : null;
              const weekday  = d ? d.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase() : 'EVENTO';
              const details  = [ev.time, ev.location]
                .filter(Boolean)
                .map(s => s[0].toUpperCase() + s.slice(1))
                .join(' · ');

              return (
                <div key={ev.ID} className="liquid-glass rounded-[32px] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-white/5 transition-colors card-spring">
                  
                  {/* Info e Ícono */}
                  <div className="flex items-center gap-6 md:gap-8 min-w-0 flex-1 w-full">
                    
                    {/* Fecha */}
                    {dayNum ? (
                      <div className="text-center shrink-0 w-[72px]">
                        <div className="font-black leading-none text-white tracking-tighter" style={{ fontSize: 48 }}>
                          {dayNum}
                        </div>
                        <div className="font-bold tracking-[2px] mt-2 text-white/50 text-[11px]">
                          {monthStr}
                        </div>
                      </div>
                    ) : (
                      <div className="w-[72px] shrink-0" />
                    )}

                    <div className="w-px h-16 shrink-0 bg-white/10 hidden sm:block" />

                    {/* Detalles */}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] tracking-[1.2px] mb-2 text-white/60 uppercase">
                        {weekday}
                      </p>
                      <p className="font-bold truncate tracking-[-0.02em] text-white"
                        style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}>
                        {ev.title}
                      </p>
                      {details && (
                        <p className="text-[15px] mt-1.5 truncate text-white/70">
                          {details}
                        </p>
                      )}
                      {ev.description && (
                        <p className="text-[14px] mt-2 line-clamp-2 text-white/50 hidden md:block leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botón CTA */}
                  <div className="shrink-0 flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-white/5 sm:border-t-0">
                    {ev.requires_payment && (
                      <span className="font-bold text-[14px] font-mono text-emerald tracking-wider">
                        Q{Number(ev.price_gtq).toFixed(0)}
                      </span>
                    )}
                    <button
                      onClick={() => setRsvpEvent(ev)}
                      className="px-6 py-3.5 rounded-full liquid-glass text-white text-[14px] font-bold hover:bg-white/10 hover:border-white/40 transition-all btn-spring w-full sm:w-auto inline-flex items-center justify-center sm:justify-between gap-4"
                    >
                      {ev.requires_payment ? 'Registrarme' : 'Confirmar'}
                      <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {rsvpEvent && <RSVPModal event={rsvpEvent} onClose={() => setRsvpEvent(null)} />}
    </main>
  );
}

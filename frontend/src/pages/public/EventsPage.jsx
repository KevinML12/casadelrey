import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../../components/layout/PageHero';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

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
          <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Confirmar asistencia</p>
          <p className="text-body-s text-on-surf-var mt-0.5 truncate max-w-64">{event.title}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-surf-high flex items-center justify-center hover:bg-outline-var transition-colors">
          <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>

      {/* Banner de pago si aplica */}
      {event.requires_payment && <PaymentBanner event={event} />}

      {event.requires_payment && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-pri-con flex items-start gap-2">
          <span className="ms text-on-pri-con shrink-0" style={{ fontSize: 16 }}>info</span>
          <p className="text-body-s text-on-pri-con">
            Si ya realizaste el depósito y subiste tu comprobante, ingresa el mismo correo que usaste al subirlo.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-label-l text-on-surf-var mb-1">Nombre <span className="text-err">*</span></label>
          <input value={form.name} onChange={set('name')} className={fieldCls} placeholder="Tu nombre completo" required />
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1">Correo <span className="text-err">*</span></label>
          <input type="email" value={form.email} onChange={set('email')} className={fieldCls} placeholder="El mismo correo del comprobante" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-label-l text-on-surf-var mb-1">Teléfono</label>
            <input value={form.phone} onChange={set('phone')} className={fieldCls} placeholder="+502 …" />
          </div>
          <div>
            <label className="block text-label-l text-on-surf-var mb-1">Asistentes</label>
            <input type="number" min={1} max={20} value={form.attendee_count} onChange={set('attendee_count')} className={fieldCls} />
          </div>
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1">Notas</label>
          <textarea rows={2} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} placeholder="¿Algo que debamos saber?" />
        </div>
        <div className="flex gap-3 pt-2 border-t border-outline-var">
          <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
            <span className="ms" style={{ fontSize: 16 }}>check_circle</span>
            {loading ? 'Verificando…' : event.requires_payment ? 'Verificar y registrar' : 'Confirmar asistencia'}
          </Button>
          <Button type="button" variant="outlined" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.094)' }}
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
      .catch(err => { console.error(err); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-surf flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-surf">
      <PageHero icon="calendar_month" title="Eventos y Cultos" subtitle="Conéctate con nuestra comunidad en persona." />

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {error ? (
          <div className="text-center py-24">
            <p className="text-body-m text-on-surf-var">No se pudo conectar con el servidor.</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24">
            <div className="leading-icon mx-auto mb-4" style={{ width: 56, height: 56 }}>
              <span className="ms" style={{ fontSize: 32 }}>calendar_month</span>
            </div>
            <h3 className="text-title-l text-on-surf font-bold mb-2">Sin eventos próximos</h3>
            <p className="text-body-m text-on-surf-var">Pronto publicaremos nuevos eventos. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(ev => {
              const dayNum   = ev.date ? new Date(ev.date + 'T12:00').getDate() : '';
              const monthStr = ev.date
                ? new Date(ev.date + 'T12:00').toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
                : '';
              const weekday  = ev.date
                ? new Date(ev.date + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long' })
                : '';

              return (
                <div
                  key={ev.ID}
                  className="flex flex-col overflow-hidden transition-shadow duration-200"
                  style={{ borderRadius: 28, background: '#FFFFFF', boxShadow: '0 2px 8px rgba(13,27,75,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 25px rgba(13,27,75,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,27,75,0.06)'; }}
                >
                  {/* Área superior: fecha destacada */}
                  <div
                    className="flex flex-col items-center justify-center relative"
                    style={{ height: 220, background: '#0D1B4B', borderRadius: '28px 28px 0 0' }}
                  >
                    {dayNum && (
                      <>
                        <span
                          className="text-white font-black leading-none"
                          style={{ fontSize: 72 }}
                        >
                          {dayNum}
                        </span>
                        <span
                          className="text-white font-semibold"
                          style={{ fontSize: 13, letterSpacing: 2, opacity: 0.65, marginTop: 6 }}
                        >
                          {monthStr}
                        </span>
                        {weekday && (
                          <span
                            className="text-white"
                            style={{ fontSize: 12, opacity: 0.45, marginTop: 4 }}
                          >
                            {weekday}
                          </span>
                        )}
                      </>
                    )}
                    {ev.requires_payment && (
                      <div
                        className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-white font-bold"
                        style={{ background: '#7C3AED', fontSize: 13 }}
                      >
                        Q{Number(ev.price_gtq).toFixed(0)}
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex flex-col flex-1 gap-2" style={{ padding: '20px 24px' }}>
                    <h3 className="font-bold leading-snug" style={{ fontSize: 16, color: '#050505' }}>
                      {ev.title}
                    </h3>
                    {ev.location && (
                      <div className="flex items-center gap-2" style={{ color: '#525B7A', fontSize: 13 }}>
                        <span className="ms shrink-0" style={{ fontSize: 15 }}>location_on</span>
                        {ev.location}
                      </div>
                    )}
                    {ev.time && (
                      <div className="flex items-center gap-2" style={{ color: '#525B7A', fontSize: 13 }}>
                        <span className="ms shrink-0" style={{ fontSize: 15 }}>schedule</span>
                        {ev.time}
                      </div>
                    )}
                    {ev.description && (
                      <p className="line-clamp-2" style={{ color: '#525B7A', fontSize: 13, lineHeight: 1.5 }}>
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <div style={{ padding: '0 24px 20px' }}>
                    {ev.requires_payment ? (
                      <Button variant="filled" onClick={() => setRsvpEvent(ev)} className="w-full justify-center">
                        <span className="ms" style={{ fontSize: 16 }}>payments</span>
                        Registrarme — Q{Number(ev.price_gtq).toFixed(0)}
                      </Button>
                    ) : (
                      <Button variant="tonal" onClick={() => setRsvpEvent(ev)} className="w-full justify-center">
                        <span className="ms" style={{ fontSize: 16 }}>check_circle</span>
                        Confirmar asistencia
                      </Button>
                    )}
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

// ============================================================
//  DonationCard — WIZARD de 4 pasos (Monto → Destino → Pago →
//  Confirmar). Un solo formulario largo se leía como página de
//  plantilla ("mucho texto, cajas"); la guía pide módulos con
//  submódulos que emulen los pasos de una operación. La lógica de
//  envío (donations/register + receipts) es la misma de siempre.
// ============================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { Icon } from '../ui/Glass';

const AMOUNTS  = [50, 100, 250, 500];
const PURPOSES = [
  { value: 'general',   label: 'Fondo General' },
  { value: 'celulas',   label: 'Células' },
  { value: 'misionero', label: 'Misiones' },
  { value: 'jovenes',   label: 'Ministerio Joven' },
  { value: 'edificio',  label: 'Edificio' },
];

const PAYMENT_METHODS = [
  { icon: 'spark', label: 'Transferencia bancaria', sub: 'Sube tu boleta y la verificamos', value: 'transferencia' },
  { icon: 'heart', label: 'En persona',             sub: 'Te recibimos un domingo',        value: 'presencial' },
];

// ⚠️ El número de cuenta viene del mockup de Figma — PENDIENTE confirmar
// la cuenta real con el pastor.
const BANK_INFO = [
  { label: 'Banco',       value: 'Banrural' },
  { label: 'Cuenta',      value: '3061234567890' },
  { label: 'A nombre de', value: 'Iglesia Casa del Rey' },
];

const STEPS = ['Monto', 'Destino', 'Pago', 'Confirmar'];

const PRESS = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

const SLIDE = {
  initial: { opacity: 0, x: 42 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
  exit:    { opacity: 0, x: -42, transition: { duration: 0.18 } },
};

const inputCls =
  'w-full rounded-[14px] bg-white/5 border border-white/10 px-4 py-3 text-[15px] text-white placeholder-white/40 transition-all focus:outline-none focus:bg-white/10 focus:border-white/30';

const labelCls = 'block text-[13px] font-semibold text-white/50 mb-2';

export default function DonationCard() {
  const [step,    setStep]    = useState(0);
  const [amount,  setAmount]  = useState(100);
  const [custom,  setCustom]  = useState('');
  const [purpose, setPurpose] = useState('general');
  const [method,  setMethod]  = useState('transferencia');
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');

  const [receiptUrl, setReceiptUrl] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [uploading, setUploading] = useState(false);

  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const finalAmount = custom ? parseFloat(custom) : amount;
  const purposeLabel = PURPOSES.find(p => p.value === purpose)?.label || '';
  const methodLabel  = PAYMENT_METHODS.find(m => m.value === method)?.label || '';
  const isTransfer = method === 'transferencia';

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload?folder=comprobantes', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReceiptUrl(res.data.url);
      toast.success('Comprobante cargado');
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 10) { toast.error('El monto mínimo es Q10'); return; }
    if (!name.trim())                      { toast.error('Por favor ingresa tu nombre'); return; }
    if (isTransfer && !receiptUrl)         { toast.error('Sube tu comprobante de transferencia'); return; }

    setLoading(true);
    try {
      await apiClient.post('/donations/register', {
        name, email,
        amount: finalAmount,
        currency: 'GTQ',
        donation_purpose: purpose,
        payment_method: method,
      });

      if (isTransfer) {
        await apiClient.post('/receipts', {
          payer_name: name,
          payer_email: email,
          payer_phone: phone,
          amount: finalAmount,
          bank_name: 'Banrural',
          reference_number: referenceNumber,
          receipt_image_url: receiptUrl,
          purpose: 'donacion',
          event_id: null,
        });
      }

      setSent(true);
      toast.success('¡Donación registrada! Gracias.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar la donación.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSent(false);
    setStep(0);
    setCustom('');
    setName('');
    setEmail('');
    setPhone('');
    setReceiptUrl('');
    setReferenceNumber('');
    setAmount(100);
    setPurpose('general');
    setMethod('transferencia');
  };

  // Qué necesita cada paso para dejar avanzar
  const canContinue =
    step === 0 ? finalAmount >= 10 :
    step === 2 ? (!isTransfer || (receiptUrl && !uploading)) :
    true;

  const next = () => {
    if (step === 0 && finalAmount < 10) { toast.error('El monto mínimo es Q10'); return; }
    if (step === 2 && isTransfer && !receiptUrl) { toast.error('Sube tu comprobante para continuar'); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  // ── Success state ──────────────────────────────────────────────
  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
          <Icon name="check" className="w-7 h-7 text-white" stroke={2.4} />
        </div>
        <h3 className="display-mega text-white" style={{ fontSize: '1.7rem' }}>
          ¡Gracias por sembrar!
        </h3>
        {isTransfer ? (
          <>
            <p className="mt-3 text-[15px] text-white/70 leading-relaxed">
              Recibimos tu donación de <strong className="text-white">Q{finalAmount}</strong> para <strong className="text-white">{purposeLabel}</strong>.
            </p>
            <p className="mt-1 text-[13.5px] text-white/50">
              Verificamos tu comprobante en 24-48 horas y te confirmamos por correo.
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-[15px] text-white/70 leading-relaxed">
              Anotamos tu intención de <strong className="text-white">Q{finalAmount}</strong> para <strong className="text-white">{purposeLabel}</strong>.
            </p>
            <p className="mt-1 text-[13.5px] text-white/50">
              Te esperamos este domingo. Un coordinador te recibe en la entrada.
            </p>
          </>
        )}
        <motion.button {...PRESS} onClick={resetForm} className="mt-7 px-6 py-3.5 rounded-pill liquid-glass text-white font-bold text-[14px]">
          Hacer otra donación
        </motion.button>
      </div>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit}>
      {/* Pasos — la operación se ve, no se lee */}
      <div className="flex items-center gap-1.5 mb-7">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <button
              key={label}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12px] font-bold transition-all focus-ring ${
                current ? 'bg-white text-bg shadow-card'
                : done  ? 'bg-white/12 text-white cursor-pointer hover:bg-white/20'
                        : 'bg-white/5 text-white/40 cursor-default'
              }`}
            >
              {done
                ? <Icon name="check" className="w-3 h-3" stroke={2.6} />
                : <span className={current ? 'text-bg/60' : 'text-white/30'}>{i + 1}</span>}
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[290px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} {...SLIDE}>
          {/* ── Paso 1 · Monto ── */}
          {step === 0 && (
            <div>
              <p className="text-[15px] text-white/70 mb-5">¿Cuánto quieres sembrar?</p>
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {AMOUNTS.map(a => {
                  const active = amount === a && !custom;
                  return (
                    <motion.button
                      key={a}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => { setAmount(a); setCustom(''); }}
                      className={`py-4 rounded-pill text-[17px] font-bold transition-colors focus-ring ${
                        active ? 'bg-white text-bg shadow-card' : 'liquid-btn'
                      }`}
                    >
                      Q{a}
                    </motion.button>
                  );
                })}
              </div>
              <input
                type="number"
                min="10"
                placeholder="Otro monto (mínimo Q10)"
                value={custom}
                onChange={e => { setCustom(e.target.value); setAmount(null); }}
                className={inputCls}
              />
            </div>
          )}

          {/* ── Paso 2 · Destino ── */}
          {step === 1 && (
            <div>
              <p className="text-[15px] text-white/70 mb-5">¿A dónde va tu siembra?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PURPOSES.map(p => {
                  const active = purpose === p.value;
                  return (
                    <motion.button
                      key={p.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => setPurpose(p.value)}
                      className={`flex items-center gap-2.5 rounded-pill px-5 py-3.5 text-[14px] font-bold transition-colors focus-ring ${
                        active ? 'bg-white text-bg shadow-card' : 'liquid-btn !text-white/75 hover:!text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-celeste' : 'bg-white/30'}`} />
                      {p.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Paso 3 · Pago ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[15px] text-white/70">¿Cómo quieres darlo?</p>
              <div className="space-y-2.5">
                {PAYMENT_METHODS.map(m => {
                  const active = method === m.value;
                  return (
                    <motion.button
                      key={m.value}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => setMethod(m.value)}
                      className={`w-full flex items-center gap-4 rounded-[18px] px-4 py-4 text-left transition-all liquid-glass liquid-shine focus-ring ${
                        active ? 'border-white/35 bg-white/10 shadow-card' : 'hover:border-white/20'
                      }`}
                    >
                      <span className={`grid place-items-center w-11 h-11 rounded-full shrink-0 ${
                        active ? 'bg-white text-bg' : 'bg-white/10 text-white border border-white/15'
                      }`}>
                        <Icon name={m.icon} className="w-5 h-5" stroke={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-bold text-white">{m.label}</div>
                        <div className="text-[12.5px] text-white/60 mt-0.5">{m.sub}</div>
                      </div>
                      {active && <Icon name="check" className="w-5 h-5 text-white shrink-0" stroke={2.4} />}
                    </motion.button>
                  );
                })}
              </div>

              {isTransfer && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    {BANK_INFO.map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between rounded-[12px] bg-white/5 px-4 py-3 border border-white/10">
                        <span className="text-[12.5px] font-semibold text-white/60">{label}</span>
                        <span className="text-[14.5px] font-bold text-white">{value}</span>
                      </div>
                    ))}
                  </div>

                  {receiptUrl ? (
                    <div className="flex items-center gap-4 rounded-[14px] bg-white/5 border border-white/15 p-4">
                      <img src={receiptUrl} alt="comprobante" className="h-16 w-16 object-cover rounded-[10px] border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <p className="inline-flex items-center gap-1.5 text-[14px] font-bold text-white">
                          <Icon name="check" className="w-4 h-4" stroke={2.4} />
                          Comprobante cargado
                        </p>
                        <button
                          type="button"
                          onClick={() => setReceiptUrl('')}
                          className="block mt-1 text-[12.5px] font-semibold text-white/50 hover:text-white transition-colors"
                        >
                          Cambiar foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className={`flex items-center gap-4 rounded-[16px] border-2 border-dashed border-white/15 bg-white/5 p-4 cursor-pointer transition-all ${uploading ? 'opacity-60' : 'hover:border-white/30 hover:bg-white/10'}`}>
                      <span className="grid place-items-center w-11 h-11 rounded-full bg-white/10 text-white shrink-0">
                        <Icon name={uploading ? 'clock' : 'mail'} className={`w-5 h-5 ${uploading ? 'animate-spin' : ''}`} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-white">
                          {uploading ? 'Subiendo…' : 'Sube la foto de tu boleta *'}
                        </p>
                        <p className="mt-0.5 text-[12px] text-white/50">JPG, PNG o PDF · máx. 10 MB</p>
                      </div>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handlePhoto} disabled={uploading} />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Paso 4 · Confirmar ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-[16px] bg-white/10 p-5 flex justify-between items-center">
                <div>
                  <div className="text-[12px] font-semibold text-white/60">{purposeLabel} · {methodLabel}</div>
                  <div className="text-[13px] text-white/70 mt-0.5">
                    {isTransfer ? 'Con comprobante adjunto' : 'Entrega en persona'}
                  </div>
                </div>
                <span className="display-mega text-white" style={{ fontSize: 34 }}>
                  Q{finalAmount}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Nombre *</span>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Tu nombre" className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Correo</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Para confirmación" className={inputCls} />
                </label>
              </div>

              {isTransfer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelCls}>Teléfono</span>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+502 …" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>No. de boleta</span>
                    <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="Opcional" className={inputCls} />
                  </label>
                </div>
              )}

              <p className="text-[12.5px] text-white/50">
                {isTransfer
                  ? 'Verificamos tu comprobante en 24-48 horas y te confirmamos por correo.'
                  : 'Un coordinador te recibirá este domingo en la entrada.'}
              </p>
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegación del wizard */}
      <div className="flex items-center gap-3 mt-6">
        {step > 0 && (
          <motion.button
            {...PRESS}
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-pill liquid-glass border border-white/20 text-white font-bold text-[14px] focus-ring"
          >
            <Icon name="arrow" className="w-4 h-4 rotate-180" stroke={2} />
            Atrás
          </motion.button>
        )}
        {step < STEPS.length - 1 ? (
          <motion.button
            {...PRESS}
            type="button"
            onClick={next}
            disabled={!canContinue}
            className="flex-1 inline-flex items-center justify-center gap-2.5 py-3.5 rounded-pill bg-white text-bg font-bold text-[15px] disabled:opacity-40 focus-ring"
          >
            Continuar
            <Icon name="arrow" className="w-4 h-4" stroke={2} />
          </motion.button>
        ) : (
          <motion.button
            {...PRESS}
            type="submit"
            disabled={loading || uploading || !name.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2.5 py-3.5 rounded-pill bg-white text-bg font-bold text-[15px] disabled:opacity-40 focus-ring"
          >
            {loading ? 'Procesando…' : isTransfer ? 'Enviar donación y comprobante' : 'Registrar donación'}
            {!loading && <Icon name="check" className="w-4 h-4" stroke={2.4} />}
          </motion.button>
        )}
      </div>
    </form>
  );
}

// ============================================================
//  DonationCard — ACORDEÓN en cascada (Monto → Destino → Pago →
//  Confirmar). Cada paso es su PROPIA card de cristal apilada:
//  el activo se despliega hacia abajo, los completados quedan
//  colapsados mostrando lo elegido (tocar = editar), los futuros
//  esperan atenuados. Submódulos que emulan los pasos de una
//  operación — la card refracta directamente la foto de la sección
//  (nada de cristal anidado: la guía lo prohíbe).
//  La lógica de envío (donations/register + receipts) es la de siempre.
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

const PRESS = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
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
      const res = await apiClient.post('/receipts/upload', fd, {
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

  const next = () => {
    if (step === 0 && (!finalAmount || finalAmount < 10)) { toast.error('El monto mínimo es Q10'); return; }
    if (step === 2 && isTransfer && !receiptUrl) { toast.error('Sube tu comprobante para continuar'); return; }
    setStep(s => Math.min(s + 1, 3));
  };

  // Qué necesita cada paso para dejar avanzar
  const canContinue =
    step === 0 ? finalAmount >= 10 :
    step === 2 ? (!isTransfer || (receiptUrl && !uploading)) :
    true;

  // ── Success state ──────────────────────────────────────────────
  if (sent) {
    return (
      <div className="liquid-glass liquid-shine rounded-[24px] p-8 text-center">
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

  // Resumen colapsado de cada paso completado
  const summaries = [
    `Q${finalAmount || '—'}`,
    purposeLabel,
    `${methodLabel}${isTransfer && receiptUrl ? ' · boleta ✓' : ''}`,
    '',
  ];

  const stepDefs = [
    { label: 'Monto',     question: '¿Cuánto quieres sembrar?' },
    { label: 'Destino',   question: '¿A dónde va tu siembra?' },
    { label: 'Pago',      question: '¿Cómo quieres darlo?' },
    { label: 'Confirmar', question: 'Últimos datos y listo.' },
  ];

  const ContinueBtn = ({ children = 'Continuar' }) => (
    <motion.button
      {...PRESS}
      type="button"
      onClick={next}
      disabled={!canContinue}
      className="w-full mt-5 inline-flex items-center justify-center gap-2.5 py-3.5 rounded-pill bg-white text-bg font-bold text-[15px] disabled:opacity-40 focus-ring"
    >
      {children}
      <Icon name="arrow" className="w-4 h-4 rotate-90" stroke={2} />
    </motion.button>
  );

  // ── Acordeón en cascada ────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {stepDefs.map((def, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <div
            key={def.label}
            className={`liquid-glass liquid-shine rounded-[22px] overflow-hidden transition-all duration-500 ${
              current ? 'border-white/25' : ''
            } ${i > step ? 'opacity-40' : ''}`}
          >
            {/* Encabezado del paso — colapsado muestra lo elegido */}
            <button
              type="button"
              disabled={!done}
              onClick={() => done && setStep(i)}
              className={`w-full flex items-center gap-3.5 px-5 py-4 text-left focus-ring ${done ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'} transition-colors`}
            >
              <span className={`grid place-items-center w-8 h-8 rounded-full text-[13px] font-extrabold shrink-0 transition-colors ${
                current ? 'bg-white text-bg' : done ? 'bg-white/15 text-white' : 'bg-white/8 text-white/40'
              }`}>
                {done ? <Icon name="check" className="w-4 h-4" stroke={2.6} /> : i + 1}
              </span>
              <span className={`text-[15px] font-bold ${current || done ? 'text-white' : 'text-white/40'}`}>
                {def.label}
              </span>
              {done && (
                <>
                  <span className="ml-auto text-[13.5px] font-semibold text-white/60 truncate">{summaries[i]}</span>
                  <span className="text-[12px] font-bold text-white/40 shrink-0">Editar</span>
                </>
              )}
            </button>

            {/* Cuerpo — se despliega hacia abajo */}
            <AnimatePresence initial={false}>
              {current && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">
                    <p className="text-[14px] text-white/60 mb-4">{def.question}</p>

                    {/* ── Paso 1 · Monto ── */}
                    {i === 0 && (
                      <div>
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
                        <ContinueBtn />
                      </div>
                    )}

                    {/* ── Paso 2 · Destino ── */}
                    {i === 1 && (
                      <div>
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
                        <ContinueBtn />
                      </div>
                    )}

                    {/* ── Paso 3 · Pago ── */}
                    {i === 2 && (
                      <div className="space-y-4">
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
                                className={`w-full flex items-center gap-4 rounded-[16px] px-4 py-3.5 text-left transition-all border focus-ring ${
                                  active ? 'bg-white/12 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                              >
                                <span className={`grid place-items-center w-10 h-10 rounded-full shrink-0 ${
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
                          <>
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
                          </>
                        )}
                        <ContinueBtn />
                      </div>
                    )}

                    {/* ── Paso 4 · Confirmar ── */}
                    {i === 3 && (
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

                        <motion.button
                          {...PRESS}
                          type="submit"
                          disabled={loading || uploading || !name.trim()}
                          className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 rounded-pill bg-white text-bg font-bold text-[15px] disabled:opacity-40 focus-ring"
                        >
                          {loading ? 'Procesando…' : isTransfer ? 'Enviar donación y comprobante' : 'Registrar donación'}
                          {!loading && <Icon name="check" className="w-4 h-4" stroke={2.4} />}
                        </motion.button>

                        <p className="text-[12.5px] text-white/50">
                          {isTransfer
                            ? 'Verificamos tu comprobante en 24-48 horas y te confirmamos por correo.'
                            : 'Un coordinador te recibirá este domingo en la entrada.'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </form>
  );
}

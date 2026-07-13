import { useState } from 'react';
import { motion } from 'framer-motion';
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
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

const inputCls =
  'w-full rounded-[14px] bg-white/5 border border-white/10 px-4 py-3 text-[15px] text-white placeholder-white/40 transition-all focus:outline-none focus:bg-white/10 focus:border-white/30';

const labelCls = 'block text-[13px] font-semibold text-white/50 mb-2';

export default function DonationCard() {
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

  // ── Form ───────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Montos */}
      <div>
        <label className={labelCls}>Monto (Q)</label>
        {/* Pills, no cajas: el seleccionado es el pill blanco estándar del
            sitio; los demás son .liquid-btn (vidrio con cuerpo) — la clase
            .liquid-glass pelada en chips chicos sobre panel navy se leía
            como caja gris genérica. */}
        <div className="grid grid-cols-4 gap-2.5 mb-3">
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
                className={`py-3 rounded-pill text-[14.5px] font-bold transition-colors focus-ring ${
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
          placeholder="Otro monto"
          value={custom}
          onChange={e => { setCustom(e.target.value); setAmount(null); }}
          className={inputCls}
        />
      </div>

      {/* Destino */}
      <div>
        <label className={labelCls}>Destino</label>
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
                className={`flex items-center gap-2.5 rounded-pill px-5 py-3 text-[14px] font-bold transition-colors focus-ring ${
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

      {/* Método de pago */}
      <div>
        <label className={labelCls}>Método de pago</label>
        <div className="space-y-2">
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
      </div>

      {/* Datos del donante */}
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

      {/* ── Sección extra solo para Transferencia ── */}
      {isTransfer && (
        <div className="space-y-5 rounded-[20px] liquid-glass p-5 md:p-6">
          {/* Datos bancarios */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="spark" className="w-4 h-4 text-white/60" />
              <span className="text-[13px] font-semibold text-white/50">Datos para depósito</span>
            </div>
            <div className="space-y-2">
              {BANK_INFO.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-[12px] bg-white/5 px-4 py-3 border border-white/10">
                  <span className="text-[12.5px] font-semibold text-white/60">{label}</span>
                  <span className="text-[14.5px] font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Teléfono + referencia */}
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

          {/* Upload zone */}
          <div>
            <span className={labelCls}>Foto del comprobante *</span>
            {receiptUrl ? (
              <div className="flex items-center gap-4 rounded-[14px] bg-white/5 border border-white/15 p-4">
                <img src={receiptUrl} alt="comprobante" className="h-20 w-20 object-cover rounded-[10px] border border-white/10" />
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
              <label className={`flex flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-white/15 bg-white/5 p-8 cursor-pointer transition-all ${uploading ? 'opacity-60' : 'hover:border-white/30 hover:bg-white/10'}`}>
                <span className="grid place-items-center w-12 h-12 rounded-full bg-white/10 text-white">
                  <Icon name={uploading ? 'clock' : 'mail'} className={`w-6 h-6 ${uploading ? 'animate-spin' : ''}`} />
                </span>
                <div className="text-center">
                  <p className="text-[14.5px] font-bold text-white">
                    {uploading ? 'Subiendo…' : 'Toca para subir la foto'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-white/50">JPG, PNG o PDF · máx. 10 MB</p>
                </div>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handlePhoto} disabled={uploading} />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Resumen */}
      {finalAmount >= 10 && (
        <div className="rounded-[16px] bg-white/10 p-5 flex justify-between items-center">
          <div>
            <div className="text-[12px] font-semibold text-white/60">Total a registrar</div>
            <div className="text-[13px] text-white/70 mt-0.5">{purposeLabel}</div>
          </div>
          <span className="display-mega text-white" style={{ fontSize: 36 }}>
            Q{finalAmount}
          </span>
        </div>
      )}

      <motion.button
        {...PRESS}
        type="submit"
        disabled={loading || uploading || !finalAmount || finalAmount < 10 || (isTransfer && !receiptUrl)}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-pill bg-white text-bg font-bold text-[15px] disabled:opacity-50"
      >
        {loading ? 'Procesando…' : isTransfer ? 'Enviar donación y comprobante' : 'Registrar donación'}
        {!loading && <Icon name="arrow" className="w-4 h-4" stroke={2} />}
      </motion.button>

      <p className="text-center text-[12.5px] text-white/50">
        {isTransfer
          ? 'Verificamos tu comprobante en 24-48 horas y te confirmamos por correo.'
          : 'Un coordinador te recibirá este domingo en la entrada.'}
      </p>
    </form>
  );
}

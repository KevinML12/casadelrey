import { useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { Icon, GlassButton } from '../ui/Glass';

const AMOUNTS  = [50, 100, 250, 500];
const PURPOSES = [
  { value: 'general',   label: 'Fondo General' },
  { value: 'celulas',   label: 'Células' },
  { value: 'misionero', label: 'Misiones' },
  { value: 'jovenes',   label: 'Ministerio Joven' },
  { value: 'edificio',  label: 'Edificio' },
];

const PAYMENT_METHODS = [
  {
    icon: 'spark',
    label: 'Transferencia bancaria',
    sub:   'Sube tu boleta y la verificamos',
    value: 'transferencia',
  },
  {
    icon: 'heart',
    label: 'En persona',
    sub:   'Te recibimos un domingo',
    value: 'presencial',
  },
];

const BANK_INFO = [
  { label: 'Banco',       value: 'Banrural' },
  { label: 'Cuenta',      value: '3061234567890' },
  { label: 'A nombre de', value: 'Iglesia Casa del Rey' },
];

const inputCls =
  'w-full rounded-sm bg-white/5 border border-white/10 px-4 py-3 text-[15px] text-white placeholder-ink-3 focus-ring transition-all focus:bg-bg focus:border-celeste';

export default function DonationCard() {
  const [amount,  setAmount]  = useState(100);
  const [custom,  setCustom]  = useState('');
  const [purpose, setPurpose] = useState('general');
  const [method,  setMethod]  = useState('transferencia');
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');

  // Receipt (solo para transferencia)
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
      // 1. Registrar intención de donación
      await apiClient.post('/donations/register', {
        name, email,
        amount: finalAmount,
        currency: 'GTQ',
        donation_purpose: purpose,
        payment_method: method,
      });

      // 2. Si es transferencia, registrar comprobante para verificación
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
        <span className="grid place-items-center w-16 h-16 mx-auto mb-5 rounded-full bg-celeste text-white shadow-pri">
          <Icon name="check" className="w-8 h-8" stroke={2.4} />
        </span>
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
        <GlassButton variant="glass" className="mt-7" onClick={resetForm}>
          Hacer otra donación
        </GlassButton>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Montos */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov mb-3">
          Monto (Q)
        </label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {AMOUNTS.map(a => {
            const active = amount === a && !custom;
            return (
              <button
                key={a}
                type="button"
                onClick={() => { setAmount(a); setCustom(''); }}
                className={`py-3 rounded-sm text-[14.5px] font-extrabold tracking-tightish btn-spring focus-ring border ${
                  active
                    ? 'bg-celeste text-white border-celeste shadow-pri'
                    : 'bg-white/5 border-white/10 text-white hover:bg-celeste-soft hover:border-celeste/40'
                }`}
              >
                Q{a}
              </button>
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
        <label className="block text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov mb-3">
          Destino
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PURPOSES.map(p => {
            const active = purpose === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPurpose(p.value)}
                className={`text-left rounded-sm px-4 py-3 text-[14px] font-bold tracking-tightish transition-all focus-ring border btn-spring ${
                  active
                    ? 'bg-celeste-soft border-celeste text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-celeste-soft hover:border-celeste/40 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Método de pago */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov mb-3">
          Método de pago
        </label>
        <div className="space-y-2">
          {PAYMENT_METHODS.map(m => {
            const active = method === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={`w-full flex items-center gap-4 rounded-sm px-4 py-4 text-left transition-all focus-ring border btn-spring ${
                  active
                    ? 'bg-celeste-soft border-celeste'
                    : 'bg-white/5 border-white/10 hover:bg-celeste-soft hover:border-celeste/40'
                }`}
              >
                <span className={`grid place-items-center w-11 h-11 rounded-sm shrink-0 ${
                  active ? 'bg-celeste text-white shadow-pri' : 'bg-bg text-celeste border border-white/10'
                }`}>
                  <Icon name={m.icon} className="w-5 h-5" stroke={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`text-[14.5px] font-extrabold tracking-tightish ${active ? 'text-white' : 'text-white'}`}>
                    {m.label}
                  </div>
                  <div className="text-[12.5px] text-white/70 mt-0.5">{m.sub}</div>
                </div>
                {active && (
                  <Icon name="check" className="w-5 h-5 text-celeste shrink-0" stroke={2.4} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Datos del donante */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov mb-2">Nombre *</span>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Tu nombre" className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov mb-2">Correo</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Para confirmación" className={inputCls} />
        </label>
      </div>

      {/* ── Sección extra solo para Transferencia ── */}
      {isTransfer && (
        <div className="space-y-5 rounded-card border border-celeste/30 bg-celeste-soft/50 p-5 md:p-6 animate-fade-in">
          {/* Datos bancarios */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="spark" className="w-4 h-4 text-celeste" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov">
                Datos para depósito
              </span>
            </div>
            <div className="space-y-2">
              {BANK_INFO.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-sm bg-bg px-4 py-3 border border-white/10">
                  <span className="text-[11.5px] font-bold uppercase tracking-widest text-white/70">{label}</span>
                  <span className="text-[14.5px] font-extrabold tracking-tightish text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Teléfono + referencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov mb-2">Teléfono</span>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+502 …" className={inputCls} />
            </label>
            <label className="block">
              <span className="block text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov mb-2">No. de boleta</span>
              <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="Opcional" className={inputCls} />
            </label>
          </div>

          {/* Upload zone */}
          <div>
            <span className="block text-[11px] font-extrabold uppercase tracking-widest text-celeste-hov mb-3">
              Foto del comprobante *
            </span>
            {receiptUrl ? (
              <div className="flex items-center gap-4 rounded-sm bg-bg border border-celeste/40 p-4">
                <img src={receiptUrl} alt="comprobante" className="h-20 w-20 object-cover rounded-sm border border-white/10" />
                <div className="flex-1 min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-[14px] font-bold text-white">
                    <Icon name="check" className="w-4 h-4 text-celeste" stroke={2.4} />
                    Comprobante cargado
                  </p>
                  <button
                    type="button"
                    onClick={() => setReceiptUrl('')}
                    className="block mt-1 text-[12px] font-bold uppercase tracking-widest text-white/50 hover:text-rose transition-colors"
                  >
                    Cambiar foto
                  </button>
                </div>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed border-celeste/40 bg-bg p-8 cursor-pointer transition-all focus-ring ${uploading ? 'opacity-60' : 'hover:border-celeste hover:bg-celeste-soft'}`}>
                <span className="grid place-items-center w-12 h-12 rounded-full bg-celeste-soft text-celeste">
                  {uploading ? (
                    <Icon name="clock" className="w-6 h-6 animate-spin" />
                  ) : (
                    <Icon name="mail" className="w-6 h-6" />
                  )}
                </span>
                <div className="text-center">
                  <p className="text-[14.5px] font-extrabold tracking-tightish text-white">
                    {uploading ? 'Subiendo…' : 'Toca para subir la foto'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-white/70">JPG, PNG o PDF · máx. 10 MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handlePhoto}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Resumen */}
      {finalAmount >= 10 && (
        <div className="rounded-sm bg-white/10 p-5 flex justify-between items-center">
          <div>
            <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-celeste">Total a registrar</div>
            <div className="text-[12.5px] text-white/70 mt-0.5">{purposeLabel}</div>
          </div>
          <span className="display-mega text-white" style={{ fontSize: 36 }}>
            Q{finalAmount}
          </span>
        </div>
      )}

      <GlassButton
        type="submit"
        variant="primary"
        icon="arrow"
        disabled={loading || uploading || !finalAmount || finalAmount < 10 || (isTransfer && !receiptUrl)}
        className="w-full"
      >
        {loading
          ? 'Procesando…'
          : isTransfer
            ? `Enviar donación y comprobante`
            : `Registrar donación`}
      </GlassButton>

      <p className="text-center text-[12px] text-white/50">
        {isTransfer
          ? 'Verificamos tu comprobante en 24-48 horas y te confirmamos por correo.'
          : 'Un coordinador te recibirá este domingo en la entrada.'}
      </p>
    </form>
  );
}

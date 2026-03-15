import { useState } from 'react';
import { CheckCircle, Loader2, Shield, Zap } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

const AMOUNTS  = [50, 100, 250, 500];
const PURPOSES = [
  { value: 'general',   label: 'Fondo General' },
  { value: 'celulas',   label: 'Células' },
  { value: 'misionero', label: 'Misiones' },
  { value: 'jovenes',   label: 'Ministerio Joven' },
  { value: 'edificio',  label: 'Edificio' },
];

const inputCls = 'w-full px-4 py-2.5 rounded-md border border-line dark:border-white/10 bg-transparent text-ink placeholder:text-ink-3 text-sm focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15 transition-all';

export default function DonationCard() {
  const [amount,    setAmount]    = useState(100);
  const [custom,    setCustom]    = useState('');
  const [purpose,   setPurpose]   = useState('general');
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const finalAmount = custom ? parseFloat(custom) : amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 10) { toast.error('El monto mínimo es Q10'); return; }
    if (!name.trim()) { toast.error('Por favor ingresa tu nombre'); return; }
    setLoading(true);
    try {
      await apiClient.post('/v1/donations/simulate', {
        name, email, amount: finalAmount, currency: 'GTQ', payment_method: 'simulado', donation_purpose: purpose,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-12 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-5">
          <CheckCircle size={32} className="text-gold" />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">¡Gracias por tu generosidad!</h3>
        <p className="text-ink-2 text-sm max-w-xs leading-relaxed mb-1">
          Tu donación de <span className="font-bold text-gold">Q{finalAmount}</span> fue registrada.
        </p>
        <p className="text-ink-3 text-xs mb-6">Dios multiplica cada semilla sembrada con fe.</p>
        <Button variant="outline" onClick={() => { setSubmitted(false); setName(''); setEmail(''); }}>
          Hacer otra donación
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Montos */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">Monto (Q)</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {AMOUNTS.map(a => (
            <button key={a} type="button"
              onClick={() => { setAmount(a); setCustom(''); }}
              className={`py-2.5 rounded-md text-sm font-semibold border transition-all ${
                amount === a && !custom
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-line dark:border-white/10 text-ink-2 hover:border-gold/40 hover:text-gold hover:bg-gold/5'
              }`}>
              Q{a}
            </button>
          ))}
        </div>
        <input type="number" min="10" placeholder="Otro monto" value={custom}
          onChange={e => { setCustom(e.target.value); setAmount(null); }}
          className={inputCls} />
      </div>

      {/* Propósito */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">Destino</label>
        <div className="grid grid-cols-1 gap-1.5">
          {PURPOSES.map(p => (
            <button key={p.value} type="button"
              onClick={() => setPurpose(p.value)}
              className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium border transition-all ${
                purpose === p.value
                  ? 'border-blue bg-blue/10 text-blue'
                  : 'border-line dark:border-white/10 text-ink-2 hover:border-blue/40 hover:bg-card-2'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Nombre *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            required className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Correo (opcional)</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={inputCls} />
        </div>
      </div>

      {/* Resumen */}
      {finalAmount >= 10 && (
        <div className="px-4 py-3 rounded-lg bg-navy border border-white/10 flex justify-between items-center animate-fade-in">
          <span className="text-white/60 text-sm">Total a donar</span>
          <span className="text-gold font-black text-xl">Q{finalAmount}</span>
        </div>
      )}

      <Button type="submit" variant="gold" size="lg" className="w-full"
        disabled={loading || !finalAmount || finalAmount < 10}>
        {loading ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : `Donar Q${finalAmount || '—'}`}
      </Button>

      <div className="flex items-center justify-center gap-5 text-xs text-ink-3">
        <span className="flex items-center gap-1"><Shield size={11} /> Seguro</span>
        <span className="flex items-center gap-1"><Zap size={11} /> Rápido</span>
      </div>
    </form>
  );
}

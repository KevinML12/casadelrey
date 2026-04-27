import { useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

const AMOUNTS   = [50, 100, 250, 500];
const PURPOSES  = [
  { value: 'general',   label: 'Fondo General' },
  { value: 'celulas',   label: 'Células' },
  { value: 'misionero', label: 'Misiones' },
  { value: 'jovenes',   label: 'Ministerio Joven' },
  { value: 'edificio',  label: 'Edificio' },
];

const PAYMENT_METHODS = [
  { icon: 'account_balance', label: 'Transferencia Bancaria', value: 'transferencia' },
  { icon: 'phone_android',   label: 'Tigo Money',            value: 'tigo_money' },
  { icon: 'savings',         label: 'En persona',            value: 'presencial' },
];

const fieldCls = 'w-full px-4 py-2.5 rounded-lg border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

export default function DonationCard() {
  const [amount,  setAmount]  = useState(100);
  const [custom,  setCustom]  = useState('');
  const [purpose, setPurpose] = useState('general');
  const [method,  setMethod]  = useState('transferencia');
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const finalAmount = custom ? parseFloat(custom) : amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 10) { toast.error('El monto mínimo es Q10'); return; }
    if (!name.trim())                      { toast.error('Por favor ingresa tu nombre'); return; }

    setLoading(true);
    try {
      await apiClient.post('/donations/register', {
        name, email,
        amount: finalAmount,
        currency: 'GTQ',
        donation_purpose: purpose,
        payment_method: method,
      });
      setSent(true);
      toast.success('¡Donación registrada! Gracias.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar la donación.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ter-con flex items-center justify-center mx-auto mb-5">
          <span className="ms text-on-ter-con" style={{ fontSize: 32 }}>volunteer_activism</span>
        </div>
        <h3 className="text-title-l text-on-surf font-bold mb-2">¡Gracias por tu donación!</h3>
        <p className="text-body-m text-on-surf-var leading-relaxed mb-1">
          Tu intención de donación de <strong className="text-on-surf">Q{finalAmount}</strong> fue registrada.
        </p>
        <p className="text-body-s text-on-surf-var mb-6">Un coordinador se comunicará contigo para confirmar el proceso.</p>
        <Button variant="outlined" onClick={() => { setSent(false); setCustom(''); setName(''); setEmail(''); }}>
          Hacer otra donación
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Montos */}
      <div>
        <label className="block text-label-l text-on-surf-var mb-2">Monto (Q)</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {AMOUNTS.map(a => (
            <button key={a} type="button" onClick={() => { setAmount(a); setCustom(''); }}
              className={`py-2.5 rounded-full text-label-m font-semibold border transition-all ${
                amount === a && !custom
                  ? 'border-pri bg-pri-con text-on-pri-con'
                  : 'border-outline-var text-on-surf-var hover:border-pri/40 hover:text-pri hover:bg-pri-con/40'
              }`}>
              Q{a}
            </button>
          ))}
        </div>
        <input type="number" min="10" placeholder="Otro monto" value={custom}
          onChange={e => { setCustom(e.target.value); setAmount(null); }}
          className={fieldCls} />
      </div>

      {/* Propósito */}
      <div>
        <label className="block text-label-l text-on-surf-var mb-2">Destino</label>
        <div className="space-y-1.5">
          {PURPOSES.map(p => (
            <button key={p.value} type="button" onClick={() => setPurpose(p.value)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-body-s font-medium border transition-all ${
                purpose === p.value
                  ? 'border-pri bg-pri-con text-on-pri-con'
                  : 'border-outline-var text-on-surf-var hover:border-pri/40 hover:bg-surf-high'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Método de pago */}
      <div>
        <label className="block text-label-l text-on-surf-var mb-2">Método de pago</label>
        <div className="space-y-1.5">
          {PAYMENT_METHODS.map(m => (
            <button key={m.value} type="button" onClick={() => setMethod(m.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-body-s font-medium border transition-all ${
                method === m.value
                  ? 'border-pri bg-pri-con text-on-pri-con'
                  : 'border-outline-var text-on-surf-var hover:border-pri/40 hover:bg-surf-high'
              }`}>
              <span className="ms" style={{ fontSize: 20 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Datos del donante */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Nombre *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            required placeholder="Tu nombre" className={fieldCls} />
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Correo (opcional)</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="para recibo" className={fieldCls} />
        </div>
      </div>

      {/* Resumen */}
      {finalAmount >= 10 && (
        <div className="px-4 py-3 rounded-xl hero-surf flex justify-between items-center animate-fade-in">
          <span className="text-body-s" style={{ color: 'rgba(255,255,255,.6)' }}>Total a registrar</span>
          <span className="text-headline-s font-black" style={{ color: '#A4C8FF' }}>Q{finalAmount}</span>
        </div>
      )}

      <Button type="submit" variant="filled" size="lg" className="w-full justify-center"
        disabled={loading || !finalAmount || finalAmount < 10}>
        {loading
          ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Registrando...</>
          : <><span className="ms" style={{ fontSize: 18 }}>volunteer_activism</span>Registrar donación — Q{finalAmount || '—'}</>
        }
      </Button>

      <p className="text-center text-label-s text-on-surf-var">
        Un coordinador confirmará el proceso con el método elegido.
      </p>
    </form>
  );
}

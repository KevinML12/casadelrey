import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CheckCircle, Loader2, Shield, Zap, ArrowLeft, Lock } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

// ── Stripe init ──────────────────────────────────────────────────────────────
// Carga Stripe solo si la clave está definida (evita crash en entornos sin Stripe)
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Constantes ───────────────────────────────────────────────────────────────
const AMOUNTS = [50, 100, 250, 500];
const PURPOSES = [
  { value: 'general',   label: 'Fondo General' },
  { value: 'celulas',   label: 'Células' },
  { value: 'misionero', label: 'Misiones' },
  { value: 'jovenes',   label: 'Ministerio Joven' },
  { value: 'edificio',  label: 'Edificio' },
];

const inputCls =
  'w-full px-4 py-2.5 rounded-md border border-line dark:border-white/10 bg-transparent text-ink placeholder:text-ink-3 text-sm focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15 transition-all';

// ── Step 1: Formulario de donación ───────────────────────────────────────────
function DonationForm({ onNext, loading }) {
  const [amount,  setAmount]  = useState(100);
  const [custom,  setCustom]  = useState('');
  const [purpose, setPurpose] = useState('general');
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');

  const finalAmount = custom ? parseFloat(custom) : amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 10) { toast.error('El monto mínimo es Q10'); return; }
    if (!name.trim())                      { toast.error('Por favor ingresa tu nombre'); return; }
    onNext({ name, email, amount: finalAmount, currency: 'GTQ', donation_purpose: purpose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Montos */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">Monto (Q)</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {AMOUNTS.map(a => (
            <button
              key={a} type="button"
              onClick={() => { setAmount(a); setCustom(''); }}
              className={`py-2.5 rounded-md text-sm font-semibold border transition-all ${
                amount === a && !custom
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-line dark:border-white/10 text-ink-2 hover:border-gold/40 hover:text-gold hover:bg-gold/5'
              }`}
            >
              Q{a}
            </button>
          ))}
        </div>
        <input
          type="number" min="10" placeholder="Otro monto" value={custom}
          onChange={e => { setCustom(e.target.value); setAmount(null); }}
          className={inputCls}
        />
      </div>

      {/* Propósito */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">Destino</label>
        <div className="grid grid-cols-1 gap-1.5">
          {PURPOSES.map(p => (
            <button
              key={p.value} type="button"
              onClick={() => setPurpose(p.value)}
              className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium border transition-all ${
                purpose === p.value
                  ? 'border-blue bg-blue/10 text-blue'
                  : 'border-line dark:border-white/10 text-ink-2 hover:border-blue/40 hover:bg-card-2'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Datos del donante */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Nombre *</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            required placeholder="Tu nombre" className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Correo (opcional)</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="para recibo" className={inputCls}
          />
        </div>
      </div>

      {/* Resumen */}
      {finalAmount >= 10 && (
        <div className="px-4 py-3 rounded-lg bg-navy border border-white/10 flex justify-between items-center animate-fade-in">
          <span className="text-white/60 text-sm">Total a donar</span>
          <span className="text-gold font-black text-xl">Q{finalAmount}</span>
        </div>
      )}

      <Button
        type="submit" variant="gold" size="lg" className="w-full"
        disabled={loading || !finalAmount || finalAmount < 10}
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Preparando pago...</>
          : `Proceder al pago — Q${finalAmount || '—'}`
        }
      </Button>

      <div className="flex items-center justify-center gap-5 text-xs text-ink-3">
        <span className="flex items-center gap-1"><Shield size={11} /> Cifrado SSL</span>
        <span className="flex items-center gap-1"><Lock size={11} /> Stripe Secured</span>
        <span className="flex items-center gap-1"><Zap size={11} /> Instantáneo</span>
      </div>
    </form>
  );
}

// ── Step 2: Stripe Payment Element ───────────────────────────────────────────
function CheckoutForm({ donationData, onBack }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
        payment_method_data: {
          billing_details: {
            name:  donationData.name,
            email: donationData.email || undefined,
          },
        },
      },
    });

    // Si llegamos aquí, Stripe devolvió un error inmediato (tarjeta rechazada, etc.)
    if (error) {
      toast.error(error.message || 'Error al procesar el pago.');
      setLoading(false);
    }
    // Si el pago requiere redirección, Stripe lo maneja automáticamente.
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Resumen de la donación */}
      <div className="px-4 py-3 rounded-lg bg-navy border border-white/10 flex justify-between items-center">
        <div>
          <p className="text-white/60 text-xs">Donación para</p>
          <p className="text-white text-sm font-semibold capitalize">
            {PURPOSES.find(p => p.value === donationData.donation_purpose)?.label ?? 'Fondo General'}
          </p>
        </div>
        <span className="text-gold font-black text-2xl">Q{donationData.amount}</span>
      </div>

      {/* Stripe PaymentElement — Stripe renderiza el formulario de tarjeta */}
      <div className="rounded-lg border border-line dark:border-white/10 p-4 bg-card-2">
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { name: 'never', email: 'never' } },
          }}
        />
      </div>

      <Button
        type="submit" variant="gold" size="lg" className="w-full"
        disabled={!stripe || !elements || loading}
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Procesando...</>
          : <><Lock size={14} /> Confirmar donación — Q{donationData.amount}</>
        }
      </Button>

      <button
        type="button" onClick={onBack}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-3 hover:text-ink transition-colors py-1"
      >
        <ArrowLeft size={12} /> Cambiar monto
      </button>

      <p className="text-center text-xs text-ink-3">
        Pago procesado de forma segura por <span className="text-ink-2 font-medium">Stripe</span>.
        Nunca almacenamos datos de tu tarjeta.
      </p>
    </form>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DonationCard() {
  const [step,         setStep]         = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [donationData, setDonationData] = useState(null);
  const [loading,      setLoading]      = useState(false);

  const handleDonationDetails = async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/donations/create-payment-intent', data);
      setClientSecret(res.data.client_secret);
      setDonationData(data);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al conectar con el servidor de pagos.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setClientSecret('');
    setDonationData(null);
  };

  if (step === 2 && clientSecret && stripePromise) {
    // Opciones de apariencia para que Stripe Elements herede el tema de la app
    const appearance = {
      theme: 'stripe',
      variables: {
        colorPrimary:       '#2563eb',
        colorBackground:    'transparent',
        colorText:          'inherit',
        colorDanger:        '#ef4444',
        fontFamily:         'inherit',
        borderRadius:       '6px',
      },
    };

    return (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <CheckoutForm donationData={donationData} onBack={handleBack} />
      </Elements>
    );
  }

  return <DonationForm onNext={handleDonationDetails} loading={loading} />;
}

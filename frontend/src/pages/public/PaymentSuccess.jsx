import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, XCircle, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import apiClient from '../../lib/apiClient';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'failed'
  const [intentId, setIntentId] = useState('');

  useEffect(() => {
    const paymentMethod = searchParams.get('payment_method');
    const token = searchParams.get('token'); // PayPal order ID
    const paymentIntentSecret = searchParams.get('payment_intent_client_secret');
    const paymentIntentId = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    setIntentId(paymentIntentId ?? token ?? '');

    // PayPal: capturar orden al regresar
    if (paymentMethod === 'paypal' && token) {
      apiClient.post('/donations/capture-paypal-order', { order_id: token })
        .then(() => setStatus('success'))
        .catch(() => setStatus('failed'));
      return;
    }

    // Stripe: redirect_status=succeeded
    if (redirectStatus === 'succeeded') {
      setStatus('success');
      return;
    }

    if (redirectStatus === 'failed') {
      setStatus('failed');
      return;
    }

    // Stripe: verificar con client_secret
    if (paymentIntentSecret && stripePromise) {
      stripePromise.then(stripe => {
        if (!stripe) { setStatus('failed'); return; }
        stripe.retrievePaymentIntent(paymentIntentSecret).then(({ paymentIntent }) => {
          if (paymentIntent?.status === 'succeeded') setStatus('success');
          else setStatus('failed');
        }).catch(() => setStatus('failed'));
      });
    } else {
      setStatus('success');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue" />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-5">
            <XCircle size={32} className="text-error" />
          </div>
          <h1 className="text-2xl font-black text-ink mb-2">Pago no completado</h1>
          <p className="text-ink-2 text-sm leading-relaxed mb-8">
            El pago no pudo ser procesado. Por favor, verifica los datos de tu tarjeta e inténtalo de nuevo.
          </p>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy-d transition-colors"
          >
            Intentar de nuevo
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ok/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-ok" />
        </div>
        <h1 className="text-2xl font-black text-ink mb-2">¡Donación exitosa!</h1>
        <p className="text-ink-2 text-sm leading-relaxed mb-2">
          Gracias por tu generosidad. Tu donación ha sido procesada y registrada correctamente.
        </p>
        <p className="text-ink-3 text-xs mb-2">
          Dios multiplica cada semilla sembrada con fe.
        </p>
        {intentId && (
          <p className="text-ink-3 text-xs font-mono mb-6 bg-card border border-line rounded px-3 py-1.5 inline-block">
            Ref: {intentId}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy-d transition-colors"
          >
            Volver al inicio
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 px-6 py-3 border border-line text-ink font-medium rounded-md hover:bg-card-2 transition-colors text-sm"
          >
            Donar de nuevo
          </Link>
        </div>
      </div>
    </div>
  );
}

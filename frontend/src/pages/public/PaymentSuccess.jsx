import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ok/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-ok" />
        </div>
        <h1 className="text-2xl font-black text-ink mb-2">¡Donación exitosa!</h1>
        <p className="text-ink-2 text-sm leading-relaxed mb-2">
          Gracias por tu generosidad. Tu donación ha sido registrada correctamente.
        </p>
        <p className="text-ink-3 text-xs mb-8">
          Dios multiplica cada semilla sembrada con fe.
        </p>
        <Link to="/"
          className="group inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy-d transition-colors">
          Volver al inicio
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

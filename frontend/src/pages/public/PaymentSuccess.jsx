import { Link } from 'react-router-dom';
import AuthCard from '../../components/ui/AuthCard';

export default function PaymentSuccess() {
  return (
    <AuthCard className="text-center">
        <h1 className="text-26 font-bold text-white mb-2">¡Donación registrada!</h1>
        <p className="text-15 text-white/60 leading-relaxed mb-2">
          Gracias por tu generosidad. Un coordinador se comunicará contigo para confirmar el proceso.
        </p>
        <p className="text-14 text-white/40 mb-8">Dios multiplica cada semilla sembrada con fe.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3.5 rounded-pill bg-white text-bg font-bold text-14">
            Volver al inicio
          </Link>
          <Link to="/donate" className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-pill liquid-glass text-white font-bold text-14">
            Donar de nuevo
          </Link>
        </div>
    </AuthCard>
  );
}

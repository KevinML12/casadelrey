import { Link } from 'react-router-dom';
import Reveal from '../../components/ui/Reveal';
import { Icon } from '../../components/ui/Glass';

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <Reveal className="text-center max-w-sm liquid-glass rounded-[28px] p-10">
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-5">
          <Icon name="heart" className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-[22px] font-bold text-white mb-2">¡Donación registrada!</h1>
        <p className="text-[15px] text-white/60 leading-relaxed mb-2">
          Gracias por tu generosidad. Un coordinador se comunicará contigo para confirmar el proceso.
        </p>
        <p className="text-[13.5px] text-white/40 mb-8">Dios multiplica cada semilla sembrada con fe.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-pill bg-white text-bg font-bold text-[14px]">
            <Icon name="arrow" className="w-4 h-4 rotate-180" />
            Volver al inicio
          </Link>
          <Link to="/donate" className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-pill liquid-glass text-white font-bold text-[14px]">
            Donar de nuevo
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-surf flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ter-con flex items-center justify-center mx-auto mb-5">
          <span className="ms text-on-ter-con" style={{ fontSize: 32 }}>volunteer_activism</span>
        </div>
        <h1 className="text-headline-s text-on-surf font-black mb-2">¡Donación registrada!</h1>
        <p className="text-body-m text-on-surf-var leading-relaxed mb-2">
          Gracias por tu generosidad. Un coordinador se comunicará contigo para confirmar el proceso.
        </p>
        <p className="text-body-s text-on-surf-var mb-8">Dios multiplica cada semilla sembrada con fe.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity">
            <span className="ms" style={{ fontSize: 18 }}>home</span>
            Volver al inicio
          </Link>
          <Link to="/donate"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-outline-var text-on-surf text-label-l font-medium hover:bg-surf-high transition-colors">
            Donar de nuevo
          </Link>
        </div>
      </div>
    </div>
  );
}

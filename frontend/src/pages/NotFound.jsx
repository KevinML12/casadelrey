import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surf flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        <p className="text-display-l text-outline-var font-black mb-4">404</p>
        <h1 className="text-headline-s text-on-surf font-black mb-2">Página no encontrada</h1>
        <p className="text-body-m text-on-surf-var mb-8">La página que buscas no existe o fue movida.</p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity">
          <span className="ms" style={{ fontSize: 18 }}>home</span>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

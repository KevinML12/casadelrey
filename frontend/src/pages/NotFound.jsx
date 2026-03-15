import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-black text-line mb-4">404</p>
        <h1 className="text-2xl font-black text-ink mb-2">Página no encontrada</h1>
        <p className="text-ink-3 text-sm mb-8">La página que buscas no existe o fue movida.</p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy-d transition-colors">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

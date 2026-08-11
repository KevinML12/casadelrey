import { Link } from 'react-router-dom';
import Reveal from '../components/ui/Reveal';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <Reveal className="text-center max-w-sm liquid-glass rounded-[28px] p-10">
        {/* text-d2 en vez del último display-mega + fontSize inline que
            quedaba vivo. Vive en pages/ y no en pages/public/, así que se
            escapaba de los greps del refactor -- pero es una pantalla
            pública: se ve en cualquier URL rota. */}
        <p className="text-d2 text-white/20">404</p>
        <h1 className="text-22 font-bold text-white mt-2 mb-2">Página no encontrada</h1>
        <p className="text-15 text-white/60 mb-8">La página que buscas no existe o fue movida.</p>
        <Link to="/" className="inline-flex items-center px-6 py-3.5 rounded-pill bg-white text-bg font-bold text-14">
          Volver al inicio
        </Link>
      </Reveal>
    </div>
  );
}

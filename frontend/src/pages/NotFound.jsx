import { Link } from 'react-router-dom';
import Reveal from '../components/ui/Reveal';
import { Icon } from '../components/ui/Glass';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <Reveal className="text-center max-w-sm liquid-glass rounded-[28px] p-10">
        <p className="display-mega text-white/20" style={{ fontSize: '4.5rem' }}>404</p>
        <h1 className="text-[22px] font-bold text-white mt-2 mb-2">Página no encontrada</h1>
        <p className="text-[15px] text-white/60 mb-8">La página que buscas no existe o fue movida.</p>
        <Link to="/" className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-pill bg-white text-bg font-bold text-[14px]">
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Volver al inicio
        </Link>
      </Reveal>
    </div>
  );
}

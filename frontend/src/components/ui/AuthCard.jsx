import Reveal from './Reveal';
import ParallaxImg from './ParallaxImg';
import { useSitePhoto } from '../../lib/feed';

/**
 * AuthCard — card de cristal centrada que comparten todas las
 * pantallas de autenticación (login, registro, recuperar/resetear
 * contraseña, verificar correo). Una sola envoltura visual para que
 * todo el flujo de auth se sienta como una sola pieza.
 *
 * Con FOTO REAL de fondo ("hero de fondo siempre" — la guía): sin
 * ella, el cristal flotaba sobre navy plano y se leía como caja gris
 * genérica; el material necesita algo detrás que difuminar. Slot
 * administrable hero_auth; fallback local de Galaxy Party (WILD YOUTH).
 */
export default function AuthCard({ children, className = '' }) {
  const bg = useSitePhoto('hero_auth', '/images/bg-auth.jpg');
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
      <ParallaxImg src={bg} alt="" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/45 to-bg pointer-events-none" />
      <Reveal className={`relative z-10 w-full max-w-md liquid-glass rounded-[28px] p-8 md:p-10 ${className}`}>
        {children}
      </Reveal>
    </div>
  );
}

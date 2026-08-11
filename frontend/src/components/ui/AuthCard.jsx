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
      {/* Foto a color pleno + .scrim-hero: llevaba `opacity-45` MÁS un
          degradado de tres paradas encima, así que llegaba a ~un cuarto de
          su color real. El contraste lo pone el scrim, que oscurece el
          óvalo central donde vive la card y deja respirar los bordes. */}
      <ParallaxImg src={bg} alt="" />
      <div className="scrim-hero" />
      <Reveal className={`relative z-10 w-full max-w-md liquid-glass rounded-[28px] p-8 md:p-10 ${className}`}>
        {children}
      </Reveal>
    </div>
  );
}

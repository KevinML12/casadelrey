import Reveal from './Reveal';

/**
 * AuthCard — card de cristal centrada que comparten todas las
 * pantallas de autenticación (login, registro, recuperar/resetear
 * contraseña, verificar correo). Una sola envoltura visual para que
 * todo el flujo de auth se sienta como una sola pieza.
 */
export default function AuthCard({ children, className = '' }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
      <Reveal className={`w-full max-w-md liquid-glass rounded-[28px] p-8 md:p-10 ${className}`}>
        {children}
      </Reveal>
    </div>
  );
}

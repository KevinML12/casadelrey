import { Link } from 'react-router-dom';
import { Icon, Eyebrow, GlassButton } from '../../components/ui/Glass';
import Reveal from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';

export default function Register() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-bg flex items-center">
      <Reveal className="relative z-10 w-full max-w-xl mx-auto px-6 text-center">
        <Eyebrow>Únete a la familia</Eyebrow>

        <h1 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)' }}>
          Obtener una cuenta.
        </h1>

        <Tilt max={3} className="mt-10 liquid-glass rounded-[24px] p-8 md:p-10 text-left">
          <div className="flex items-start gap-4">
            <span className="grid place-items-center w-12 h-12 rounded-full bg-white/10 border border-white/15 text-white shrink-0">
              <Icon name="users" className="w-5 h-5" />
            </span>
            <p className="text-[15.5px] leading-relaxed text-white/80">
              Las cuentas las crea un <span className="font-bold text-white">líder o administrador</span>.
              Si quieres unirte, contacta a tu líder de célula o al equipo para que te den acceso.
            </p>
          </div>

          <div className="my-7 h-px bg-white/10" />

          <p className="text-[14px] text-white/60 leading-relaxed">
            ¿Te interesa servir?{' '}
            <Link to="/volunteering" className="text-white font-bold hover:text-white/70 transition-colors">
              Inscríbete como voluntario
            </Link>{' '}
            y el equipo se comunicará contigo.
          </p>
        </Tilt>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <GlassButton as={Link} to="/login" variant="primary" icon="arrow">
            Ya tengo cuenta · Ingresar
          </GlassButton>
          <GlassButton as={Link} to="/" variant="glass">
            Volver al inicio
          </GlassButton>
        </div>
      </Reveal>
    </section>
  );
}

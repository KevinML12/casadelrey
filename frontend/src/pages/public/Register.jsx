import { Link } from 'react-router-dom';
import { Icon, Halos, GlassButton } from '../../components/ui/Glass';

export default function Register() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-bg text-ink flex items-center">
      <Halos variant="hero" />
      <div className="relative z-10 w-full max-w-xl mx-auto px-6 text-center rise">
        <div className="inline-flex items-center gap-2 mb-7">
          <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
          <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">
            Ãšnete a la familia
          </span>
        </div>

        <h1
          className="display-mega text-ink"
          style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)' }}
        >
          Obtener una{' '}
          <span className="text-grad-celeste">
            cuenta
          </span>
          .
        </h1>

        <div className="mt-10 bg-bg border border-ink-soft shadow-card-lg rounded-card p-8 md:p-10 text-left">
          <div className="flex items-start gap-4">
            <span className="grid place-items-center w-12 h-12 rounded-sm bg-bg-soft text-celeste shrink-0">
              <Icon name="users" className="w-6 h-6" />
            </span>
            <p className="text-[15.5px] leading-relaxed text-ink">
              Las cuentas las crea un{' '}
              <span className="font-bold text-ink">lÃ­der o administrador</span>. Si quieres
              unirte, contacta a tu lÃ­der de cÃ©lula o al equipo para que te den acceso.
            </p>
          </div>

          <div className="my-7 h-px bg-white/10" />

          <p className="text-[14px] text-ink-2 leading-relaxed">
            Â¿Te interesa servir?{' '}
            <Link to="/volunteering" className="text-celeste font-bold hover:text-electric transition-colors">
              InscrÃ­bete como voluntario
            </Link>{' '}
            y el equipo se comunicarÃ¡ contigo.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <GlassButton as={Link} to="/login" variant="primary" icon="arrow">
            Ya tengo cuenta Â· Ingresar
          </GlassButton>
          <GlassButton as={Link} to="/" variant="glass">
            Volver al inicio
          </GlassButton>
        </div>
      </div>
    </section>
  );
}

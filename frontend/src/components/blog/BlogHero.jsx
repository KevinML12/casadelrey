// ============================================================
//  BlogHero — encabezado de texto del listado de Blog. El fondo de
//  foto vive en BlogPage.jsx (mismo patrón que Células/Galería: un
//  solo ParallaxImg cubriendo TODA la página, no solo esta sección).
// ============================================================
import { Eyebrow } from '../ui/Glass';
import Reveal from '../ui/Reveal';

export default function BlogHero() {
  return (
    <section className="pt-40 pb-8 max-w-6xl mx-auto px-6 text-center flex flex-col items-center">
      <Reveal>
        <Eyebrow>Enseñanzas</Eyebrow>
        <h1 className="display-mega text-white mt-4 mb-4" style={{ fontSize: 'clamp(2.6rem, 7vw, 4.5rem)' }}>
          Blog
        </h1>
        <p className="text-[17px] text-white/70 max-w-xl mx-auto">
          Enseñanzas, reflexiones y mensajes para tu crecimiento espiritual.
        </p>
      </Reveal>
    </section>
  );
}

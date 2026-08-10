// ============================================================
//  BlogHero — encabezado del listado de Blog. Envoltorio delgado sobre
//  el PageHero compartido: antes reimplementaba a mano el mismo bloque
//  (padding/eyebrow/h1/subtitle) que ya vive en components/layout/
//  PageHero.jsx. Ahora es dueño de su propia foto (slot "hero_blog",
//  mismo admin-editable que usaba BlogPage.jsx antes) en vez de
//  depender de un ParallaxImg de página completa -- así el fondo queda
//  acotado al hero, igual que el resto de páginas migradas a PageHero.
// ============================================================
import PageHero from '../layout/PageHero';

export default function BlogHero() {
  return (
    <PageHero
      eyebrow="Enseñanzas"
      title="Blog"
      subtitle="Enseñanzas, reflexiones y mensajes para tu crecimiento espiritual."
      photoSlot="hero_blog"
      photoFallback="/images/bg-ensenanzas.jpg"
    />
  );
}

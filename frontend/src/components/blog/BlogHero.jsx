// ============================================================
//  BlogHero — encabezado del listado de Blog. Envoltorio delgado sobre
//  el PageHero compartido: antes reimplementaba a mano el mismo bloque
//  (padding/eyebrow/h1/subtitle) que ya vive en components/layout/
//  PageHero.jsx. Ahora es dueño de su propia foto (slot "hero_blog",
//  mismo admin-editable que usaba BlogPage.jsx antes) en vez de
//  depender de un ParallaxImg de página completa -- así el fondo queda
//  acotado al hero, igual que el resto de páginas migradas a PageHero.
//
//  Ya no pasa `eyebrow="Enseñanzas"`: PageHero dejó de aceptar ese prop
//  cuando se borró el Eyebrow del sitio, así que era un prop muerto que
//  no pintaba nada. El alineado queda en el default `left` de PageHero,
//  que es el que corresponde a una página narrativa como esta.
// ============================================================
import PageHero from '../layout/PageHero';

export default function BlogHero() {
  return (
    <PageHero
      title="Blog"
      subtitle="Enseñanzas, reflexiones y mensajes para tu crecimiento espiritual."
      photoSlot="hero_blog"
      photoFallback="/images/bg-ensenanzas.jpg"
    />
  );
}

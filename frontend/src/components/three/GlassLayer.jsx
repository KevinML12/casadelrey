// ============================================================
//  GlassLayer — gate liviano. NO importa three/fiber/drei directo:
//  eso vive en GlassLayerCanvas.jsx, cargado perezoso solo cuando
//  hace falta. Sin este gate, el bundle principal cargaría three.js
//  en CADA página (incluido login/admin) aunque no haya ni una sola
//  card con `glass` en pantalla.
// ============================================================
import { lazy, Suspense, useMemo } from 'react';
import { useGlassLayer } from './GlassLayerContext';
import use3D from './use3D';

const GlassLayerCanvas = lazy(() => import('./GlassLayerCanvas'));

export default function GlassLayer() {
  const layer = useGlassLayer();
  const show3D = use3D();

  const hasItems = useMemo(
    () => (layer ? layer.registry.current.size > 0 : false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layer?.version]
  );

  if (!show3D || !hasItems) return null;

  return (
    <Suspense fallback={null}>
      <GlassLayerCanvas />
    </Suspense>
  );
}

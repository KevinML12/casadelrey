// ============================================================
//  StarField — el polvo de luz 3D global ("las estrellitas"),
//  montado UNA vez en App.jsx para que viva detrás de TODAS las
//  páginas públicas. Las cards de cristal (backdrop-blur) lo
//  difuminan de verdad — esa es la fusión liquid glass + 3D.
// ============================================================
import { lazy, Suspense } from 'react';
import use3D from './use3D';

const ParticleField = lazy(() => import('./ParticleField'));

export default function StarField() {
  const show3D = use3D();
  if (!show3D) return null;
  return (
    <Suspense fallback={null}>
      <div aria-hidden className="fixed inset-0 z-[4] pointer-events-none mix-blend-screen">
        <ParticleField />
      </div>
    </Suspense>
  );
}

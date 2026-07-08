// ============================================================
//  use3D — gate compartido para los canvas 3D decorativos:
//  solo desktop con mouse fino y sin prefers-reduced-motion.
//  En móvil / reduced-motion nada 3D se descarga ni se monta.
// ============================================================
import { useState, useEffect } from 'react';

export default function use3D() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(
      matchMedia('(pointer: fine)').matches &&
      matchMedia('(min-width: 1024px)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);
  return ok;
}

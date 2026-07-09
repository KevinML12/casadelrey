// ============================================================
//  GlassLayerContext — registro compartido de "paneles de vidrio":
//  cualquier card en cualquier página puede pedir un panel de
//  refracción real detrás de sí (vía Tilt `glass="standard"|"featured"`).
//  Un solo <GlassLayer> (montado una vez en App.jsx) los renderiza
//  TODOS en un único canvas — three.js comparte el costo de la
//  pasada de transmisión entre todos los paneles de esa escena,
//  así que "vidrio en cada card" no significa "un canvas por card".
// ============================================================
import { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from 'react';

const GlassLayerContext = createContext(null);

export function GlassLayerProvider({ children }) {
  const registry = useRef(new Map());
  const [version, setVersion] = useState(0);

  const register = useCallback((id, el, variant) => {
    registry.current.set(id, { el, variant });
    setVersion(v => v + 1);
  }, []);

  const unregister = useCallback((id) => {
    registry.current.delete(id);
    setVersion(v => v + 1);
  }, []);

  // Memoizado: sin esto, cada registro crea un objeto nuevo y cualquier
  // efecto que dependa de "layer" completo se re-dispara en cascada
  // (cada card re-registra a todas las demás → loop infinito de renders).
  const value = useMemo(() => ({ registry, register, unregister, version }), [register, unregister, version]);

  return (
    <GlassLayerContext.Provider value={value}>
      {children}
    </GlassLayerContext.Provider>
  );
}

export function useGlassLayer() {
  return useContext(GlassLayerContext);
}

let uid = 0;
export const nextGlassId = () => `glass-${++uid}`;

// Sin mouse fino o con reduced-motion, el vidrio WebGL no aporta nada
// (no hay tilt que lo justifique) — mismo criterio que Tilt.jsx.
const FINE =
  typeof window !== 'undefined' &&
  matchMedia('(pointer: fine)').matches &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * useGlassPane — registra CUALQUIER elemento (vía ref) en el GlassLayer
 * compartido. Úsalo cuando el card ya tiene su propia animación (p.ej.
 * layout FLIP de framer-motion) y envolverlo en <Tilt> rompería eso.
 *
 * @param {React.RefObject} ref
 * @param {'standard'|'featured'|false} variant — false/undefined desactiva
 */
export function useGlassPane(ref, variant) {
  const layer = useGlassLayer();
  const idRef = useRef(null);
  // OJO: depender del objeto `layer` completo (en vez de register/
  // unregister sueltos) revive el loop infinito de arriba — `layer`
  // cambia de identidad cada vez que CUALQUIER card registra, no
  // solo esta. register/unregister son estables (useCallback con
  // deps []): son lo único seguro para el array de dependencias.
  const register = layer?.register;
  const unregister = layer?.unregister;

  useEffect(() => {
    if (!variant || !register || !unregister || !FINE || !ref.current) return;
    idRef.current ||= nextGlassId();
    register(idRef.current, ref.current, variant);
    return () => unregister(idRef.current);
  }, [variant, register, unregister, ref]);
}

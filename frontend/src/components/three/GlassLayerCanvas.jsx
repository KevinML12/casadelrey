// ============================================================
//  GlassLayer — el canvas ÚNICO y compartido que dibuja el vidrio
//  de TODAS las cards registradas (Tilt con `glass`). Cámara
//  ortográfica en px reales: 1 unidad tres.js = 1px de pantalla,
//  así cada panel se puede posicionar leyendo directo el
//  getBoundingClientRect() de su card, sin matemática de proyección.
//  Recalcula posición cada frame (no vía React state) — soporta
//  a Lenis, scroll normal y resize sin listeners especiales.
// ============================================================
import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, RoundedBox } from '@react-three/drei';
import { useGlassLayer } from './GlassLayerContext';
import use3D from './use3D';

const FEATURED_PROPS = {
  thickness: 0.5, roughness: 0.08, transmission: 1, ior: 1.4,
  chromaticAberration: 0.035, anisotropy: 0.1, distortion: 0.1,
  distortionScale: 0.2, temporalDistortion: 0.1, color: '#BFD9FF',
};

// Cámara ortográfica: actualiza el frustum al tamaño real de la
// ventana en cada resize, para que 1 unidad siga siendo 1px.
function OrthoRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.left = 0;
    camera.right = size.width;
    camera.top = 0;
    camera.bottom = -size.height;
    camera.near = -1000;
    camera.far = 1000;
    camera.position.z = 100;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Pane({ el, variant }) {
  const ref = useRef();
  const visible = useRef(true);

  useFrame(() => {
    if (!ref.current || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    // Fuera de pantalla (con margen) → no calcules ni muestres: ahorra GPU
    const offscreen = r.bottom < -200 || r.top > window.innerHeight + 200 || r.width === 0;
    if (offscreen) {
      if (visible.current) { ref.current.visible = false; visible.current = false; }
      return;
    }
    if (!visible.current) { ref.current.visible = true; visible.current = true; }
    ref.current.position.set(r.left + r.width / 2, -(r.top + r.height / 2), 0);
    ref.current.scale.set(Math.max(r.width, 1), Math.max(r.height, 1), 1);
  });

  const radius = 0.16; // proporción del lado corto, RoundedBox la escala con el mesh

  return (
    <mesh ref={ref}>
      <RoundedBox args={[1, 1, 0.06]} radius={radius} smoothness={3} />
      {variant === 'featured' ? (
        <MeshTransmissionMaterial {...FEATURED_PROPS} />
      ) : (
        // Variante liviana: material nativo de three.js (una sola pasada,
        // sin las muestras extra de MeshTransmissionMaterial) — barato de
        // repetir en muchas cards a la vez.
        <meshPhysicalMaterial
          transmission={1}
          thickness={0.4}
          roughness={0.12}
          ior={1.3}
          color="#BFD9FF"
          attenuationColor="#BFD9FF"
          attenuationDistance={2}
        />
      )}
    </mesh>
  );
}

function Scene({ items }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[0, 5, 5]} intensity={1} />
      <Environment preset="city" resolution={64} background={false} />
      {items.map(({ id, el, variant }) => <Pane key={id} el={el} variant={variant} />)}
    </>
  );
}

export default function GlassLayer() {
  const layer = useGlassLayer();
  const show3D = use3D();
  const [active, setActive] = useState(true);

  useEffect(() => {
    const onVis = () => setActive(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const items = useMemo(() => {
    if (!layer) return [];
    return [...layer.registry.current.entries()].map(([id, v]) => ({ id, ...v }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer?.version]);

  if (!show3D || !layer || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[6] pointer-events-none" aria-hidden>
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        frameloop={active ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <OrthoRig />
        <Scene items={items} />
      </Canvas>
    </div>
  );
}

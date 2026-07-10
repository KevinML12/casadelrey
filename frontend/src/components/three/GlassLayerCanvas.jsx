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
import { RoundedBox } from '@react-three/drei';
import { useGlassLayer } from './GlassLayerContext';
import use3D from './use3D';

// CLAVE (lección de las 3 pasadas anteriores): un material de TRANSMISIÓN
// sólo refracta lo que está DENTRO de la escena three.js (el Environment)
// — NUNCA la foto del DOM detrás del canvas. Por eso, por más que se
// ajustara el tinte, el panel SIEMPRE se veía como una caja de color
// opaca: estaba refractando el cielo "night", no la foto de fondo.
// Para que el vidrio sea DE VERDAD transparente y deje ver la foto,
// usamos material físico SEMITRANSPARENTE (transparent + opacity baja):
// el alpha del canvas deja pasar la foto real que está detrás (z menor),
// y el backdrop-filter del CSS de la card la difumina como cristal
// líquido. clearcoat = el brillo especular que corre por el borde.
const GLASS = {
  standard: { opacity: 0.12, color: '#5A86D0', roughness: 0.2, ior: 1.42 },
  featured: { opacity: 0.17, color: '#6A93DC', roughness: 0.14, ior: 1.5 },
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
  const p = GLASS[variant === 'featured' ? 'featured' : 'standard'];

  return (
    <mesh ref={ref}>
      <RoundedBox args={[1, 1, 0.06]} radius={radius} smoothness={3} />
      {/* Semitransparente (NO transmission): deja ver la foto de fondo por
          el alpha del canvas. SIN clearcoat y SIN Environment: la "capa
          blanca" que lavaba todo era justo eso — el clearcoat reflejaba el
          HDRI a lo ancho de TODO el panel como un velo blanco. Ahora el
          único brillo es el specular puntual de UNA luz direccional (un
          glint chico, no un velo). depthWrite=false para que los paneles
          semitransparentes no se recorten mal entre sí. */}
      <meshPhysicalMaterial
        transparent
        opacity={p.opacity}
        color={p.color}
        roughness={p.roughness}
        metalness={0}
        ior={p.ior}
        specularIntensity={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

function Scene({ items }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      {/* Sin Environment (reflejaba el HDRI como velo blanco). Una sola
          direccional da el glint especular puntual que corre por el panel
          al hacer scroll; la segunda, celeste y floja, tinta el lado
          opuesto sin lavarlo. */}
      <directionalLight position={[3, 6, 8]} intensity={0.9} />
      <directionalLight position={[-5, -3, 5]} intensity={0.4} color="#8FB4F5" />
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

// ============================================================
//  GlassOrnament — vidrio líquido con refracción REAL (no CSS
//  simulada): MeshTransmissionMaterial de drei. Un cluster de 2-3
//  formas flotando, refractando de verdad lo que hay detrás.
//  Costo real: primer uso en una página carga three+fiber+drei
//  (~260KB gzip) — lazy, gated a desktop, pausado fuera de viewport.
// ============================================================
import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const GLASS_PROPS = {
  thickness: 0.6,
  roughness: 0.06,
  transmission: 1,
  ior: 1.4,
  chromaticAberration: 0.04,
  anisotropy: 0.15,
  distortion: 0.15,
  distortionScale: 0.3,
  temporalDistortion: 0.15,
  color: '#BFD9FF',
  backside: true,
};

function Shard({ geometry: Geom, position, scale, speed, tint }) {
  const ref = useRef();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.12 * speed;
    ref.current.rotation.y += dt * 0.18 * speed;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 * speed + position[0]) * 0.12;
    const { x, y } = pointer.current;
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, x * 0.08, 0.02);
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      {Geom}
      <MeshTransmissionMaterial {...GLASS_PROPS} color={tint} />
    </mesh>
  );
}

function Scene() {
  const shapes = useMemo(() => [
    { geometry: <icosahedronGeometry args={[1, 0]} />, position: [-1.1, 0.3, 0], scale: 0.85, speed: 0.8, tint: '#BFD9FF' },
    { geometry: <torusGeometry args={[0.7, 0.28, 32, 64]} />, position: [1.2, -0.4, -0.4], scale: 0.9, speed: 1.1, tint: '#9CC2FF' },
    { geometry: <RoundedBox args={[1.1, 1.1, 1.1]} radius={0.18} smoothness={4} />, position: [0.1, 0.9, -0.8], scale: 0.55, speed: 1.4, tint: '#E8F1FF' },
  ], []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} />
      <Environment preset="city" resolution={128} background={false} />
      {shapes.map((s, i) => <Shard key={i} {...s} />)}
    </>
  );
}

export default function GlassOrnament({ className = '' }) {
  const wrapRef = useRef(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const kicks = [100, 600].map(ms => setTimeout(() => window.dispatchEvent(new Event('resize')), ms));
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => { kicks.forEach(clearTimeout); io.disconnect(); };
  }, []);

  return (
    <div ref={wrapRef} className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={active ? 'always' : 'never'}
        camera={{ position: [0, 0, 4.5], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ pointerEvents: 'none' }}
        onCreated={(st) => { if (import.meta.env.DEV) (window.__r3f ||= []).push(st); }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

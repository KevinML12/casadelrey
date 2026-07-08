// ============================================================
//  ParticleField — polvo de luz 3D global ("Luz para las Naciones")
//  Una sola capa fixed detrás de todo el Home: las cards de cristal
//  (backdrop-blur) difuminan las partículas que quedan detrás — esa
//  es la fusión LIQUID GLASS + 3D. Parallax por profundidad al
//  scrollear, drift orgánico y empuje suave alrededor del cursor.
//  Mismo lenguaje visual que el globo: puntos que titilan, aditivos.
// ============================================================
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 850;
const SLAB_H = 11; // alto del volumen; los puntos hacen wrap vertical

const VERT = /* glsl */ `
  #define SLAB_H 11.0
  #define HALF_H 5.5
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uPointer;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vTwinkle = 0.7 + 0.3 * sin(uTime * 1.1 + aPhase * 3.0);
    vec3 p = position;

    // drift orgánico lento, distinto por punto
    p.x += sin(uTime * 0.11 + aPhase * 5.0) * 0.4;
    p.y += cos(uTime * 0.08 + aPhase * 7.0) * 0.3;

    // parallax: los puntos cercanos acompañan más el scroll que los
    // lejanos — la diferencia de velocidades es lo que crea profundidad
    float depth = clamp((-p.z - 2.0) / 7.0, 0.0, 1.0); // 0 cerca · 1 lejos
    p.y = mod(p.y + uScroll * mix(0.85, 0.2, depth) + HALF_H, SLAB_H) - HALF_H;

    // el cursor abre un claro suave a su alrededor
    vec2 d = p.xy - uPointer;
    p.xy += (d / max(length(d), 0.001)) * exp(-dot(d, d) * 0.3) * 0.7;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * vTwinkle * (320.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.1, d);
    gl_FragColor = vec4(vColor * vTwinkle, a);
  }
`;

function Field() {
  const mat = useRef();
  const pointer = useRef({ x: 0, y: 0 });

  // El canvas es pointer-events-none: el cursor se rastrea por window
  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const geometry = useMemo(() => {
    const pos = [], col = [], size = [], phase = [];
    const dim = new THREE.Color('#2A4A7E');
    const mid = new THREE.Color('#6E96D8');
    const hi  = new THREE.Color('#EAF2FF');
    for (let i = 0; i < COUNT; i++) {
      pos.push(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * SLAB_H,
        -2 - Math.random() * 7
      );
      const r = Math.random();
      const c = r < 0.06 ? hi : r < 0.28 ? mid : dim;
      col.push(c.r, c.g, c.b);
      size.push(r < 0.06 ? 0.055 : 0.028 + Math.random() * 0.02);
      phase.push(Math.random() * Math.PI * 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.Float32BufferAttribute(phase, 1));
    return g;
  }, []);

  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uScroll:  { value: 0 },
    uPointer: { value: new THREE.Vector2(99, 99) },
  }), []);

  useFrame((state) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uScroll.value = window.scrollY * 0.0022;
    // pointer NDC → coordenadas de mundo en el plano medio del volumen
    const v = state.viewport;
    u.uPointer.value.set(
      pointer.current.x * v.width * 0.85,
      pointer.current.y * v.height * 0.85
    );
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleField() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 55 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      style={{ pointerEvents: 'none' }}
      onCreated={(st) => { if (import.meta.env.DEV) (window.__r3f ||= []).push(st); }}
    >
      <Field />
    </Canvas>
  );
}

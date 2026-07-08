// ============================================================
//  GlobeHero — globo terráqueo de puntos ("Luz para las Naciones")
//  Imita el logo: continentes reales en puntos que titilan, halo
//  atmosférico y retícula tenue. Rota lento y sigue al cursor.
//  Carga lazy: solo desktop con pointer fino y sin reduced-motion.
//  El wrapper usa mix-blend-screen: todo lo negro es transparente,
//  por eso el occluder trasero es una esfera negra opaca.
// ============================================================
import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isLand } from './landmask';

const RADIUS = 2;

// --- Shader de puntos: titileo por-punto, disco suave con halo ---
const DOT_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.78 + 0.22 * sin(uTime * 1.3 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * vTwinkle * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const DOT_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.12, d);
    gl_FragColor = vec4(vColor * vTwinkle, a);
  }
`;

// --- Halo atmosférico: fresnel aditivo en la cara trasera ---
const GLOW_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const GLOW_FRAG = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float glow = pow(0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
    gl_FragColor = vec4(vec3(0.35, 0.55, 1.0) * glow, glow);
  }
`;

// Continentes brillantes + océano tenue, distribuidos en esfera de
// Fibonacci y filtrados contra el landmask equirectangular.
function useGlobeGeometry(candidates = 24000) {
  return useMemo(() => {
    const pos = [], col = [], size = [], phase = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    const land = new THREE.Color('#BFD9FF');
    const landHi = new THREE.Color('#FFFFFF');
    const ocean = new THREE.Color('#22406E');
    const c = new THREE.Color();

    for (let i = 0; i < candidates; i++) {
      const y = 1 - (i / (candidates - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      const x = Math.cos(t) * r, z = Math.sin(t) * r;
      const lat = (Math.asin(y) * 180) / Math.PI;
      const lon = (Math.atan2(z, x) * 180) / Math.PI;

      if (isLand(lat, lon)) {
        c.copy(land).lerp(landHi, Math.random() * 0.55);
        size.push(0.052 + Math.random() * 0.026);
      } else {
        if (Math.random() > 0.16) continue; // océano ralo
        c.copy(ocean);
        size.push(0.034);
      }
      pos.push(x * RADIUS, y * RADIUS, z * RADIUS);
      col.push(c.r, c.g, c.b);
      phase.push(Math.random() * Math.PI * 2);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.Float32BufferAttribute(phase, 1));
    return g;
  }, [candidates]);
}

// Retícula: paralelos + meridianos cada 30°, apenas visibles
function useGraticule(radius = RADIUS * 0.995, step = 30, segs = 96) {
  return useMemo(() => {
    const pts = [];
    const push = (lat, lon) => {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      pts.push(
        Math.cos(la) * Math.cos(lo) * radius,
        Math.sin(la) * radius,
        Math.cos(la) * Math.sin(lo) * radius
      );
    };
    for (let lat = -60; lat <= 60; lat += step)
      for (let i = 0; i < segs; i++) {
        push(lat, (i / segs) * 360);
        push(lat, ((i + 1) / segs) * 360);
      }
    for (let lon = 0; lon < 360; lon += step)
      for (let i = 0; i < segs; i++) {
        push(-90 + (i / segs) * 180, lon);
        push(-90 + ((i + 1) / segs) * 180, lon);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [radius, step, segs]);
}

function Globe() {
  const group = useRef();
  const dotsMat = useRef();
  const pointer = useRef({ x: 0, y: 0 });
  const dots = useGlobeGeometry();
  const grid = useGraticule();

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  // El canvas es pointer-events-none: state.pointer de r3f nunca se
  // actualiza, el cursor se rastrea por window
  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, dt) => {
    if (dotsMat.current) dotsMat.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (!group.current) return;
    group.current.rotation.y += dt * 0.06;
    // inclinación sutil hacia el cursor, con amortiguación
    const { x, y } = pointer.current;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.12 + y * 0.16, 0.03);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -x * 0.08, 0.03);
  });

  return (
    <>
      {/* rotation.y inicial: América de frente (Guatemala visible) */}
      <group ref={group} rotation={[0.12, Math.PI * 0.95, 0]}>
        {/* Occluder: negro = invisible bajo mix-blend-screen, pero
            escribe depth y oculta el hemisferio trasero */}
        <mesh renderOrder={-1}>
          <sphereGeometry args={[RADIUS * 0.965, 48, 48]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        <lineSegments geometry={grid}>
          <lineBasicMaterial
            color="#1D3B6B"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        <points geometry={dots}>
          <shaderMaterial
            ref={dotsMat}
            vertexShader={DOT_VERT}
            fragmentShader={DOT_FRAG}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      {/* Halo atmosférico fijo (no rota) */}
      <mesh scale={1.18}>
        <sphereGeometry args={[RADIUS, 48, 48]} />
        <shaderMaterial
          vertexShader={GLOW_VERT}
          fragmentShader={GLOW_FRAG}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

export default function GlobeHero() {
  const wrapRef = useRef(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    // El measure inicial de r3f se duerme tras el lazy-load: kicks de resize
    // espaciados hasta que el canvas tome el tamaño del contenedor
    const kicks = [100, 600, 1500].map(ms =>
      setTimeout(() => window.dispatchEvent(new Event('resize')), ms)
    );
    // Pausar el render loop cuando el hero sale del viewport (ahorra GPU)
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => { kicks.forEach(clearTimeout); io.disconnect(); };
  }, []);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        dpr={[1, 1.6]}
        frameloop={active ? 'always' : 'never'}
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ pointerEvents: 'none' }}
        onCreated={(st) => { if (import.meta.env.DEV) (window.__r3f ||= []).push(st); }}
      >
        <Globe />
      </Canvas>
    </div>
  );
}

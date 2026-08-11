// ============================================================
//  Dock — magnificación por proximidad, como el Dock de macOS.
//
//  NO es un hover-scale. La diferencia es la que hace que el gesto se
//  sienta físico: el ítem bajo el cursor crece al máximo, y sus VECINOS
//  crecen menos según lo lejos que estén. Eso convierte una fila de cosas
//  sueltas en una superficie que responde entera, que es la sensación del
//  dock.
//
//  Implementación: el contenedor guarda la posición del puntero en dos
//  MotionValues y cada ítem deriva su escala de la DISTANCIA a ese punto.
//  Nada pasa por el estado de React -- un mousemove no dispara ni un
//  render. Con estado, una grilla de 16 células re-renderizaría 16
//  componentes por cada píxel que se mueve el mouse.
//
//  Uso:
//    <Dock className="grid grid-cols-3 gap-4">
//      <DockItem>…</DockItem>
//    </Dock>
//
//  `Dock` no impone layout: pásale las clases de grid/flex que quieras.
//  Un `DockItem` suelto (sin Dock alrededor) funciona como un div normal
//  -- importa para poder mover un ítem de pantalla sin que reviente.
// ============================================================
import { createContext, useContext, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';

// Distancia (px) a partir de la cual un ítem deja de sentir el cursor.
// 170 ≈ dos tarjetas: suficiente para que la magnificación se lea como
// una onda y no como un foco puntual.
const ALCANCE = 170;
// Cuánto crece el ítem que tiene el cursor justo encima. 0.14 es
// deliberadamente contenido: el dock de macOS exagera porque sus íconos
// son de 40px; aquí los ítems son tarjetas grandes y un 1.4 las haría
// chocar entre sí.
const MAX = 0.14;

const DockCtx = createContext(null);
// "El cursor no está aquí": deja a todos los ítems fuera de alcance.
const LEJOS = -99999;

export function Dock({ children, className = '', alcance = ALCANCE, max = MAX, ...props }) {
  const px = useMotionValue(LEJOS);
  const py = useMotionValue(LEJOS);
  const reducido = useReducedMotion();

  const soltar = () => { px.set(LEJOS); py.set(LEJOS); };

  return (
    <DockCtx.Provider value={{ px, py, alcance, max, activo: !reducido }}>
      <div
        className={className}
        onPointerMove={(e) => {
          // Solo mouse/trackpad: en táctil no existe "cerca del cursor",
          // el dedo toca o no toca. Ahí el gesto correcto es el press que
          // DockItem ya hace con whileTap.
          if (e.pointerType !== 'mouse') return;
          px.set(e.clientX);
          py.set(e.clientY);
        }}
        onPointerLeave={soltar}
        {...props}
      >
        {children}
      </div>
    </DockCtx.Provider>
  );
}

// Siempre motion.div, sin prop `as`: el ítem es un ENVOLTORIO que escala,
// y lo clicable va dentro. Un `as` dinámico obligaría a fabricar el
// componente en tiempo de render (motion.create), que es justo lo que
// React 19 marca como error -- y no hace falta para nada de lo que este
// dock necesita.
export function DockItem({ children, className = '', style, ...props }) {
  const ctx = useContext(DockCtx);
  const ref = useRef(null);

  // MotionValue propio de respaldo: useMotionValueEvent necesita un valor
  // real siempre, y los hooks no se pueden llamar condicionalmente. Un
  // DockItem fuera de un Dock escucha este, que nunca cambia.
  const quieto = useMotionValue(LEJOS);
  const fuente = ctx?.px ?? quieto;

  const distancia = useMotionValue(99999);
  const escalaCruda = useTransform(distancia, (d) => {
    if (!ctx?.activo) return 1;
    const t = Math.min(d / ctx.alcance, 1);
    // Coseno al cuadrado en vez de rampa lineal: la caída arranca suave
    // junto al cursor y se apaga suave en el borde, sin el quiebre que
    // delata una interpolación recta.
    return 1 + ctx.max * Math.cos((t * Math.PI) / 2) ** 2;
  });
  const escala = useSpring(escalaCruda, { stiffness: 380, damping: 30, mass: 0.5 });

  // La caja se lee EN EL MOMENTO, no se cachea: estos ítems viven en
  // grillas que se reacomodan (filtros de zona, collage responsive), y una
  // caja cacheada apunta a donde el ítem estaba, no donde está.
  useMotionValueEvent(fuente, 'change', () => {
    const el = ref.current;
    if (!el || !ctx?.activo) return;
    const r = el.getBoundingClientRect();
    const dx = ctx.px.get() - (r.left + r.width / 2);
    const dy = ctx.py.get() - (r.top + r.height / 2);
    distancia.set(Math.hypot(dx, dy));
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={ctx?.activo ? { ...style, scale: escala } : style}
      whileTap={ctx?.activo ? { scale: 0.97 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

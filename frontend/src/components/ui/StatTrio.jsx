// ============================================================
//  StatTrio — el trío de cifras en cristal claro que abre Células y
//  Voluntariado.
//
//  Existía DUPLICADO carácter por carácter en las dos páginas (misma
//  grilla, mismo rounded, mismos dos tamaños de texto, misma opacidad
//  del label). Dos archivos escritos por separado no aterrizan en el
//  mismo markup por casualidad: era copy-paste, y ese copy-paste es
//  parte de lo que hace que las dos páginas se lean como la misma
//  plantilla con otras palabras. Si el objeto es el mismo, vive en un
//  solo lugar; lo que cambia entre páginas son los DATOS y el espaciado
//  que le toca en su sección, nada más.
//
//  Los datos siempre vienen de la página (contados sobre la API o
//  declarados como cifra real de la iglesia) -- este componente no
//  inventa ni infiere ninguna cifra.
//
//  El nombre dice "trío" porque nació con tres, pero la cantidad la pone
//  la página y depende de cuántas cifras REALES tenga: Células cuenta
//  tres sobre la API, Voluntariado solo puede sostener una (borrar una
//  cifra inventada es el caso normal aquí, no la excepción). Con
//  `grid-cols-3` fijo, una sola ficha quedaba encogida a un tercio y
//  pegada a la izquierda de un bloque centrado, o sea con pinta de
//  layout roto. Las clases van completas en un mapa porque Tailwind
//  escanea strings literales: `grid-cols-${n}` no genera nada.
//
//  @param {{n: string, label: string}[]} stats  — 1 a 3
//  @param {string} className — solo espaciado/alineación de la sección
//                             que lo hospeda (mt-10, mx-auto mb-14…).
// ============================================================
import { RevealList, RevealItem } from './Reveal';

const COLS = { 1: 'grid-cols-1 max-w-[220px]', 2: 'grid-cols-2 max-w-sm', 3: 'grid-cols-3 max-w-lg' };

export default function StatTrio({ stats, className = '' }) {
  if (!stats?.length) return null;
  const cols = COLS[Math.min(stats.length, 3)];
  return (
    <RevealList className={`grid ${cols} gap-3 sm:gap-4 ${className}`}>
      {stats.map(s => (
        <RevealItem key={s.label}>
          {/* font-bold, no font-extrabold: Arimo topa en 700, así que el
              800 pintaba exactamente el mismo trazo y solo declaraba una
              jerarquía que la pantalla nunca cumplía. */}
          <div className="glass-light rounded-[22px] px-3 py-5 text-center h-full">
            <div className="text-26 sm:text-30 font-bold text-bg tracking-tighter leading-none">{s.n}</div>
            <div className="mt-1.5 text-11 sm:text-12 font-semibold text-bg/55 leading-tight">{s.label}</div>
          </div>
        </RevealItem>
      ))}
    </RevealList>
  );
}

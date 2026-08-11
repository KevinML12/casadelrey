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
//  @param {{n: string, label: string}[]} stats  — normalmente 3
//  @param {string} className — solo espaciado/alineación de la sección
//                             que lo hospeda (mt-10, mx-auto mb-14…).
// ============================================================
import { RevealList, RevealItem } from './Reveal';

export default function StatTrio({ stats, className = '' }) {
  return (
    <RevealList className={`grid grid-cols-3 gap-3 sm:gap-4 max-w-lg ${className}`}>
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

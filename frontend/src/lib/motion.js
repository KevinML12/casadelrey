// ============================================================
//  Vocabulario de movimiento del sitio. Una sola fuente.
//
//  Antes: 7 copias literales de un objeto `PRESS` repartidas por
//  Home.jsx, AboutPage.jsx, CelulasPage.jsx, VolunteeringPage.jsx,
//  DonatePage.jsx, ProfilePage.jsx y EventsPage.jsx, con la amplitud
//  variando por ARCHIVO (1.02 / 1.03 / 1.04) en vez de por ROL. El
//  efecto: en la misma fila de Home, el CTA primario blanco y los chips
//  terciarios de redes tenían física idéntica. Cuando todo reacciona
//  igual, la reacción deja de comunicar jerarquía.
//
//  Regla: la amplitud la decide el ROL del elemento, no el archivo en
//  el que le tocó vivir.
// ============================================================

// Curva de salida del hero (la máscara de línea de Home). Es lo más
// autoral que tiene el movimiento del sitio -- llega rápido y frena
// largo, como algo con peso -- así que se adopta como el acento de
// movimiento de todo el proyecto en vez de dejarla en un solo archivo.
export const EASE_OUT = [0.16, 1, 0.3, 1];
// Salida: decidida, sin la coquetería del ease-in-out por defecto.
export const EASE_IN = [0.6, 0, 0.8, 1];

export const DUR = { fast: 0.2, base: 0.42, slow: 0.7 };

// Entrada de una card al viewport.
export const SPRING_ENTER = { type: 'spring', stiffness: 120, damping: 16 };

// Escalonado por índice, con tope: sin el cap, una grilla de 30 fotos
// deja la última entrando 1.6s tarde y el usuario ya hizo scroll.
export const stagger = (i, step = 0.055, cap = 6) => (i % cap) * step;

// ── Los TRES presses, por jerarquía de botón ────────────────────────
// Primario: se levanta. Es el único que sale del plano, y por eso se
// lee como "esta es la acción principal de la pantalla".
export const PRESS_PRIMARY = {
  whileHover: { y: -2 },
  whileTap: { y: 0, scale: 0.965 },
  transition: { type: 'spring', stiffness: 520, damping: 34, mass: 0.6 },
};

// Secundario: no se levanta ni crece, solo confirma el tap. Un botón de
// apoyo que crece igual que el principal compite con él.
export const PRESS_SECONDARY = {
  whileTap: { scale: 0.975 },
  transition: { type: 'spring', stiffness: 520, damping: 34, mass: 0.6 },
};

// Micro-control (dot de carrusel, chip, cerrar): el gesto más chico que
// todavía se siente. Nada de escalas de 1.04 en un objeto de 12px.
export const PRESS_MICRO = {
  whileTap: { scale: 0.9 },
  transition: { type: 'spring', stiffness: 600, damping: 30 },
};

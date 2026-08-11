// ============================================================
//  WindowStack — ventanas de cristal SOBREPUESTAS (lenguaje de diseño
//  del sitio, ver docs/DISENO_LIQUID_GLASS.md). Al abrir un ítem se
//  muestra su ventana de cristal flotante sobre TODO; detrás asoman los
//  demás ítems apilados como cartas, y se salta entre ellos trayéndolos
//  al frente. Navegación: X, Escape, flechas ←→, dots. Bloquea el scroll
//  del fondo mientras hay ventana abierta.
//
//  props:
//   items          [{ key, image, images?, badge?, title }]  — pila + banner.
//                  images (opcional, array) da carrusel en el banner del
//                  frente; sin ella cae a `image` como foto única (compat).
//   openKey        key abierta (o null = cerrado)
//   onChange(key)  cambia la ventana activa; null cierra
//   renderContent(item) → cuerpo (scrollable) de la ventana del frente
//
//  NOTA: se intentó un morph con layoutId (la foto de la card "se convierte"
//  en el banner de la ventana) — se descartó: el motion.div de cada tarjeta
//  de la pila ya se anima con `animate={stackPose(depth)}` para el efecto
//  de cartas apiladas, y ese `animate` explícito pelea con el sistema de
//  `layout` que necesita layoutId (la imagen se quedaba pegada al tamaño
//  chico de la card de origen). No reintroducir sin resolver ese conflicto.
// ============================================================
import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Cuántas cartas se dibujan detrás de la del frente. Antes se montaban
// TODAS (10 en Voluntariado) y las de profundidad > 3 se ocultaban con
// `opacity: 0` -- invisibles, pero con su `backdrop-filter: blur()` vivo,
// que es de las cosas más caras que puede pedirle una página al
// compositor. Ahora sencillamente no existen.
const VISIBLES = 4;

// Posición de cada ventana según su profundidad (0 = frente). Las de
// atrás asoman hacia arriba, alternando el lado, como cartas apiladas.
//
// OJO: aquí NO va `zIndex`. Estuvo dentro de este objeto y ese fue el
// motivo real de que la pila se leyera como un mazo barajándose en vez de
// como capas: todo lo que devuelve stackPose se le pasa a `animate`, así
// que el resorte INTERPOLABA el z-index junto con el resto. A mitad de la
// transición la ventana que estabas abriendo se pintaba DEBAJO de la que
// dejabas, y recién al final saltaba al frente. El orden de capas tiene
// que ser instantáneo, así que vive en el `style` de React.
const stackPose = (depth) => ({
  scale: 1 - depth * 0.055,
  y: -depth * 16,
  x: (depth % 2 === 0 ? 1 : -1) * depth * 12,
  rotate: (depth % 2 === 0 ? -1 : 1) * depth * 1.6,
  opacity: 1 - depth * 0.16,
});

// light: variante clara (.glass-light) para páginas donde la ventana de
// detalle debe leerse como el resto del panel claro del sitio (ej.
// Voluntariado) en vez del .liquid-glass oscuro/inmersivo por defecto
// (Galería, Células). El banner con foto + degradado navy no cambia --
// ya se lee bien en ambos casos porque el contraste lo da el degradado,
// no el material de la ventana.
export default function WindowStack({ items, openKey, onChange, renderContent, height = 'min(80vh, 640px)', light = false }) {
  const overlayRef = useRef(null);
  // Quien pidió menos movimiento recibe la pila ya armada, sin el vuelo de
  // entrada: solo un fundido. La jerarquía de capas no se pierde, porque
  // esa la da la geometría de stackPose, no la animación.
  const reducido = useReducedMotion();
  const stack = useMemo(() => {
    if (!openKey) return [];
    const idx = items.findIndex(it => it.key === openKey);
    if (idx < 0) return [];
    return [...items.slice(idx), ...items.slice(0, idx)]; // activo primero
  }, [openKey, items]);

  // Carrusel de fotos DENTRO del banner del frente -- distinto de los
  // dots de abajo (que saltan entre departamentos). Se reinicia a la
  // primera foto cada vez que se abre un departamento distinto.
  const [photoIdx, setPhotoIdx] = useState(0);
  useEffect(() => { setPhotoIdx(0); }, [openKey]);

  const close = useCallback(() => onChange(null), [onChange]);
  const go = useCallback((dir) => {
    const i = items.findIndex(it => it.key === openKey);
    if (i < 0) return;
    onChange(items[(i + dir + items.length) % items.length].key);
  }, [items, openKey, onChange]);

  useEffect(() => {
    if (!openKey) return;
    // Focus trap: es un modal — el Tab no debe escaparse a la página de
    // atrás (que sigue en el DOM, solo difuminada). Al abrir, el foco
    // entra a la ventana; al cerrar, vuelve a donde estaba.
    const prevFocus = document.activeElement;
    overlayRef.current?.querySelector(FOCUSABLE)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        const nodes = overlayRef.current?.querySelectorAll(FOCUSABLE);
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!overlayRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      prevFocus?.focus?.();
    };
  }, [openKey, close, go]);

  return (
    <AnimatePresence>
      {openKey && (
        <motion.div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={items.find(it => it.key === openKey)?.title}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop que difumina TODO el fondo */}
          <motion.div
            className="absolute inset-0 bg-bg/60"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            onClick={close}
          />

          {/* Cerrar -- ya vivía fuera del contenido scrolleable (correcto).
              Acento: el usuario pidió navy en vez de acento, "invertido" --
              aquí el contexto es oscuro/inmersivo (liquid-glass sobre foto),
              así que el relleno sólido que da contraste real es blanco con
              tinta navy (mismo pill primario del sitio público), no navy
              sobre navy que se perdería contra el fondo oscuro. */}
          <motion.button
            onClick={close}
            whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }}
            aria-label="Cerrar"
            className="absolute top-6 right-6 z-[120] w-11 h-11 rounded-full bg-white text-bg shadow-card flex items-center justify-center text-22 leading-none"
          >
            ×
          </motion.button>

          {/* Navegación entre ítems: los dots de abajo (siempre visibles,
              saltan a cualquiera) y las flechas ←→ del teclado ya cubren
              esto por completo, así que no hace falta un botón aparte. */}

          {/* Pila de ventanas */}
          <div className="relative w-full max-w-[780px]" style={{ height, perspective: 1400 }}>
            {stack.slice(0, VISIBLES).map((it, depth) => {
              const isFront = depth === 0;
              const photos = it.images?.length ? it.images : (it.image ? [it.image] : []);
              const idx = isFront ? photoIdx % photos.length : 0;
              const showCarousel = isFront && photos.length > 1;
              const pose = stackPose(depth);
              return (
                <motion.div
                  key={it.key}
                  // Con `initial` la pila se ARMA a la vista: cada carta
                  // llega desde un poco más abajo y algo más chica hasta su
                  // sitio, la del frente primero y las de atrás detrás. Sin
                  // esto las cartas nacían ya colocadas (framer monta
                  // directo en el valor de `animate` cuando no hay
                  // `initial`), así que al abrir no se ponía nada encima de
                  // nada: solo aparecía una composición ya hecha.
                  initial={reducido ? { opacity: 0 } : { ...pose, opacity: 0, y: pose.y + 26, scale: pose.scale * 0.94 }}
                  animate={pose}
                  exit={reducido ? { opacity: 0 } : { opacity: 0, y: 34, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30, delay: reducido ? 0 : depth * 0.045 }}
                  onClick={() => !isFront && onChange(it.key)}
                  className={`absolute inset-0 ${light ? 'glass-light' : 'liquid-glass'} rounded-[28px] overflow-hidden flex flex-col ${isFront ? '' : 'cursor-pointer'}`}
                  // zIndex fuera de `animate` a propósito: ver la nota de
                  // stackPose. Aquí el reordenamiento de capas es
                  // instantáneo, que es lo que hace que la ventana nueva se
                  // lea como puesta ENCIMA y no como una carta que se cuela
                  // por debajo mientras el resorte todavía corre.
                  style={{ transformOrigin: 'top center', zIndex: 50 - depth }}
                >
                  {/* Banner -- carrusel si hay más de una foto (isFront) */}
                  <div className="relative h-32 sm:h-40 shrink-0">
                    {photos[idx] && (
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={idx}
                          src={photos[idx]}
                          alt=""
                          // opacity 1 y no 0.7: el 0.7 era un segundo velo
                          // encima del degradado, así que la foto llegaba a
                          // media fuerza cuando el contraste del título ya
                          // lo resolvía el scrim solo. El fade sigue siendo
                          // la transición entre fotos del carrusel.
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </AnimatePresence>
                    )}
                    {/* .scrim-card: el título vive anclado abajo del banner,
                        que es exactamente la composición para la que existe
                        el token. Antes era un degradado escrito a mano con
                        el navy hardcodeado en hex, uno de los 25 repartidos
                        por el sitio. */}
                    <div className="scrim-card" />
                    {showCarousel && (
                      // Sin flechas: son controles chicos de carrusel dentro
                      // del banner, los dots ya bastan como única navegación
                      // (ahora clicables, antes eran solo indicador pasivo).
                      <div className="absolute top-3 right-3 z-10 flex gap-1">
                        {photos.map((_, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={(e) => { e.stopPropagation(); setPhotoIdx(pIdx); }}
                            aria-label={`Foto ${pIdx + 1}`}
                            className={`h-1 rounded-full transition-all ${pIdx === idx ? 'w-4 bg-white' : 'w-1 bg-white/40'}`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 p-5 sm:p-6">
                      {it.badge && (
                        <span className="bg-white/12 border border-white/20 text-white/90 px-2.5 py-0.5 rounded-full text-11 font-semibold backdrop-blur-md">
                          {it.badge}
                        </span>
                      )}
                      <h2 className="text-26 sm:text-32 font-bold text-white tracking-tight mt-2 leading-none">{it.title}</h2>
                    </div>
                  </div>

                  {/* Cuerpo (solo la del frente es interactiva/scrollable).
                      justify-center: con poco contenido (ej. una categoria
                      con 1 sola celula real, antes tenia varias de relleno)
                      el cuerpo de altura fija dejaba un vacio enorme abajo,
                      se leia como una ventana rota/a medio cargar. Con
                      contenido que SI llena el alto (galerias, categorias
                      con varias celulas) esto no cambia nada -- solo entra
                      en juego cuando hay espacio de sobra. */}
                  {/* `m-auto` en el hijo, NO `justify-center` en el
                      contenedor. Los dos centran cuando sobra espacio,
                      pero `justify-content: center` con overflow recorta el
                      contenido por ARRIBA y lo deja inalcanzable: el
                      scroll no llega ahí. Con contenido corto (una
                      categoría de una sola célula) daba igual, pero al
                      meter el formulario de solicitud —más alto que la
                      ventana— su encabezado y el botón "Volver a la lista"
                      quedaron en top:-433px, fuera de la pantalla y sin
                      forma de subir. `margin: auto` centra igual cuando hay
                      hueco y colapsa a 0 cuando no, así que el bloque
                      arranca arriba y scrollea normal. */}
                  {isFront && (
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col" data-lenis-prevent>
                      <div className="m-auto w-full">
                        {renderContent(it)}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Dots */}
          {/* El punto sigue midiendo 6px porque visualmente es lo correcto,
              pero ahora el BOTÓN que lo contiene mide 32px: el dedo apunta
              al botón, no al punto. Antes el blanco táctil era el punto
              mismo (6x6 px, muy por debajo del mínimo de ~44px), y en un
              teléfono son diez de esos pegados al borde inferior. */}
          {items.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[120] flex items-center">
              {items.map(it => (
                <button
                  key={it.key}
                  onClick={() => onChange(it.key)}
                  aria-label={it.title}
                  aria-current={it.key === openKey}
                  className="px-3 min-h-[44px] flex items-center justify-center focus-ring rounded-full"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${it.key === openKey ? 'w-6 bg-white' : 'w-1.5 bg-white/35'}`}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

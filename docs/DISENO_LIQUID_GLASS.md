# Frontend Casa del Rey — dirección vigente

Actualizado el 27 de octubre de 2026 con las indicaciones del usuario. Esta dirección sustituye las exploraciones anteriores con inclinación, perspectiva, ventanas apiladas o reflejos al cursor.

## Identidad

- Inicio es la referencia para las páginas principales: fotografía real, tipografía Arimo, fondo navy y cristal blanco/oscuro.
- Cero emojis y cero iconos decorativos, incluidos los de carga. El único símbolo de marca es el logo existente de la iglesia. Los controles llevan texto.
- Cero renderizados 3D, canvas, globos, perspectiva, rotaciones de tarjetas, parallax y ampliación por proximidad. No volver a introducir Tilt, Dock, Splash ni WebGL.
- El sitio abre directamente. El logo permanece en la navegación; no hay cortina con un video animado.
- Movimiento breve: pulsación de 120 ms, entradas/ventanas de 180 ms y titulares de hasta 220 ms. Desplazamiento de entrada de 6 px; curvas sin rebote. Con movimiento reducido, contenido inmediato.
- Bisel estático asimétrico y borde fino; sin franja diagonal pintada. Conservar el relleno original de ambos materiales.
- El cristal no sigue al cursor ni cambia de reflejo al hacer hover. Se permite confirmar una pulsación con una escala 2D discreta.

## Material y tipografía

| Elemento | Dirección |
| --- | --- |
| Canvas | Navy `#0A1526` |
| Tinta pública | Blanco; estados de formulario conservan su color semántico |
| Tipo | Arimo 400–700, fuente local |
| Titulares | `text-d1`, `text-d2`, `text-d3`; una sola etiqueta h1 por página |
| Card / panel / botón | 22 px / 28 px / pill |
| `.liquid-glass` y `.glass` | Gradiente blanco al 5%, 1.4%, 0.8%; blur 8 px y borde/bisel estático |
| `.glass-light` | Conservar gradiente blanco 62%, 42%, 28%; blur 22 px, tinta navy |
| Navegación | Cristal claro, mismo tono existente; más cobertura al desplazarse para mantener legibilidad |

No convertir el cristal oscuro en una caja opaca ni modificar el blanco para simular una nueva estética. La preferencia del sistema para reducir transparencia tiene su propio fallback accesible. Reducir movimiento no obliga a cambiar la transparencia.

## Componentes compartidos

- `PageHero`: foto administrable con fallback local, scrim y espaciado común. La primera imagen se carga con prioridad.
- `GlassCard`: superficie plana; no instala listeners de posición del mouse/scroll.
- `PhotoImage`: sirve WebP responsive para fotos locales conocidas. Respeta las URLs externas y las imágenes del CMS.
- `PhotoHeaderCard`, `PhotoBentoTile`: fotografía real y texto legible. Se conservan tamaños variados, con las tarjetas alineadas y sin inclinarlas.
- `SectionBg`: escena fotográfica de la sección. Vive dentro de su propia sección, sin cubrir el encabezado anterior.
- `WindowStack`: mantiene el contrato de las páginas existentes, pero muestra un solo detalle plano. Anterior/Siguiente cambia el contenido; Escape vuelve un nivel. Foco y scroll quedan controlados.
- `ModalWrapper`: formularios claros, con cierre y navegación por teclado.
- `CollectionStatus`: carga, error y reintento de listas. No ocultar el hero esperando al backend ni presentar un fallo como una lista vacía.

Conservar los datos reales del administrador. No inventar eventos, teléfonos, cuentas bancarias ni testimonios para llenar espacios. Los datos sintéticos sólo corresponden al entorno de pruebas identificado.

## Fotografías y validación

Las fotos originales quedan intactas por compatibilidad con enlaces guardados en el CMS. Los derivados están en `frontend/public/images/optimized/`. Regenerar con `python3 scripts/optimize-photos.py` desde frontend, usando Pillow; el hosting sólo necesita los archivos ya generados. La foto local conocida recibe srcset y dimensiones. No intentar convertir archivos privados ni comprobantes con este componente.

Validar móvil desde 320 px, tablet y escritorio: sin desbordamientos, foco visible, menú cerrado fuera del orden de tabulación, Escape/cierre con foco restaurado y formularios accesibles. Las pruebas de frontend interceptan la API para evitar escrituras a producción.

El panel Admin/Líder/Voluntario conserva su variante clara del material y sus controles de texto; comparte fotografías optimizadas y ausencia de gráficos decorativos/3D.

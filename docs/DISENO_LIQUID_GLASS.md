# Frontend Casa del Rey — dirección vigente

Actualizado el 27 de octubre de 2026 con las indicaciones del usuario. Esta dirección sustituye las exploraciones anteriores con inclinación, perspectiva, ventanas apiladas o reflejos al cursor.

## Identidad

- Inicio es la referencia para las páginas principales: fotografía real administrada, tipografía Arimo, fondo navy y cristal blanco/oscuro.
- Composición objetivo: la fotografía vive en el fondo navy de la sección y el contenido en tarjetas de vidrio superpuestas. No incorporar fotos ni banners fotográficos dentro de tarjetas o diálogos nuevos. Siempre mantener una fotografía real en el fondo de la sección. Priorizar tomas amplias, grupos, congregación e infraestructura; evitar primeros planos o composiciones dominadas por un solo rostro. Mientras no haya fotos subidas, elegir respaldos reales del repositorio con ese criterio. Depurar los módulos existentes uno por uno, conservando contenido, fuentes y edición del administrador.
- Cero emojis y cero iconos decorativos, incluidos los de carga. El único símbolo de marca es el logo existente de la iglesia. Los controles llevan texto.
- Cero renderizados 3D, canvas, globos, perspectiva, rotaciones de tarjetas, parallax y ampliación por proximidad. No volver a introducir Tilt, Dock, Splash ni WebGL.
- El sitio abre directamente. El logo permanece en la navegación; no hay cortina con un video animado.
- Movimiento breve: pulsación de 120 ms, entradas/ventanas de 180 ms y titulares de hasta 220 ms. Desplazamiento de entrada de 6 px; curvas sin rebote. Con movimiento reducido, contenido inmediato.
- Vidrio plano: borde asimétrico fino, reflejos localizados en un filo de 0.5 px y sombras exteriores suaves. Sin bisel inflado, doble contorno intenso, sombras interiores voluminosas ni franja diagonal pintada. Conservar el relleno original de ambos materiales. Los navegadores sin máscara conservan borde y sombras como fallback.
- El cristal no sigue al cursor ni cambia de reflejo al hacer hover. Se permite confirmar una pulsación con una escala 2D discreta.

## Material y tipografía

| Elemento | Dirección |
| --- | --- |
| Canvas | Navy `#0A1526` |
| Tinta pública | Blanco; estados de formulario conservan su color semántico |
| Tipo | Arimo 400–700, fuente local |
| Titulares | `text-d1`, `text-d2`, `text-d3`; una sola etiqueta h1 por página |
| Card / panel / botón | 12–16 px para contenido; 16–20 px para vistas fotográficas pendientes de migración; cápsulas para acciones principales |
| `.liquid-glass` y `.glass` | Gradiente blanco al 5%, 1.4%, 0.8%; blur 8 px y borde/bisel estático |
| `.glass-light` | Conservar gradiente blanco 62%, 42%, 28%; blur 22 px, tinta navy |
| Navegación | Cristal claro, radio de 16 px y mismo tono existente; más cobertura al desplazarse para mantener legibilidad |

No convertir el cristal oscuro en una caja opaca ni modificar el blanco para simular una nueva estética. La preferencia del sistema para reducir transparencia tiene su propio fallback accesible. Reducir movimiento no obliga a cambiar la transparencia.

La fotografía guía el material: blanco escarchado sobre fondos predominantemente azules; transparente sobre fotos muy oscuras o de otros colores. Es un criterio visual, sujeto a luminosidad, textura y contraste real del texto; no una regla automática basada sólo en el color. La transparencia por sí sola no produce el efecto plástico: evitar brillo continuo, exceso de relieve y curvas exageradas. La primera captura aportada por el usuario el 27 de octubre (formulario de Oración sobre la página de Voluntariado) es la referencia de panel continuo; no copiar el banner y el recuadro anidado de la segunda.

Las fotos y textos siguen llegando de la API del administrador. No sustituir URLs guardadas por archivos locales al cambiar la composición. Los archivos incluidos en el proyecto son respaldos; una segunda foto administrada se conserva como vista alternativa del fondo. No borrar ni reescribir registros para conseguir un cambio de estilo.

## Distribución y navegación progresiva

Menos elementos simultáneos. En Voluntariado se muestra un departamento a la vez, tanto en móvil como en escritorio. Todos los departamentos publicados por el administrador participan en el recorrido, incluidos los nuevos. Anterior/Siguiente indica el nombre del vecino y un contador discreto permite ubicarse. No hay reproducción automática ni un grid completo de tarjetas.

Al cambiar de departamento cambia la fotografía del fondo mediante una disolución de 220 ms. La superficie de cristal permanece en su sitio; el contenido aparece con opacidad en 180 ms, sin movimiento lateral, zoom ni sensación de desplazamiento entre páginas. Se espera a que la fotografía esté cargada y se conserva la última escena válida. Si falla una foto administrada, se usa el respaldo del departamento. Con movimiento reducido los cambios son inmediatos.

Cada departamento abre el mismo panel de cristal y permite seguir al anterior o siguiente, conservando su tamaño y el foco de navegación. Galería es el primer apartado; Fotos permite ver las fotografías administradas como fondo; Información reúne descripción, motivo, testimonio real y aplicación. Las pestañas funcionan con teclado y conservan el foco al cambiar de apartado. El quiz entra directamente a Información del departamento recomendado. No añadir tarjetas o fotografías decorativas dentro del panel para rellenar espacio.

## Componentes compartidos

- `PageHero`: foto administrable con fallback local, scrim y espaciado común. La primera imagen se carga con prioridad.
- `GlassCard`: superficie plana; no instala listeners de posición del mouse/scroll.
- `PhotoImage`: sirve WebP responsive para fotos locales conocidas. Respeta las URLs externas y las imágenes del CMS.
- `PhotoHeaderCard`, `PhotoBentoTile`: componentes heredados con fotografías dentro; migrarlos en la revisión de cada módulo. No extender esta composición a nuevas tarjetas.
- `CrossfadePhoto`: mantiene la última foto válida mientras carga la siguiente y cancela respuestas tardías; sólo anima opacidad.
- `SectionBg`: escena fotográfica de la sección. Vive dentro de su propia sección, sin cubrir el encabezado anterior. En secciones largas, `viewport` mantiene el encuadre ligado a la altura visible, con ancestros `overflow-clip`; evita ampliar una panorámica hasta convertirla en un retrato.
- `WindowStack`: muestra un solo detalle plano. Voluntariado usa `photoBackdrop`: foto administrada detrás del panel, sin banner interior ni recuadro de cristal anidado. Anterior/Siguiente cambia el contenido; Foto 1/2 cambia el fondo; Escape vuelve un nivel. Foco y scroll quedan controlados. Las tarjetas de departamentos y los resultados del quiz de Voluntariado ya no incluyen fotos. Los demás módulos conservan su composición hasta revisarlos.
- `ModalWrapper`: formularios claros, con cierre y navegación por teclado.
- `CollectionStatus`: carga, error y reintento de listas. No ocultar el hero esperando al backend ni presentar un fallo como una lista vacía.

Conservar los datos reales del administrador. No inventar eventos, teléfonos, cuentas bancarias ni testimonios para llenar espacios. Los datos sintéticos sólo corresponden al entorno de pruebas identificado.

## Fotografías y validación

Las fotos originales quedan intactas por compatibilidad con enlaces guardados en el CMS. Los derivados están en `frontend/public/images/optimized/`. Regenerar con `python3 scripts/optimize-photos.py` desde frontend, usando Pillow; el hosting sólo necesita los archivos ya generados. La foto local conocida recibe srcset y dimensiones. No intentar convertir archivos privados ni comprobantes con este componente.

Los dos respaldos generales de Voluntariado provienen de `fotos/DOMINGOS 2026/MIEMBROS/DSC09599.JPG` y de la toma grupal `7A871FBF-B494-476A-88D0-C7CB76C267CB_1_201_a.jpeg` de Wild Youth / Real Night / Un amor de película. Sólo se corrigió orientación y se exportaron versiones WebP de 640/1600 px; no se alteraron colores ni contenido. Se regeneran con `frontend/scripts/curate-backgrounds.py` desde las carpetas originales. El optimizador general conserva sus entradas WebP. Se añadieron diez escenas para los departamentos existentes, tomadas de las carpetas Alabanza, Danza, Miembros, Niños, Pastores, Masiva y Camps. El script registra la procedencia exacta de cada exportación. Las fotos `voluntariado_<value>` y las segundas fotos subidas por el administrador tienen prioridad; los departamentos nuevos usan `voluntariado_seccion` como fondo general si no tienen una foto propia. La selección panorámica/grupal también aparece indicada en el panel de fotos.

Validar móvil desde 320 px, tablet y escritorio: sin desbordamientos, foco visible, menú cerrado fuera del orden de tabulación, Escape/cierre con foco restaurado y formularios accesibles. Las pruebas de frontend interceptan la API para evitar escrituras a producción.

El panel Admin/Líder/Voluntario conserva su variante clara del material y sus controles de texto; comparte fotografías optimizadas y ausencia de gráficos decorativos/3D.

# Frontend Casa del Rey — dirección vigente

Actualizado el 29 de octubre de 2026 con las indicaciones del usuario. Esta dirección sustituye las exploraciones anteriores con inclinación, perspectiva, ventanas apiladas o reflejos al cursor.

## Identidad

- Inicio es la referencia para las páginas principales: fotografía real administrada, tipografía Arimo, fondo navy y cristal blanco/oscuro.
- Composición objetivo: la fotografía vive en el fondo navy de la sección y el contenido en tarjetas de vidrio superpuestas. Las fichas de vista previa permanecen sobre el fondo. Al abrir un panel, desplegable o galería, sí mostrar fotos dentro: amplias y nítidas, junto a los detalles, conservando también el fondo visible. Siempre mantener una fotografía real en el fondo de la sección. Priorizar tomas amplias, grupos, congregación e infraestructura; evitar primeros planos o composiciones dominadas por un solo rostro. Mientras no haya fotos subidas, elegir respaldos reales del repositorio con ese criterio. Depurar los módulos existentes uno por uno, conservando contenido, fuentes y edición del administrador.
- Cero emojis y cero iconos decorativos, incluidos los de carga. El único símbolo de marca es el logo existente de la iglesia. Los controles llevan texto.
- Cero renderizados 3D, canvas, globos, perspectiva, rotaciones de tarjetas y ampliación por proximidad. En pastores, voluntariado y Visítanos/Podcast se permiten transiciones sutiles de superposición 2D según el puntero fino y el scroll, de hasta unos 6 px y con movimiento reducido respetado. No volver a introducir Tilt, Dock, Splash ni WebGL.
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

Cada departamento abre el mismo panel de cristal y permite seguir al anterior o siguiente, conservando su tamaño y el foco de navegación. Galería es el primer apartado; Fotos permite recorrer la fotografía completa dentro del panel y como fondo; Información reúne descripción, motivo, testimonio real y aplicación. Las pestañas funcionan con teclado y conservan el foco al cambiar de apartado. El quiz entra directamente a Información del departamento recomendado. La imagen interior es contenido real: darle espacio útil y object-contain, sin recortarla como un banner. Los detalles quedan a un lado en escritorio y debajo en móvil.

## Aplicación a los módulos

Galería, Células, Nosotros, Blog y Eventos reutilizan escenas con una sola superficie visible. La vista previa de Galería de Inicio sigue el mismo criterio. Las clasificaciones y los elementos salen de la API, sin listas de ejemplo cuando la respuesta está vacía. Galería recorre todas las páginas publicadas, agrupa los álbumes por el título administrado y usa controles compactos para las fotos; no crea un botón por cada una cuando hay muchas.

Nosotros lee su contenido institucional desde Configuración (`about_*`), incluyendo presentación, fundadores, pastores, misión, visión, dirección y podcast. Los valores originales se conservan como valores iniciales editables del backend; los valores vacíos guardados se respetan; vaciar los campos de un bloque permite retirarlo. Las cifras fijas de voluntarios, líderes o tipos se retiraron. La dirección, fundadores y podcast del pie de página usan la misma configuración. Los departamentos nuevos reciben automáticamente sus dos espacios de fotografías en Fotos del sitio; Galería permite editar registros existentes.

## Componentes compartidos

- `PageHero`: foto administrable con fallback local, scrim y espaciado común. La primera imagen se carga con prioridad.
- `GlassCard`: superficie plana; no instala listeners de posición del mouse/scroll.
- `PhotoImage`: sirve WebP responsive para fotos locales conocidas. Respeta las URLs externas y las imágenes del CMS.
- `SceneCarousel`: escena fija por identidad de registro, navegación cíclica con teclado, nombres vecinos y fotografía de fondo precargada. También cambia el contenido si dos registros comparten la misma fotografía. Las escenas cortas ajustan la foto a toda la sección; no recortan una ventana de 100svh dentro de un bloque más pequeño.
- `SceneCollection` y `PhotoTabs`: panel de detalle con Galería/Fotos/Información, sin desmontar las pestañas al cambiar de apartado.
- Se retiraron `PhotoHeaderCard` y `PhotoBentoTile`, que ya no tienen consumidores tras migrar Nosotros.
- `CrossfadePhoto`: mantiene la última foto válida mientras carga la siguiente y cancela respuestas tardías; sólo anima opacidad.
- `SectionBg`: escena fotográfica de la sección. Vive dentro de su propia sección, sin cubrir el encabezado anterior. En secciones largas, `viewport` mantiene el encuadre ligado a la altura visible, con ancestros `overflow-clip`; evita ampliar una panorámica hasta convertirla en un retrato.
- `WindowStack`: muestra un solo detalle plano. Voluntariado usa `photoBackdrop`: foto administrada detrás del panel, con una fotografía interior amplia y el mismo fondo visible, sin recuadros de cristal anidados. Anterior/Siguiente cambia el contenido; Foto anterior/siguiente cambia la imagen interior y el fondo; Escape vuelve un nivel. Foco y scroll quedan controlados. Las tarjetas de departamentos y los resultados del quiz de Voluntariado ya no incluyen fotos. Galería, Células y los resúmenes de Nosotros usan también fotografía exterior, animación por opacidad y nombres vecinos.
- `ModalWrapper`: formularios claros, con cierre y navegación por teclado.
- `CollectionStatus`: carga, error y reintento de listas. No ocultar el hero esperando al backend ni presentar un fallo como una lista vacía.

Conservar los datos reales del administrador. No inventar eventos, teléfonos, cuentas bancarias ni testimonios para llenar espacios. Los datos sintéticos sólo corresponden al entorno de pruebas identificado.

## Fotografías y validación

Las fotos originales quedan intactas por compatibilidad con enlaces guardados en el CMS. Los derivados están en `frontend/public/images/optimized/`. Regenerar con `python3 scripts/optimize-photos.py` desde frontend, usando Pillow; el hosting sólo necesita los archivos ya generados. La foto local conocida recibe srcset y dimensiones. No intentar convertir archivos privados ni comprobantes con este componente.

Los dos respaldos generales de Voluntariado provienen de `fotos/DOMINGOS 2026/MIEMBROS/DSC09599.JPG` y de la toma grupal `7A871FBF-B494-476A-88D0-C7CB76C267CB_1_201_a.jpeg` de Wild Youth / Real Night / Un amor de película. Sólo se corrigió orientación y se exportaron versiones WebP de 640/1600 px; no se alteraron colores ni contenido. Se regeneran con `frontend/scripts/curate-backgrounds.py` desde las carpetas originales. El optimizador general conserva sus entradas WebP. Se añadieron diez escenas para los departamentos existentes, tomadas de las carpetas Alabanza, Danza, Miembros, Niños, Pastores, Masiva y Camps. El script registra la procedencia exacta de cada exportación. Las fotos `voluntariado_<value>` y las segundas fotos subidas por el administrador tienen prioridad; los departamentos nuevos usan `voluntariado_seccion` como fondo general si no tienen una foto propia. La selección panorámica/grupal también aparece indicada en el panel de fotos.

Validar móvil desde 320 px, tablet y escritorio: sin desbordamientos, foco visible, menú cerrado fuera del orden de tabulación, Escape/cierre con foco restaurado y formularios accesibles. Las pruebas de frontend interceptan la API para evitar escrituras a producción.

El panel Admin/Líder/Voluntario conserva su variante clara del material y sus controles de texto; comparte fotografías optimizadas y ausencia de gráficos decorativos/3D.

## Vistas previas fotográficas (27 de octubre)

Las vistas previas de eventos, mensajes y colecciones deben dejar una parte amplia de la fotografía visible, sin desenfoque. El cristal sólo sostiene la ficha breve: título, dato principal y acción. Aplicar el contraste con un degradado localizado hacia la ficha, sin apagar toda la foto. Reducir el desenfoque de esa ficha a 5 px, conservar el filo estático fino y los radios de 16 px. Inspiración editorial de Pinterest: fotografía protagonista y jerarquía sobria, sin mosaicos recargados en la vista previa. La fotografía interior amplia se reserva para el detalle abierto y los retratos de pastores. Recorrer por disolución, abrir los detalles completos en el mismo lenguaje de ventanas y conservar los flujos existentes.

## Identificación e interacción de controles

Mostrar el identificador «Colección · Anterior / Siguiente» y la posición sólo cuando exista un recorrido con varios registros. Las superficies estáticas no llevan ese identificador. Los controles del recorrido tienen borde, fondo tenue y foco visible; las ventanas usan el mismo tratamiento. Respuesta de pulsación con una capa de tinta de 160 ms, cambios de estado de 120 ms y contenido por opacidad de 180 ms. Sin rebotes, luz que siga el cursor ni desplazamientos laterales. Respetar movimiento reducido. `CollectionNavigation` concentra el identificador y las reglas compartidas de `index.css` dan respuesta consistente a los botones públicos y de paneles.

## Aclaración de fotografías y superposición — 29 de octubre

La prohibición anterior de imágenes interiores se limita a las fichas principales de vista previa. `WindowStack` abre una ventana amplia con una fotografía completa de alta calidad y detalles a un lado; conserva el fondo fotográfico. Galería y Fotos mantienen la imagen elegida al cambiar de pestaña. El visor usa los originales R2 y los derivados locales responsive, sin ampliar miniaturas. El retrato de fundadores tiene su propio slot `about_fundadores`; `about_pastores` conserva la foto administrada del equipo pastoral. Ambos usan sus fotografías locales anteriores sólo como respaldo.

`LayeredPanel` aplica una superposición sutil de primer plano según puntero fino y posición de scroll; no mueve el reflejo ni la cámara. Se desactiva con movimiento reducido y no depende del hover para mostrar información. Voluntariado permite ir directamente a cualquier departamento publicado desde un selector compacto. `VisitExperience` comparte dirección, mapa, podcast y horario administrables entre Inicio y Nosotros; permite copiar información y sólo ofrece reproducción si existe un enlace HTTP(S) configurado. Los nuevos slots de visita/podcast y el enlace opcional aparecen en los recursos existentes de administración.

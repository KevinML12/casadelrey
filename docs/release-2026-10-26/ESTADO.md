# Estado de la entrega — revisión del 27 de octubre de 2026

## Frontend

Inicio se conserva como referencia. Blanco escarchado sin cambio de tono y cristal oscuro casi transparente. `.glass` y `.liquid-glass` comparten material. Se pulieron los bordes asimétricos y el bisel estático, se contuvo la sombra y se eliminó la franja diagonal artificial. Pulsación de 120 ms, entradas de 180 ms y titulares de hasta 220 ms, sin rebotes. Se retiraron Tilt, Dock, la cortina de video del logo, las inclinaciones, las perspectivas, el parallax, la ampliación por proximidad y los halos de hover. No hay emojis, SVG decorativos ni spinners de pictogramas; los controles son de texto y se conserva el logo real.

Dirección vigente tras la revisión visual: vidrio plano, filo de reflejo de 0.5 px, borde tenue y sombras interiores reducidas. Radios de 16 px en navegación, Conéctate y diálogos. Blanco y oscuro mantienen su relleno. El fondo debe ser siempre una fotografía real panorámica o grupal; las tarjetas contienen cristal y contenido, sin fotos incrustadas. La regla blanco sobre azul/transparente sobre oscuro u otros colores es un criterio visual sujeto a contraste, sin clasificación automática de fotos.

Primera migración por módulo: Voluntariado ya no incrusta fotos en las tarjetas de departamentos, resultados del quiz ni banner del detalle. El detalle muestra una sola superficie continua y coloca las fotos administradas detrás. Se conservaron títulos/descripciones/motivos/testimonios de la API, las dos fotos por departamento y el paso al formulario. Se conectó el fondo al slot existente voluntariado_seccion. Los respaldos nuevos proceden de las carpetas originales de Domingos y Wild Youth: congregación y grupo dentro del templo, exportados en cuatro WebP (640/1600 px) sin alterar contenido. El fondo mantiene el encuadre visible detrás de las tarjetas. El panel de fotos indica el criterio panorámico/grupal. Otros módulos conservan su composición pendiente de depuración. No se cambiaron registros de la base para este ajuste.

La distribución de Voluntariado recorre todos los departamentos de la API, uno a la vez, con Anterior/Siguiente, nombres vecinos y contador discreto. Cada departamento tiene una escena de fondo real distinta; diez respaldos locales de las carpetas originales se exportaron en versiones 640/1600 px. Las fotos del administrador conservan prioridad. La siguiente escena se precarga antes de cambiar el contenido, con disolución de 220 ms y contenido de 180 ms; sin movimiento lateral, zoom ni reproducción automática. El panel conserva tamaño y foco al navegar, y mantiene Galería primero, Fotos e Información. Las pestañas no se desmontan al cambiar de apartado, para conservar el foco del teclado. Los departamentos nuevos participan automáticamente y el quiz abre Información del recomendado. Se conserva el bloqueo compartido del fondo hasta cerrar el último diálogo.

Refactorización de módulos: Galería, Células, Nosotros, Blog y Eventos comparten una escena con cristal fijo y fotografía exterior. Inicio usa el mismo patrón en su vista previa de Galería. Se retiraron los mosaicos y componentes de tarjetas fotográficas ya sin consumidores, las listas de ejemplo y las cifras fijas de Nosotros. Carga, fallo con reintento y vacío se distinguen. Las fotos locales son respaldos visuales, nunca registros ficticios. Galería recorre la paginación completa y permite editar fotos existentes desde el panel. Los departamentos nuevos obtienen espacios de fotos automáticamente. Nosotros y los datos institucionales del pie leen Configuración; los textos originales pasan a valores iniciales editables del backend y borrar un valor retira el bloque. Los contratos de inscripción, cancelación y pagos se mantienen.

Conéctate usa bienvenida/seguimiento junto al formulario claro, con una columna en móvil. Los encabezados comparten foto, contraste y espaciado. Eventos, Blog y Galería muestran el encabezado mientras carga la API y distinguen carga, error con reintento y vacío real. El menú móvil se cierra con Escape, bloquea el scroll y deja sus links ocultos fuera del foco. Los detalles se abren en un diálogo plano por encima de la navegación; se conserva el foco al cerrar.

77 fotos locales tienen derivados WebP: originales 201,155,726 bytes, variante grande 6,275,322 y pequeña 1,753,286. Ambas juntas pesan 8,028,608 bytes (96% menos que los originales). Esto compara los archivos preparados, no el consumo medido de una visita. Los originales y las URLs externas/CMS siguen disponibles. La primera foto tiene prioridad; las inferiores usan carga diferida. El bundle se separó para reutilizar React/motion en caché; build sin aviso de chunks mayores a 500 kB.

El documento `Casa-del-Rey-Liquid-Glass.pen` contiene referencia de Inicio, materiales, Nosotros y Conéctate. Se actualizó la regla de diseño plano, sin emojis ni iconos. Las comprobaciones estructurales de Conéctate no reportan recortes. La inspección visual se realizó sobre el frontend real en móvil y escritorio.

## Verificación

- 27 pruebas locales de UI aprobadas: reglas visuales, 12 rutas a 390/1440 px y páginas principales a 320/768/1024 px, menú, ventanas, formularios críticos, imágenes y ausencia de 3D/iconos/emojis. API interceptada.
- Versión compilada: 11 comprobaciones de navegación, material, imágenes y controles aprobadas; reporte junto a este documento.
- Build aprobado; lint sin errores, con 20 advertencias existentes.
- Revisión de vidrio plano y Voluntariado: build, 15 pruebas de UI (28.0 s) y lint sin errores con las mismas 20 advertencias. Incluye fotos/textos simulados del administrador, segunda foto de fondo, ausencia de fotos dentro de tarjetas, paso al formulario y fondo continuo al hacer scroll. Reporte en frontend-real-glass-tests.txt. API interceptada; sin escrituras reales.
- Revisión de distribución: 23 pruebas de UI aprobadas (38.5 s), build aprobado y lint sin errores con las mismas 20 advertencias. Incluye todas las clasificaciones accesibles con una/dos tarjetas, Galería primero, Fotos, Información, imágenes de la API, quiz, aplicación, foco y bloqueo del fondo. Reporte en frontend-classification-tests.txt. API interceptada.
- Revisión del recorrido: 24 pruebas aprobadas (40.0 s), incluida navegación por los diez fondos en móvil/escritorio, tamaño fijo del diálogo, pestañas con teclado, fotos administradas, respaldo por fallo de imagen y flujos de aplicación/quiz. API interceptada, sin escrituras reales. Reporte en frontend-slider-tests.txt.
- Refactorización de módulos: 31 pruebas de UI aprobadas (46.9 s), con fuentes administradas, carga de álbumes paginados, nuevos registros, vacíos sin ejemplos, escena fija incluso con fotos compartidas, edición en el panel, inscripciones y flujos de pago existentes. Build aprobado; lint sin errores y 20 advertencias previas. Pruebas Go de handlers y rutas aprobadas, incluidos nuevos espacios de fotos y edición/vaciado de textos institucionales.
- Backend publicado: 19 comprobaciones aprobadas, incluidas R2 privado, login admin/member, idempotencia y bloqueo de descargas anónimas/member.
- Las pruebas Go/vet y la concurrencia local de doce donaciones aprobadas en la entrega previa siguen documentadas. No se hicieron cambios al ejecutable Go en esta revisión.

## Supabase

Verificado en Safari: proyecto Healthy. Se detectaron 27 tablas de aplicación con RLS desactivado y permisos directos para anon/authenticated. Se habilitó RLS, se revocaron permisos directos en las 28 tablas públicas y 26 secuencias, se restringieron permisos por defecto de futuras tablas/secuencias públicas y se fijó el search_path de `handle_new_user`, retirando su ejecución pública. El asesor pasó a indicar que no encontró incidencias.

Se guardaron ACL, configuración previa, rollback SQL y backup de datos fuera del repositorio, bajo `~/.codex/backups/casadelrey/`, con permisos privados. No se cambiaron filas reales. La conexión del backend actual usa el propietario con BYPASSRLS; health y eventos de Fly continúan en HTTP 200. El SQL reproducible está en `backend/scripts/harden_public_schema.sql` y el resultado agregado, sin datos personales, en `supabase-verification.json`.

QA mantiene su schema/rol `cdr_render_qa`, JWT independiente, dos usuarios sintéticos y cero acceso a tablas/secuencias de public/auth/storage. Pool de aplicación de tres conexiones y límite de rol cuatro. Se archivaron mediante soft-delete fixtures sintéticos anteriores conservando la última prueba de R2; no se tocaron registros reales.

## Render y archivos

- Backend Free: https://casadelrey-api-pruebas.onrender.com
- Frontend Static: https://casadelrey-web-pruebas.onrender.com

El backend QA fue desplegado desde `9e74735`, despliegue `dep-dbgdvl59el5s73aamqq0` (4m26s, estado Live verificado en el panel). El frontend de Render está publicado desde `b62cb0b`, despliegue `dep-dbgh300473hc73e0s58g`. Se verificaron por HTTP los recursos actuales, API QA, reflejos finos, apartados, edición de Galería, orden numérico y encuadre de escenas cortas. El reporte está en `frontend-deployed-verification.json` y la evidencia visual en `escena-cristal-publicada.png`. Las siete pruebas finales del patrón, incluida la altura del fondo respecto de su sección y edición/orden del administrador, están en `frontend-scenes-final-tests.txt`. Los despliegues automáticos de Render siguen desactivados.

Vercel conserva el enlace de la iglesia `https://casadelreyhue.vercel.app` en `main` / `01d597d`, con Fly real. Los pushes de `codex/render-qa` generan vistas previas; se verificó READY para `b62cb0b`, despliegue `dpl_ELVtJjmiQ4bfAiLvnXJVaXkmGrog`, y se comprobó su HTML, código de escenas y proxy `/api` devolviendo los diez departamentos publicados de Fly. El alias de revisión es `https://casadelreyhue-git-codex-render-qa-kevinml12s-projects.vercel.app`; mantiene la protección de acceso de Vercel. No se promovió el frontend nuevo al enlace de la iglesia: primero se debe sincronizar el backend real con los contratos nuevos. Ver `docs/DESPLIEGUES_FRONTEND.md` y `vercel-preview-verification.json`.

Con autorización explícita se amplió la credencial R2 existente a los dos buckets: medios y `casadelreyhue-receipts-private`. El privado tiene acceso público desactivado. Render ya usa R2; una prueba independiente aprobó PUT/GET/DELETE de un objeto sintético y las 19 comprobaciones del backend confirman el almacenamiento privado. No se copió el JWT ni la conexión de producción al backend QA. R2 sí es compartido por decisión expresa del usuario.

Se conserva un backup completo de producción, 669 entradas, fuera del repositorio. Los tres comprobantes reales con referencia histórica y sus objetos públicos aún no se migraron ni eliminaron.

## Pendientes de producción

1. Migrar los tres comprobantes históricos mediante copia privada verificada y backup de referencias; retirar originales públicos/caché tras validar.
2. Configurar el backend definitivo con base real y correo, comprobar autorización por registro, migraciones y flujos reales. Render actual usa datos de pruebas.
3. Conectar el dominio final y publicar el frontend definitivo con su configuración real.
4. Medir carga antes de afirmar capacidad para mil usuarios. Render Free duerme y su arranque en frío fue observado; no constituye la configuración recomendada para el lanzamiento.

La auditoría global de permisos, correo, metadatos y rendimiento no está certificada como cerrada. No se contrató un plan, no se cambió el dominio de producción y no se promovió el backend QA a producción.

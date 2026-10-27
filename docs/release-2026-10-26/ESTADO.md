# Estado de la entrega — revisión del 27 de octubre de 2026

## Frontend

Inicio se conserva como referencia. Blanco escarchado sin cambio de tono y cristal oscuro casi transparente. `.glass` y `.liquid-glass` comparten material. Se pulieron los bordes asimétricos y el bisel estático, se contuvo la sombra y se eliminó la franja diagonal artificial. Pulsación de 120 ms, entradas de 180 ms y titulares de hasta 220 ms, sin rebotes. Se retiraron Tilt, Dock, la cortina de video del logo, las inclinaciones, las perspectivas, el parallax, la ampliación por proximidad y los halos de hover. No hay emojis, SVG decorativos ni spinners de pictogramas; los controles son de texto y se conserva el logo real.

Dirección vigente tras la revisión visual: vidrio plano, filo de reflejo de 0.5 px, borde tenue y sombras interiores reducidas. Radios de 16 px en navegación, Conéctate y diálogos. Blanco y oscuro mantienen su relleno. El fondo debe ser siempre una fotografía real panorámica o grupal; las tarjetas contienen cristal y contenido, sin fotos incrustadas. La regla blanco sobre azul/transparente sobre oscuro u otros colores es un criterio visual sujeto a contraste, sin clasificación automática de fotos.

Primera migración por módulo: Voluntariado ya no incrusta fotos en las tarjetas de departamentos, resultados del quiz ni banner del detalle. El detalle muestra una sola superficie continua y coloca las fotos administradas detrás. Se conservaron títulos/descripciones/motivos/testimonios de la API, las dos fotos por departamento y el paso al formulario. Se conectó el fondo al slot existente voluntariado_seccion. Los respaldos nuevos proceden de las carpetas originales de Domingos y Wild Youth: congregación y grupo dentro del templo, exportados en cuatro WebP (640/1600 px) sin alterar contenido. En la sección larga, el fondo mantiene el encuadre visible mientras se desplazan las tarjetas. El panel de fotos indica el criterio panorámico/grupal. Otros módulos conservan su composición pendiente de depuración. No se cambiaron registros de la base para este ajuste.

Conéctate usa bienvenida/seguimiento junto al formulario claro, con una columna en móvil. Los encabezados comparten foto, contraste y espaciado. Eventos, Blog y Galería muestran el encabezado mientras carga la API y distinguen carga, error con reintento y vacío real. El menú móvil se cierra con Escape, bloquea el scroll y deja sus links ocultos fuera del foco. Los detalles se abren en un diálogo plano por encima de la navegación; se conserva el foco al cerrar.

77 fotos locales tienen derivados WebP: originales 201,155,726 bytes, variante grande 6,275,322 y pequeña 1,753,286. Ambas juntas pesan 8,028,608 bytes (96% menos que los originales). Esto compara los archivos preparados, no el consumo medido de una visita. Los originales y las URLs externas/CMS siguen disponibles. La primera foto tiene prioridad; las inferiores usan carga diferida. El bundle se separó para reutilizar React/motion en caché; build sin aviso de chunks mayores a 500 kB.

El documento `Casa-del-Rey-Liquid-Glass.pen` contiene referencia de Inicio, materiales, Nosotros y Conéctate. Se actualizó la regla de diseño plano, sin emojis ni iconos. Las comprobaciones estructurales de Conéctate no reportan recortes. La inspección visual se realizó sobre el frontend real en móvil y escritorio.

## Verificación

- 27 pruebas locales de UI aprobadas: reglas visuales, 12 rutas a 390/1440 px y páginas principales a 320/768/1024 px, menú, ventanas, formularios críticos, imágenes y ausencia de 3D/iconos/emojis. API interceptada.
- Versión compilada: 11 comprobaciones de navegación, material, imágenes y controles aprobadas; reporte junto a este documento.
- Build aprobado; lint sin errores, con 20 advertencias existentes.
- Revisión de vidrio plano y Voluntariado: build, 15 pruebas de UI (28.0 s) y lint sin errores con las mismas 20 advertencias. Incluye fotos/textos simulados del administrador, segunda foto de fondo, ausencia de fotos dentro de tarjetas, paso al formulario y fondo continuo al hacer scroll. Reporte en frontend-real-glass-tests.txt. API interceptada; sin escrituras reales.
- Backend publicado: 19 comprobaciones aprobadas, incluidas R2 privado, login admin/member, idempotencia y bloqueo de descargas anónimas/member.
- Las pruebas Go/vet y la concurrencia local de doce donaciones aprobadas en la entrega previa siguen documentadas. No se hicieron cambios al ejecutable Go en esta revisión.

## Supabase

Verificado en Safari: proyecto Healthy. Se detectaron 27 tablas de aplicación con RLS desactivado y permisos directos para anon/authenticated. Se habilitó RLS, se revocaron permisos directos en las 28 tablas públicas y 26 secuencias, se restringieron permisos por defecto de futuras tablas/secuencias públicas y se fijó el search_path de `handle_new_user`, retirando su ejecución pública. El asesor pasó a indicar que no encontró incidencias.

Se guardaron ACL, configuración previa, rollback SQL y backup de datos fuera del repositorio, bajo `~/.codex/backups/casadelrey/`, con permisos privados. No se cambiaron filas reales. La conexión del backend actual usa el propietario con BYPASSRLS; health y eventos de Fly continúan en HTTP 200. El SQL reproducible está en `backend/scripts/harden_public_schema.sql` y el resultado agregado, sin datos personales, en `supabase-verification.json`.

QA mantiene su schema/rol `cdr_render_qa`, JWT independiente, dos usuarios sintéticos y cero acceso a tablas/secuencias de public/auth/storage. Pool de aplicación de tres conexiones y límite de rol cuatro. Se archivaron mediante soft-delete fixtures sintéticos anteriores conservando la última prueba de R2; no se tocaron registros reales.

## Render y archivos

- Backend Free: https://casadelrey-api-pruebas.onrender.com
- Frontend Static: https://casadelrey-web-pruebas.onrender.com

El backend fue desplegado desde `32384ed`. El frontend está Live desde `97d8a81`, despliegue `dep-dbgcqti9lscs739mmem0` (35.1 s). Se verificaron el contenido nuevo, la configuración de la API QA y el CSS de reflejos finos y los cuatro WebP de fondos grupales. Fotos WebP y headers fueron verificados en el despliegue previo `76ae5cc`. El reporte HTTP está en `frontend-deployed-verification.json`. Los despliegues automáticos están desactivados.

Con autorización explícita se amplió la credencial R2 existente a los dos buckets: medios y `casadelreyhue-receipts-private`. El privado tiene acceso público desactivado. Render ya usa R2; una prueba independiente aprobó PUT/GET/DELETE de un objeto sintético y las 19 comprobaciones del backend confirman el almacenamiento privado. No se copió el JWT ni la conexión de producción al backend QA. R2 sí es compartido por decisión expresa del usuario.

Se conserva un backup completo de producción, 669 entradas, fuera del repositorio. Los tres comprobantes reales con referencia histórica y sus objetos públicos aún no se migraron ni eliminaron.

## Pendientes de producción

1. Migrar los tres comprobantes históricos mediante copia privada verificada y backup de referencias; retirar originales públicos/caché tras validar.
2. Configurar el backend definitivo con base real y correo, comprobar autorización por registro, migraciones y flujos reales. Render actual usa datos de pruebas.
3. Conectar el dominio final y publicar el frontend definitivo con su configuración real.
4. Medir carga antes de afirmar capacidad para mil usuarios. Render Free duerme y su arranque en frío fue observado; no constituye la configuración recomendada para el lanzamiento.

La auditoría global de permisos, correo, metadatos y rendimiento no está certificada como cerrada. No se contrató un plan, no se cambió el dominio de producción y no se promovió el backend QA a producción.

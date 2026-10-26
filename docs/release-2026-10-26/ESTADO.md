# Estado de la entrega — 26 de octubre de 2026

## Diseño aplicado

Inicio usado como referencia e importado mediante el MCP de Pen al archivo `Casa-del-Rey-Liquid-Glass.pen`. El documento contiene la referencia, los tokens, un componente reutilizable de cristal y una composición de Nosotros. Las comprobaciones estructurales del canvas no reportaron recortes.

El frontend conserva el tono del blanco escarchado. El material oscuro usa un gradiente de blanco al 5%, 1.4% y 0.8%, con desenfoque de 8 px, borde fino y bisel estático. Se eliminaron las capas especulares de hover y el seguimiento del cursor/tacto, así como el hook de listeners que las alimentaba. Se conservan el movimiento de presión y la profundidad de las tarjetas.

PageHero unifica foto, scrim, ancho y espaciado; Eventos ya utiliza el mismo componente. Se eliminó el overlay duplicado que apagaba las fotos de los encabezados. Admin/líder/voluntario comparten material claro y fondo fotográfico tenue. Las imágenes de sección ahora permiten carga diferida y decodificación asíncrona.

Se normalizó la configuración de API para admitir base de dominio, `/api` y `/api/v1`, se corrigió el proxy del `vercel.json` raíz y se rechazan respuestas HTML antes de que un feed las interprete como listas. `.vercelignore` excluye fotos originales, documentos, diseños, secretos locales y artefactos de pruebas del upload.

## Validación

- Go: suite completa y `go vet ./...` aprobados.
- PostgreSQL 18 local desechable: doce peticiones concurrentes, una donación y un comprobante; prueba con detector de carreras aprobada. La prueba exige un host local y crea su propio schema.
- UI Chromium: diez pruebas aprobadas. Incluyen 12 rutas públicas a 390 y 1440 px sin desbordamiento horizontal, materiales estáticos, reset, modales, voluntario, donaciones y comprobantes privados. API interceptada; no se envían formularios de pruebas a producción.
- Build aprobado; lint sin errores, con 20 advertencias existentes. Persiste aviso por tamaño del bundle.
- Capturas locales de Home, Nosotros y Donar en ambas resoluciones en esta carpeta.

## Infraestructura observada

Supabase fue restaurado por el usuario. La API anterior de Fly vuelve a responder HTTP 200 en health, eventos y settings.

Se generó y verificó un backup completo en formato pg_dump: `~/.codex/backups/casadelrey/pre-release-2026-10-26.dump`, protegido con permisos 0600 y carpeta 0700. El índice del archivo contiene 669 entradas. No está dentro del repositorio ni se subió al hosting.

Inventario de solo lectura: tres registros de comprobantes con referencias antiguas y tres objetos en el prefijo público `comprobantes/`. El usuario informó haber preparado el bucket privado. La credencial activa de Fly todavía devolvió `AccessDenied` al listar objetos en `casadelreyhue-receipts-private`; falta comprobar PUT/GET con la credencial definitiva. No se cambiaron las referencias de la base ni se eliminaron objetos históricos.

## Despliegue

Vista previa Vercel construida y estado Ready:

https://casadelreyhue-flo7e0ux1-kevinml12s-projects.vercel.app

Se comprobó HTTP 200 en `/` y `/api/v1/events/` usando el acceso autorizado de Vercel. La vista previa puede requerir sesión de Vercel. No fue promovida a producción.

Fly rechazó la construcción de imagen con HTTP 403 por facturas vencidas. No se actualizó el backend ni se intentó cobrar. El usuario decidió preparar otro backend en otra cuenta. Falta conocer la nueva app/URL y configurar allí sus secretos antes de desplegar. El binario también se compila localmente para Linux; esto no equivale a una publicación.

## Pasos restantes para publicar

1. Confirmar la nueva app y acceso a su cuenta. Trasladar la configuración necesaria directamente a sus secretos, sin publicarla en el repositorio ni en el chat.
2. Comprobar acceso de objetos al bucket privado con esa credencial y migrar las tres boletas mediante copia verificada y backup de referencias. Retirar los originales públicos después de verificar la migración y su posible caché.
3. Construir/desplegar el backend en la nueva cuenta, comprobar migraciones aditivas, health y permisos con fixtures de staging.
4. Apuntar la API del frontend a la nueva app, construir la entrega definitiva y promoverla a producción. No promover el frontend nuevo contra un backend incompatible con el contrato de comprobantes privados.

La auditoría global conserva tareas de autorización por registro, correos reales, metadatos y rendimiento detalladas en el plan de mejora. Esta entrega no certifica que todos esos pendientes estén cerrados.

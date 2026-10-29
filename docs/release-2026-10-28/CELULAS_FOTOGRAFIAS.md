# Verificación de células y fotografías — 28 de octubre de 2026

**Auditoría previa a la importación.** La resolución posterior está documentada en `CONTENIDO_ACTIVO.md`.

La revisión fue de lectura. No se cambiaron publicaciones, asignaciones, permisos ni archivos de R2.

## Contenido y conexión

Supabase conserva **16 células activas y cinco categorías activas en `public`**. Por categoría: Varones 6, Adolescentes 4, Mujeres 4, Prejuveniles 1 y Jóvenes Adultos 1. Dos células y una categoría adicionales están inactivas y se excluyeron del total.

El backend Render y el frontend Vercel responden actualmente con cero células y cero categorías: usan `cdr_render_qa`, que está vacío para este contenido. La interfaz `/celulas` confirma «Sin células publicadas aún». Existir en el esquema histórico no equivale a estar visible a través del backend actual. Cambiar la conexión al esquema histórico requiere revisar también usuarios, roles y las demás colecciones; no se hizo una migración incidental durante esta auditoría.

Inicio todavía presenta cinco categorías mediante una lista local cuando la API está vacía. Es una inconsistencia con Células y con el criterio «todo definido por administradores»: debe sustituirse ese respaldo por el estado real del recurso.

## Fotografías asignadas en la base histórica

Las cinco categorías apuntan a archivos locales `/images/celulas/*.jpg`, no a R2. Los cinco originales y sus diez variantes WebP desplegadas respondieron HTTP 200; no son enlaces rotos. La asignación es por categoría, no una foto propia de cada célula.

| Categoría | Encuadre observado | Evaluación como fondo |
| --- | --- | --- |
| Adolescentes | Selfie horizontal de tres personas | Cambiar por una toma grupal amplia; no permite validar la célula concreta. |
| Jóvenes Adultos | Selfie horizontal con un rostro dominante | Cambiar por una toma grupal amplia; no permite validar la célula concreta. |
| Prejuveniles | Danza en vertical, persona dominante | Reemplazar por reunión o plano general relacionado con la categoría. |
| Varones | Retrato individual vertical | Reemplazar por una toma grupal o del espacio. |
| Mujeres | Tres personas en primer plano | Temática cercana, pero falta amplitud para el criterio panorámico. |

## R2

Se inventariaron metadatos de 717 objetos en `casadelreyhue-dev`, incluidos 687 en `galeria/`. La revisión visual se limitó a las 18 imágenes cuyos nombres sugerían relación con células, jóvenes o mujeres; no se presenta como inspección visual de los 717 objetos.

Las series `jovenes_1...8` y `mujeres_1...8` cargan, pero contienen proyección, predicación, selfies, retratos, danza y actividades de culto. No se deben asignar por nombre de archivo a las células: no existe una relación verificada con sus registros individuales. `general/...retiro-jovenes.jpg` es un plano de escenario y congregación, útil como ambiente general si se aprueba su contexto, sin acreditar una célula específica. `general/...foto_celular_grande.jpg` contiene ruido gris; se descarta como candidato visual.

## Siguiente corrección necesaria

Conectar o publicar de forma deliberada el contenido real en el entorno que corresponda, eliminar el respaldo local engañoso de Inicio y asignar desde el administrador fotografías grupales/panorámicas verificadas. Conservar los registros y la separación QA/producción mientras se prepara ese cambio. No reemplazar fotografías de grupos reales por asociación basada únicamente en edad aparente, nombre del archivo o carpeta.

Evidencia técnica resumida: `celulas-fotografias-verificacion.json`. No incluye credenciales, contactos, domicilios ni el inventario de comprobantes.

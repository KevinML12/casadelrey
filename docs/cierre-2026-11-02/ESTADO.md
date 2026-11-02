# Cierre técnico — 2 de noviembre de 2026

La iglesia todavía no tiene dominio y proporcionará sus propios datos bancarios. No se compran servicios ni se publican cuentas bancarias de ejemplo. Vercel y el frontend de Render apuntan al mismo backend de Render y a la misma base activa de Supabase; Render no constituye un entorno aislado para pruebas con escrituras.

## Cambios implementados

- Contraseñas nuevas de al menos 10 caracteres, con el límite real de bcrypt; inicio de sesión existente compatible. Cerrar sesión revoca la renovación y los accesos de esa sesión. Las promociones/destituciones simultáneas no pueden dejar el sistema sin administrador. Se retiró el importador con contraseña compartida; la semilla restante sólo funciona con autorización explícita y una base local desechable.
- Identidad de IP derivada de una cadena de proxies internos, límites específicos de envíos públicos y tiempos máximos del servidor. Los registros de acceso no incluyen consultas de URL con credenciales.
- Eventos con validación de fecha, hora, precio, aforo y plazo de pago. Un evento pasado no acepta nuevas inscripciones. Los pagos pendientes reservan cupo por un plazo administrable de 1–168 horas (24 por defecto); los rechazos y las reservas vencidas liberan cupos. Una aprobación tardía o corrección vuelve a comprobar disponibilidad bajo bloqueo de base de datos. Las reservas antiguas sin vencimiento explícito usan 24 horas desde su creación. El administrador puede consultar y reactivar eventos ocultos.
- Cada cambio financiero real agrega una decisión con actor, fecha, revisión y motivo dentro de la misma transacción. La reversión ya no borra el historial; si falla el registro de auditoría tampoco se confirma el cambio monetario. El panel enlaza al historial de ese comprobante o donación.
- Las nuevas cargas de comprobantes se registran antes de escribir el archivo y se vinculan al envío en la misma transacción. Límite de cargas privadas: 64 MiB/IP y 1 GiB total por 24 horas, además del límite por archivo. Sólo se limpia un archivo nuevo que siga sin vincular después de 24 horas; no se enumeran ni eliminan archivos históricos, comprobantes asociados o medios públicos. Ejecución de limpieza por hora.
- Galería con carga directa, hasta 20 fotos por selección, álbum explícito, progreso y reintento por archivo. Un fallo al guardar reutiliza la carga y la clave de envío; las fotografías ya publicadas no se duplican. Los títulos antiguos siguen agrupándose por compatibilidad. Las recomendaciones de voluntariado se definen con etiquetas editables de cada departamento, incluyendo departamentos nuevos; se migran los valores antiguos sin sobrescribir decisiones del administrador.
- Los avisos ordinarios de correo permanecen hasta siete días. Un estado nuevo sustituye el aviso anterior que aún espera en cola. El límite local total sigue siendo 250 por 24 horas, con hasta 225 avisos ordinarios y 25 lugares reservados para acciones de cuenta. Los enlaces de seguridad conservan su vencimiento corto. La cola no equivale a entrega inmediata ni garantiza llegada a la bandeja principal.
- Protección de contenido, contra inclusión en marcos, de tipo de contenido y de referente en la configuración de ambos frontends. Toolchain Go 1.26.10 y dependencias afectadas actualizadas.
- Flujo de validación automática sin credenciales productivas: backend con detección de carreras y PostgreSQL desechable, análisis estático y del binario Linux; frontend con lint, compilación y pruebas de navegador aisladas.

## Comprobaciones locales

- Suite completa de Go con detección de carreras: correcta. Incluye concurrencia real de PostgreSQL para donaciones idempotentes, trabajadores de correo, destituciones de administradores y competencia entre aprobación tardía y nueva reserva.
- 53 pruebas aisladas de navegador: correctas; visores y navegación a 320, 390, 768, 1024 y 1440 px y orientación horizontal. Tras los últimos cambios de administración, se repitieron 18 pruebas afectadas correctamente.
- Compilación de frontend y análisis estático de Go correctos. ESLint sin errores; 14 advertencias previas de organización/efectos quedan como mantenimiento, no se ocultaron.
- Binario Linux: cero vulnerabilidades aplicables al código según govulncheck; un aviso en un módulo requerido sin llamadas afectadas. npm informa cinco avisos moderados de la cadena ESLint/minimatch, arrastrada también por Recharts. Es una herramienta de construcción, no un módulo ejecutado en el navegador; no se aplicó la sugerencia de degradar ESLint a una versión antigua ni una sustitución incompatible de minimatch. Revisar actualizaciones compatibles de mantenimiento.
- Ninguna prueba funcional de este cierre envió correos reales, movió dinero, aprobó comprobantes reales o creó cuentas reales. Las pruebas con navegador interceptan la API y las de concurrencia usan una base local desechable.

## Pendientes de responsables y límites conocidos

1. La iglesia ingresa y valida sus datos bancarios oficiales en Configuración; mientras falten, la interfaz no ofrece instrucciones de depósito inventadas.
2. Adquirir dominio si lo deciden, configurar DNS y autenticar remitente. Mientras se use el remitente gratuito existente, revisar también correo no deseado.
3. Revisar los correos reales de las cuentas heredadas antes de entregar credenciales o depender de recuperación por correo. La mayoría usa un dominio heredado cuya titularidad no se ha confirmado. No se alteraron cuentas ni credenciales reales para adivinar direcciones.
4. Elegir alojamiento continuo si necesitan disponibilidad permanente: el backend gratuito puede dormir. No se cambió a un plan de pago. Los límites del correo gratuito impiden prometer envío instantáneo a miles de personas.
5. Separar base y almacenamiento de QA antes de hacer pruebas destructivas o con personas. Hoy ambos frontends son ventanas al mismo servicio activo.
6. Capacitación, aceptación con responsables y prueba de una transferencia/comprobante auténticos por la iglesia. No se integra una pasarela de tarjetas sin proveedor contratado; el flujo actual es depósito/transferencia con revisión manual y aportes presenciales.

Los respaldos diarios cifrados ya estaban activos y la restauración remota completa se verificó el 1 de noviembre. Se prepara además una instantánea de base antes de este despliegue. Los registros de despliegue y verificaciones posteriores se agregan al cerrar la publicación.

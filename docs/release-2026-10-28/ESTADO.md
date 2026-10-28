# Corrección del foco en la navegación compartida

La advertencia de Chromium «Blocked aria-hidden» provenía de Header: al pulsar un enlace móvil/tableta se ocultaba el menú antes de retirar el foco del enlace. Se reprodujo a 768 px; la regresión anterior falló al comprobar el destino del foco.

Se centralizó el cierre para mover el foco antes de aplicar aria-hidden/inert. Cubre todos los enlaces del menú, Escape, clic fuera, cambio de ruta y cierre de sesión. Al cruzar 1280 px, el foco se dirige al enlace activo de escritorio o al logo, incluyendo el caso en que CSS ya lo haya retirado al body. Se conserva el bloqueo de interacción y la exclusión de enlaces ocultos de la navegación accesible.

Validación local: 26 pruebas aprobadas, incluyendo diez enlaces sucesivos a 320, 768 y 1024 px; captura de advertencias mediante el registro del navegador, Escape, clic fuera y cambio a escritorio. Se conservaron las regresiones de formularios, ventanas y módulos públicos. Build correcto; lint sin errores, con 20 avisos anteriores.

El cambio sólo afecta navegación y foco. No cambia datos, fotografías ni configuración del backend.

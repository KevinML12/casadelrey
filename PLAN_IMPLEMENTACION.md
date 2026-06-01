# Plan de Implementación — Nuevos Requerimientos
# Casa del Rey · Mayo 2026

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Requerimientos completos](#2-requerimientos-completos)
3. [Análisis de brechas](#3-análisis-de-brechas)
4. [Plan por fases](#4-plan-por-fases)
5. [Despliegue recomendado](#5-despliegue-recomendado)
6. [Variables de entorno nuevas](#6-variables-de-entorno-nuevas)

---

## 1. Resumen ejecutivo

| Área | Estado | Esfuerzo |
|---|---|---|
| Pagos locales con tarjeta | ❌ No existe | Alto |
| Verificación boletas bancarias | ❌ No existe | Alto |
| Cobros en inscripciones | ❌ No existe | Medio |
| Blog → links a redes | ✅ Campo `redirect_url` existe | Bajo (solo UI) |
| Células → campos completos | ✅ Modelo completo | Bajo (solo UI) |
| Células → quitar CSV | ⚠️ CSV activos | Bajo |
| Voluntarios → 10 departamentos | ⚠️ Lista incompleta | Bajo |
| Paleta azul marino/blanco/negro/celeste | ⚠️ Usa M3 genérico | Medio |
| Líderes → códigos VX/MX/JX/PX/NX | ⚠️ String libre | Bajo |
| Voluntarios → dashboard de rol | ❌ No existe | Medio |
| Oraciones → solo líderes/admins | ⚠️ Es pública | Bajo |
| Oraciones → PDF semanal | ❌ No existe | Medio |

---

## 2. Requerimientos completos

### 2.1 Pagos

- **Descartar PayPal** como método de inscripción (mantener solo para donaciones voluntarias si aplica)
- **Sistema de cobros local con tarjeta** — integración con procesador guatemalteco (Visanet / BAC Credomatic / Banrural)
- **Verificación de boletas bancarias** — el usuario sube foto de comprobante, admin valida número de referencia contra banco
- Los cobros aplican para **inscripciones a eventos**, no para donaciones generales

### 2.2 Blog

- Cada post puede tener un `redirect_url` que lleve a la red social correspondiente
- En la vista pública del post, mostrar botón/enlace visible: "Ver en Instagram", "Ver en Facebook", etc.
- El campo `redirect_url` ya existe en el modelo `Post`

### 2.3 Células

Campos que debe capturar el formulario de reporte (todos ya en el modelo):

| Campo | Modelo | Estado |
|---|---|---|
| Código | `cell_code` | ✅ |
| Pastor | `pastor_name` | ✅ |
| Tema | `topic` | ✅ |
| Ofrenda | `offering` | ✅ |
| Convertidos | `converts` | ✅ |
| Reconciliados | `reconciled` | ✅ |
| Total asistentes | `total_attendees` | ✅ |
| Nuevos | `new_members` | ✅ |
| Fecha | `meeting_date` | ✅ |
| Líder | `leader_name` | ✅ |
| Anfitrión | `host_name` | ✅ |
| Dirección | `address` | ✅ |
| Teléfono anfitrión | `host_phone` | ✅ |
| Foto | `photo_url` | ✅ |
| Aprobación admin | `status` + `approved_by_id` | ✅ |

**Acciones pendientes:**
- Verificar que el formulario de `CellReportForm.jsx` renderice todos los campos
- **Eliminar** los 3 endpoints CSV y sus botones en UI
- El campo `cantidad` del sistema anterior queda sustituido por `total_attendees`

### 2.4 Voluntarios

Reemplazar la lista hardcoded de departamentos por exactamente estos 10:

| # | Departamento | Descripción |
|---|---|---|
| 1 | Alabanza | Equipo de música y adoración |
| 2 | Danza | Danza de adoración |
| 3 | Servidores | Recepción, atención al cliente, limpieza |
| 4 | Protocolo | Atención VIP (políticos, pastores invitados) |
| 5 | Pancartas | Días de culto |
| 6 | Maestros de niños | Enseñanza a niños durante cultos |
| 7 | Técnicos audiovisuales | Sonido, iluminación, video |
| 8 | Multimedia | Redes sociales, diseño, streaming |
| 9 | Oración | Intercesión y cobertura espiritual |
| 10 | Logística | Coordinación de eventos y espacios |

### 2.5 Paleta de colores

Reemplazar el sistema M3 genérico con los colores de marca:

| Token | Color | Hex sugerido |
|---|---|---|
| Primario (azul marino) | `#0D1B4B` | Fondo principal, headers |
| Secundario (celeste) | `#4A90D9` | Botones, acentos, links |
| Fondo claro | `#FFFFFF` | Superficies en claro |
| Texto / Contraste | `#0A0A0A` | Texto sobre claro |
| Hover oscuro | `#162260` | Estados hover sobre marino |

### 2.6 Líderes — Tipos de célula

Los códigos siguen este formato: `[TIPO][NÚMERO]`

| Código | Tipo | Ejemplo |
|---|---|---|
| VX | Hombres | H1, H2 |
| MX | Mujeres | M1, M2 |
| JX | Jóvenes (mixto) | J1, J2 |
| PX | Prejuveniles (adolescentes) | P1, P2 |
| NX | Niños | N1, N2 |

> **Nota:** Leonel lleva dos células (hombres + prejuveniles).

**Acciones:**
- Agregar validación en backend para que `cell_code` siga el patrón `[HMJPN]\d+`
- En el formulario de creación/edición de líder, cambiar input libre por selector de tipo + número
- Exponer `address` del líder en el directorio para control de nuevos miembros

### 2.7 Boletas de nuevos miembros

El modelo `MemberBoleta` ya tiene todos los campos requeridos:

```
date, inviter_name, inviter_phone, guest_name, guest_phone,
address, category (reconciliado|convertido|nuevo)
```

**Acción:** Verificar que el formulario frontend captura y muestra todos los campos.

### 2.8 Nuevos roles

| Rol | Acceso |
|---|---|
| `admin` | Panel completo + aprobaciones + gestión de usuarios |
| `leader` | Células, boletas, directorio de miembros |
| `volunteer` | Dashboard propio: ver tareas asignadas, metas, avances |

**Acciones:**
- Crear `VolunteerDashboard` — página con tareas del departamento asignado y metas
- Las tareas vienen del modelo `UserGoal` ya existente, filtradas por usuario

### 2.9 Composición de usuarios inicial

| Rol | Cantidad |
|---|---|
| Administradores | 2 (pastor y su hijo) |
| Líderes principales | 8 |
| Líderes secundarios | 8 |
| Líderes nuevos | 4 |
| Voluntarios | 90+ |
| Servidores | 90+ (departamento con más personas) |

### 2.10 Oraciones

- **Restringir acceso**: solo usuarios con rol `leader` o `admin` pueden ver y enviar peticiones de oración
- La ruta `/prayer` deja de ser pública; requiere login con rol válido
- **PDF semanal por persona**: cada semana generar un PDF individual por petición para distribución a los 8 encargados de oración
- Los 8 intercessores son líderes y administradores

---

## 3. Análisis de brechas

### Lo que NO cambia (ya implementado y correcto)
- Modelos de célula (`CellReport`) — completos ✅
- Modelos de boleta (`MemberBoleta`) — completos ✅
- Flujo de aprobación de reportes ✅
- Sistema de galería con fotos ✅
- Blog con `redirect_url` (solo falta mostrarlo en UI) ✅
- Roles base (admin / leader / volunteer / member) ✅

### Lo que cambia en backend

| Cambio | Archivo | Complejidad |
|---|---|---|
| Eliminar 3 endpoints CSV | `routes/routes.go` + handlers | Baja |
| Nuevo sistema de pagos con tarjeta | `handlers/payment.go` (nuevo) | Alta |
| Verificación de boletas bancarias | `handlers/payment.go` + `models/models.go` | Alta |
| Cobros en EventRegistration | `handlers/events.go` + `models/models.go` | Media |
| Validación `cell_code` formato | `handlers/cellreports.go` | Baja |
| Endpoint oraciones → requiere auth | `routes/routes.go` | Baja |
| Generación PDF semanal de oraciones | `handlers/petitions.go` (nuevo) | Media |
| Actualizar lista de departamentos | `handlers/volunteers.go` | Baja |

### Lo que cambia en frontend

| Cambio | Archivo | Complejidad |
|---|---|---|
| Paleta de colores CSS variables | `src/index.css` + `tailwind.config.js` | Media |
| Blog → mostrar botón de red social | `BlogPage.jsx` | Baja |
| Formulario célula → todos los campos | `CellReportForm.jsx` | Baja |
| Quitar botones exportar CSV | `AdminCellReports.jsx`, `AdminBoletas.jsx`, Dashboard | Baja |
| Selector tipo+código célula | `AdminUsers.jsx`, `LeaderIndex.jsx` | Baja |
| Oraciones → solo líderes/admins | `router.jsx` + `PrayerPage.jsx` | Baja |
| Dashboard de voluntarios | `VolunteerDashboard.jsx` (nuevo) | Media |
| UI de cobros en inscripciones | `EventsPage.jsx` + nuevo componente | Alta |
| UI verificación de boletas | Admin panel nuevo componente | Alta |

---

## 4. Plan por fases

### Fase 0 — Limpieza rápida *(1-2 días)*
**Sin riesgo, cambios menores**

- [ ] Eliminar 3 endpoints CSV del router y sus handlers
- [ ] Quitar botones de exportación en UI
- [ ] Actualizar lista de 10 departamentos de voluntarios en el handler
- [ ] Restringir ruta de oraciones a roles `leader`/`admin` en router
- [ ] Mostrar `redirect_url` en BlogPage como botón de red social
- [ ] Verificar que `CellReportForm.jsx` incluye todos los campos del modelo

---

### Fase 1 — Paleta de colores y UX *(2-3 días)*
**Impacto visual, bajo riesgo**

- [ ] Definir tokens exactos con el cliente (hexadecimales finales)
- [ ] Reemplazar variables CSS en `index.css` con paleta azul marino/celeste/blanco/negro
- [ ] Actualizar `tailwind.config.js` con nuevos tokens de color
- [ ] Revisar cada página pública y admin para consistencia visual
- [ ] Modo oscuro: decidir si se mantiene o se elimina

---

### Fase 2 — Tipos de célula y roles *(2-3 días)*
**Cambios de datos y navegación**

- [ ] Agregar validación de formato `cell_code` en backend (`[HMJPN]\d+`)
- [ ] Agregar selector tipo+número en formulario de creación de líderes
- [ ] Exponer campo `address` del líder en el endpoint de directorio
- [ ] Crear página `VolunteerDashboard.jsx` con tareas y metas del departamento
- [ ] Agregar ruta protegida `/volunteer/dashboard` en el router
- [ ] Testear que los 3 roles principales (admin/leader/volunteer) acceden correctamente

---

### Fase 3 — PDF semanal de oraciones *(3-4 días)*
**Nueva funcionalidad de reportes**

- [ ] Agregar dependencia de generación de PDF en Go (ej. `go-pdf/fpdf` o `chromedp`)
- [ ] Crear handler `GET /admin/petitions/weekly-pdf` que genere PDF por petición
- [ ] El PDF incluye: nombre, categoría, mensaje, fecha
- [ ] Añadir botón en `AdminPetitions.jsx` para descargar el paquete semanal
- [ ] Opcional: enviar por email automático cada lunes a los 8 intercessores

---

### Fase 4 — Sistema de pagos local *(1-2 semanas)*
**La parte más compleja — requiere decisión de procesador**

#### 4a — Verificación de boletas bancarias *(puede hacerse antes del procesador)*
- [ ] Agregar modelo `PaymentReceipt` en `models.go`:
  ```
  id, registration_id, receipt_image_url, bank_name,
  reference_number, amount, status (pendiente|verificado|rechazado),
  verified_by_id, verified_at, notes
  ```
- [ ] Handler para subir foto del comprobante
- [ ] Vista admin para revisar y aprobar/rechazar comprobantes
- [ ] Notificación por email al usuario cuando se aprueba/rechaza

#### 4b — Cobros en inscripciones a eventos
- [ ] Agregar campos al modelo `Event`: `requires_payment`, `price`, `currency`
- [ ] Agregar campo `payment_status` a `EventRegistration`
- [ ] Flujo: al registrarse en evento de pago → seleccionar método → subir comprobante → esperar aprobación admin

#### 4c — Terminal virtual con tarjeta *(depende del banco/procesador)*
- [ ] **Decidir procesador**: Visanet Guatemala, BAC Credomatic, Banrural, o pasarela como Pagadito
- [ ] Integrar SDK o API REST del procesador elegido
- [ ] Crear formulario de tarjeta (PCI: usar iframe del procesador, no capturar datos directamente)
- [ ] Registrar transacciones en modelo `Donation` con método `tarjeta`

> **Nota importante:** El número de cuenta/merchant y credenciales del procesador las debe proveer el cliente. Esta fase no puede comenzar sin esa información.

---

## 5. Despliegue recomendado

### Stack recomendado: Vercel + Fly.io + Supabase + Cloudflare

```
Internet → Cloudflare (DNS + CDN + firewall)
               ├── casadelreyhue.org → Vercel (React frontend)
               └── api.casadelreyhue.org → Fly.io (Go backend)
                                               └── Supabase (PostgreSQL + Storage)
```

---

### Vercel — Frontend (React)

**¿Por qué?**
- Deploy automático desde GitHub en cada push a `main`
- CDN global gratis (edge en Latinoamérica incluido)
- Preview URLs por cada PR para revisar cambios antes de producción
- Soporte nativo para Vite/React sin configuración
- Plan Free cubre perfectamente este volumen de tráfico

**Config necesaria:**
```json
// vercel.json en /frontend
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

### Fly.io — Backend (Go)

**¿Por qué?**
- Ya está configurado y desplegado (`fly.toml` existente)
- Máquinas en región SCL (Santiago, más cercano a Guatemala que US-East)
- Docker nativo — el `Dockerfile` actual funciona sin cambios
- Plan Free: 3 máquinas compartidas, 160GB transferencia/mes
- Escalado automático según carga

**No cambiar nada** — mantener el setup actual.

---

### Supabase — Base de datos + Storage

**¿Por qué?**
- Ya está configurado (PostgreSQL + pooler)
- Storage de Supabase para imágenes de comprobantes y fotos de células
- Plan Free: 500MB DB, 1GB Storage — suficiente para iniciar
- Dashboard visual para revisar datos sin herramientas externas

**Acción nueva:** Usar **Supabase Storage** para las fotos de comprobantes bancarios (fase 4a) en lugar de otro servicio de archivos.

---

### Cloudflare — DNS + CDN + Seguridad

**¿Por qué?**
- Gratis para el plan Free (DNS, CDN, SSL automático, firewall básico)
- Protección DDoS sin configuración
- Analytics básico sin cookies (GDPR friendly)
- Caché automático para assets estáticos (imágenes, JS, CSS)
- Proxy para el dominio `casadelreyhue.org` → oculta IPs reales

**Config:**
- Registrar `casadelreyhue.org` en Cloudflare DNS
- CNAME `@` → Vercel
- CNAME `api` → Fly.io app
- SSL/TLS modo: Full (strict)
- Cache Rules: cachear `/assets/*`, bypass `/api/*`

---

### Comparación final de opciones

| Servicio | Vercel | Fly.io | Supabase | Cloudflare |
|---|---|---|---|---|
| **Rol** | Frontend CDN | API server | DB + Storage | DNS + Cache |
| **Costo inicial** | Gratis | Gratis | Gratis | Gratis |
| **Escalado** | Automático | Manual/auto | Automático | Automático |
| **Región Guatemala** | Edge global | SCL (Chile) | US-East | Edge global |
| **CI/CD** | Nativo Git | Manual/GitHub Actions | — | — |
| **Ya configurado** | Parcial | ✅ Sí | ✅ Sí | ❌ Falta DNS |

### ¿Por qué no solo Cloudflare Pages para el frontend?

Cloudflare Pages es viable pero Vercel tiene mejor DX para React/Vite, logs más claros, y las preview deployments por PR son fundamentales para revisar cambios del cliente antes de publicar. Cloudflare cumple mejor el rol de capa intermedia (DNS + firewall) que de host de frontend.

### Costo mensual estimado en producción

| Servicio | Tier | Costo |
|---|---|---|
| Vercel | Pro (si se supera Free) | $20/mes |
| Fly.io | Pay-as-you-go | ~$5-15/mes |
| Supabase | Pro (si se supera Free) | $25/mes |
| Cloudflare | Free / Pro | $0-20/mes |
| **Total** | Escalando | **~$0 inicial → ~$60 a escala** |

---

## 6. Variables de entorno nuevas

A agregar en Fly.io secrets y en `.env.local` del frontend:

```env
# Procesador de pagos (definir según banco elegido)
PAYMENT_PROCESSOR_API_KEY=
PAYMENT_PROCESSOR_MERCHANT_ID=
PAYMENT_PROCESSOR_SECRET=
PAYMENT_PROCESSOR_MODE=sandbox   # sandbox | live

# Supabase Storage (para comprobantes)
SUPABASE_STORAGE_BUCKET=receipts

# PDF (si se usa servicio externo)
PDF_SERVICE_URL=

# Correos para PDF semanal de oraciones
PRAYER_EMAIL_RECIPIENTS=lider1@iglesia.org,lider2@iglesia.org,...
```

---

## Orden de implementación sugerido

```
Semana 1:  Fase 0 (limpieza) + inicio Fase 1 (paleta)
Semana 2:  Fin Fase 1 + Fase 2 (tipos célula + dashboard voluntario)
Semana 3:  Fase 3 (PDFs oraciones)
Semana 4+: Fase 4 (pagos) — requiere datos del procesador bancario del cliente
```

> La Fase 4 es bloqueante por información externa (credenciales del procesador). Iniciar conversación con el banco/procesador en paralelo con las fases 0-3.
